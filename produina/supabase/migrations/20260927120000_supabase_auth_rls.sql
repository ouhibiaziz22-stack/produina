-- The browser talks to Supabase directly. Supabase Auth handles sign-in; Row Level Security
-- and SECURITY DEFINER functions enforce every rule the old Express API used to enforce.
--
-- First admin on a fresh project: sign up through the storefront, then run
--   update public.profiles set role = 'admin' where email = 'you@example.com';

-- ---------------------------------------------------------------- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Carry over accounts from the old custom users table (already imported into auth.users).
INSERT INTO public.profiles (id, email, name, phone, address, role, created_at)
SELECT u.id, u.email, u.name, u.phone, u.address, u.role, u.created_at
FROM public.users u JOIN auth.users a ON a.id = u.id
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    left(coalesce(nullif(trim(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)), 100),
    left(nullif(trim(NEW.raw_user_meta_data->>'phone'), ''), 30)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Point customer references at profiles, then retire the table that stored password hashes.
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
ALTER TABLE public.designs DROP CONSTRAINT IF EXISTS designs_user_id_fkey;
ALTER TABLE public.designs ADD CONSTRAINT designs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.preorder_requests DROP CONSTRAINT IF EXISTS preorder_requests_user_id_fkey;
ALTER TABLE public.preorder_requests ADD CONSTRAINT preorder_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
DROP TABLE IF EXISTS public.users;

-- ---------------------------------------------------------------- helpers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ---------------------------------------------------------------- grants
-- Supabase grants everything to anon/authenticated by default; RLS below decides which rows.
-- Writes that anonymous visitors never need are removed outright as a second layer.
REVOKE INSERT, UPDATE, DELETE ON public.products, public.orders, public.designs,
  public.bac_categories, public.notifications, public.profiles FROM anon;
REVOKE ALL ON public.preorder_requests FROM anon;
GRANT SELECT, UPDATE ON public.preorder_requests TO authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
-- Users may edit their own contact details, never their email or role.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, phone, address) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------- policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: read own or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Products: read active" ON public.products FOR SELECT TO anon, authenticated
  USING (active OR public.is_admin());
CREATE POLICY "Products: admin insert" ON public.products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "Products: admin update" ON public.products FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Products: admin delete" ON public.products FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "Orders: read own or admin" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Orders: admin update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Pre-orders: admin read" ON public.preorder_requests FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Pre-orders: admin update" ON public.preorder_requests FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Notifications: admin read" ON public.notifications FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Notifications: admin update" ON public.notifications FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Designs: owner all" ON public.designs FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Designs: admin read" ON public.designs FOR SELECT TO authenticated
  USING (public.is_admin());
CREATE POLICY "Designs: admin delete" ON public.designs FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "BAC categories: read active" ON public.bac_categories FOR SELECT TO anon, authenticated
  USING (active OR public.is_admin());
CREATE POLICY "BAC categories: admin write" ON public.bac_categories FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Product images: admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Product images: admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Product images: admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "Product images: admin list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- ---------------------------------------------------------------- admin actions
CREATE OR REPLACE FUNCTION public.set_user_role(target_id uuid, new_role text)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF new_role NOT IN ('user', 'admin') THEN RAISE EXCEPTION 'Invalid user role'; END IF;
  IF target_id = auth.uid() AND new_role <> 'admin' THEN
    RAISE EXCEPTION 'You cannot remove your own admin access';
  END IF;
  UPDATE public.profiles SET role = new_role, updated_at = now() WHERE id = target_id RETURNING * INTO result;
  IF result.id IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.set_user_role(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;

-- ---------------------------------------------------------------- pre-orders
ALTER TABLE public.preorder_requests ADD COLUMN IF NOT EXISTS client_ip text;
CREATE INDEX IF NOT EXISTS preorder_requests_email_created_idx ON public.preorder_requests(email, created_at DESC);
CREATE INDEX IF NOT EXISTS preorder_requests_ip_created_idx ON public.preorder_requests(client_ip, created_at DESC);

-- The only way to create a pre-order. Validates everything and prices items from the database,
-- so the browser's total is never trusted.
CREATE OR REPLACE FUNCTION public.submit_preorder(payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  request_type text := payload->>'requestType';
  customer_name text := trim(coalesce(payload->>'name', ''));
  customer_email text := lower(trim(coalesce(payload->>'email', '')));
  notes text := nullif(trim(coalesce(payload->>'notes', '')), '');
  phone text := trim(coalesce(payload->>'phone', ''));
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

  IF phone !~ '^\+216\s?[2-9]\d\s?\d{3}\s?\d{3}$' THEN
    RAISE EXCEPTION 'Use a Tunisian phone number such as +216 20 123 456';
  END IF;
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

-- Internal helpers must not be callable through the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_order_change() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_admin_preorder() FROM public, anon, authenticated;
