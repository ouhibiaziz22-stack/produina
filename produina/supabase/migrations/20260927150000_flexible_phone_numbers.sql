-- Accept Tunisian phone numbers the way people type them (with or without +216, spaces,
-- dots or dashes) and store them in one format: "+216 50 548 454".
CREATE OR REPLACE FUNCTION public.submit_preorder(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  request_type text := payload->>'requestType';
  customer_name text := trim(coalesce(payload->>'name', ''));
  customer_email text := lower(trim(coalesce(payload->>'email', '')));
  notes text := nullif(trim(coalesce(payload->>'notes', '')), '');
  phone text := trim(coalesce(payload->>'phone', ''));
  -- Same rules as the storefront: "50548454", "50 548 454", "+216 50 548 454", "0021650548454".
  phone_digits text := regexp_replace(regexp_replace(phone, '[\s().-]', '', 'g'), '^(\+216|00216)', '');
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip text := nullif(trim(split_part(coalesce(headers->>'x-forwarded-for', ''), ',', 1)), '');
  sections text[] := ARRAY['Math', 'Sciences', 'Technique', 'Info', 'Éco-Gestion', 'Lettres', 'Sport'];
  item jsonb;
  product public.products;
  line_items jsonb := '[]'::jsonb;
  total numeric := 0;
  item_count integer := 0;
  qty integer;
  size text;
  custom jsonb;
  new_id uuid;
BEGIN
  -- Honeypot: bots fill the hidden "website" field. Answer like a success and store nothing.
  IF coalesce(payload->>'website', '') <> '' THEN RETURN jsonb_build_object('received', true); END IF;

  IF request_type NOT IN ('preorder', 'bulk') THEN RAISE EXCEPTION 'Invalid request type'; END IF;
  IF length(customer_name) NOT BETWEEN 2 AND 120 THEN RAISE EXCEPTION 'Please enter your full name.'; END IF;
  IF customer_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(customer_email) > 254 THEN
    RAISE EXCEPTION 'Please enter a valid email address.';
  END IF;
  IF length(coalesce(notes, '')) > 2000 THEN RAISE EXCEPTION 'Notes are too long.'; END IF;

  IF (SELECT count(*) FROM public.preorder_requests
      WHERE email = customer_email AND created_at > now() - interval '1 hour') >= 5
    OR (ip IS NOT NULL AND (SELECT count(*) FROM public.preorder_requests
      WHERE client_ip = ip AND created_at > now() - interval '1 hour') >= 10) THEN
    RAISE EXCEPTION 'Too many requests. Please try again later.';
  END IF;

  IF request_type = 'bulk' THEN
    qty := CASE WHEN payload->>'quantity' ~ '^\d{1,5}$' THEN (payload->>'quantity')::integer END;
    IF qty IS NULL OR qty NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Enter a quantity between 1 and 10000.'; END IF;
    INSERT INTO public.preorder_requests
      (user_id, customer_name, email, phone, school, request_type, items, quantity, notes, client_ip)
    VALUES (auth.uid(), customer_name, customer_email, left(phone, 30),
      nullif(left(trim(coalesce(payload->>'school', '')), 150), ''), 'bulk',
      jsonb_build_array(jsonb_build_object('product', 'BAC 2K27 capsule', 'quantity', qty)), qty, notes, ip)
    RETURNING id INTO new_id;
    RETURN jsonb_build_object('received', true, 'id', new_id);
  END IF;

  IF phone_digits !~ '^[2-9]\d{7}$' THEN
    RAISE EXCEPTION 'Enter a Tunisian phone number, for example 50 548 454.';
  END IF;
  phone := '+216 ' || substr(phone_digits, 1, 2) || ' ' || substr(phone_digits, 3, 3) || ' ' || substr(phone_digits, 6);
  IF length(trim(coalesce(payload->>'governorate', ''))) NOT BETWEEN 2 AND 60 THEN
    RAISE EXCEPTION 'Please choose your governorate.';
  END IF;
  IF jsonb_typeof(payload->'items') <> 'array' OR jsonb_array_length(payload->'items') NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'Your bag must contain between 1 and 20 items.';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    IF coalesce(item->>'productId', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'A product in your bag is no longer available. Please refresh and try again.';
    END IF;
    SELECT * INTO product FROM public.products WHERE id = (item->>'productId')::uuid AND active;
    IF product.id IS NULL THEN
      RAISE EXCEPTION 'A product in your bag is no longer available. Please refresh and try again.';
    END IF;
    size := item->>'size';
    IF size IS NULL OR NOT (product.sizes ? size) THEN
      RAISE EXCEPTION 'Size % is not available for %.', coalesce(size, '?'), product.name;
    END IF;
    qty := CASE WHEN item->>'quantity' ~ '^\d{1,2}$' THEN (item->>'quantity')::integer END;
    IF qty IS NULL OR qty NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Quantity must be between 1 and 25.'; END IF;

    custom := NULL;
    IF jsonb_typeof(item->'customization') = 'object' THEN
      custom := jsonb_build_object(
        'studentName', trim(coalesce(item->'customization'->>'studentName', '')),
        'lycee', trim(coalesce(item->'customization'->>'lycee', '')),
        'section', item->'customization'->>'section');
      IF length(custom->>'studentName') NOT BETWEEN 2 AND 100
        OR length(custom->>'lycee') NOT BETWEEN 2 AND 150
        OR NOT (custom->>'section' = ANY (sections)) THEN
        RAISE EXCEPTION 'Check the student name, lycée and section for %.', product.name;
      END IF;
    END IF;
    IF product.category = 'bac' AND custom IS NULL THEN
      RAISE EXCEPTION '% needs the student name, lycée and section.', product.name;
    END IF;

    line_items := line_items || jsonb_build_object(
      'productId', product.id, 'product', product.name, 'category', product.category, 'size', size,
      'quantity', qty, 'unitPrice', product.base_price, 'lineTotal', product.base_price * qty,
      'customization', custom);
    total := total + product.base_price * qty;
    item_count := item_count + qty;
  END LOOP;

  INSERT INTO public.preorder_requests
    (user_id, customer_name, email, phone, governorate, request_type, items, quantity, estimated_total, notes, client_ip)
  VALUES (auth.uid(), customer_name, customer_email, phone, trim(payload->>'governorate'), 'preorder',
    line_items, item_count, total, notes, ip)
  RETURNING id INTO new_id;
  RETURN jsonb_build_object('received', true, 'id', new_id);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_preorder(jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_preorder(jsonb) TO anon, authenticated;
