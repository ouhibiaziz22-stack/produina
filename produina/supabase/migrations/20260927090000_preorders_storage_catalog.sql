-- Pre-orders are now written only by the API (service role), never directly by browsers.
DROP POLICY IF EXISTS "Visitors may submit preorder requests" ON public.preorder_requests;
REVOKE ALL ON public.preorder_requests FROM anon, authenticated;

ALTER TABLE public.preorder_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.preorder_requests ADD COLUMN IF NOT EXISTS estimated_total numeric(10,2) NOT NULL DEFAULT 0 CHECK (estimated_total >= 0);
ALTER TABLE public.preorder_requests ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE public.preorder_requests DROP CONSTRAINT IF EXISTS preorder_requests_status_check;
ALTER TABLE public.preorder_requests ADD CONSTRAINT preorder_requests_status_check
  CHECK (status IN ('new', 'contacted', 'confirmed', 'converted', 'cancelled'));
CREATE INDEX IF NOT EXISTS preorder_requests_created_at_idx ON public.preorder_requests(created_at DESC);

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('order_created', 'order_status', 'preorder_created', 'system'));

CREATE OR REPLACE FUNCTION public.notify_admin_preorder()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications(type, title, message, metadata)
  VALUES ('preorder_created',
    CASE WHEN NEW.request_type = 'bulk' THEN 'New bulk inquiry' ELSE 'New pre-order request' END,
    NEW.customer_name || ' sent a ' || NEW.request_type || ' request.',
    jsonb_build_object('preorderId', NEW.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS preorder_admin_notification ON public.preorder_requests;
CREATE TRIGGER preorder_admin_notification
  AFTER INSERT ON public.preorder_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_preorder();

-- Public bucket for product images uploaded through the admin API.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Launch catalog. IDs match the storefront's offline fallback so carts stay valid.
INSERT INTO public.products (id, category, name, type, description, base_price, stock, colors, fabrics, sizes, images) VALUES
  ('19464c0d-686f-44c5-bb3a-5eed53f9b465', 'main', 'Volt Hoodie', 'hoodie', 'A heavyweight silhouette cut for late nights. Brushed fleece, dropped shoulders and a reflective AZIX storm mark.', 128, 50, '["Obsidian","Static Grey","Electric"]', '[{"name":"460 GSM fleece","price":0}]', '["S","M","L","XL"]', '[]'),
  ('19f7fb9e-8a58-4384-9dab-abb59312e92e', 'main', 'Static Shell', 'jacket', 'A cropped technical shell with an articulated hood and a midnight nylon finish. Built to change with the weather.', 184, 30, '["Night","Cloud"]', '[{"name":"Technical nylon","price":0}]', '["S","M","L","XL"]', '[]'),
  ('5a92efac-8c28-4d14-9eff-181c7ba2a6da', 'main', 'Arc Tee', 'tshirt', 'A dense cotton jersey tee with a precise oversized cut and an electric-blue arc printed across the back.', 74, 80, '["Ink","Bone","Cobalt"]', '[{"name":"240 GSM cotton","price":0}]', '["S","M","L","XL"]', '[]'),
  ('d12edfb7-4d75-4490-815c-923077fbf718', 'main', 'Afterdark Pant', 'other', 'A relaxed technical trouser with a sharp tapered line, hidden pockets and a subtle reflective side seam.', 142, 40, '["Carbon","Storm Grey"]', '[{"name":"Structured twill","price":0}]', '["S","M","L","XL"]', '[]'),
  ('966f377b-ba0f-4f79-bf68-614f49e7ec3f', 'main', 'Ion Cap', 'other', 'A structured six-panel cap with a low profile, concealed adjuster and a flash of reflective embroidery.', 58, 60, '["Obsidian","Electric"]', '[{"name":"Cotton twill","price":0}]', '["One size"]', '["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=1100&q=84"]'),
  ('969522b0-e206-41cd-b759-3175014c97e1', 'main', 'Strike Knit', 'other', 'A compact rib knit engineered with a close collar, dropped sleeve and a clean lightning-bolt stitch detail.', 112, 40, '["Graphite","Ice"]', '[{"name":"Rib knit","price":0}]', '["S","M","L","XL"]', '["https://images.unsplash.com/photo-1624206112918-f140f087f9b5?auto=format&fit=crop&w=1100&q=84"]'),
  ('99c3756a-d429-4053-b53a-84607c361244', 'bac', '2K27 Class Hoodie', 'hoodie', 'The Class of 2027 heavyweight hoodie. Add your name, lycée and section.', 89, 100, '["Noir","Navy","Bordeaux"]', '[{"name":"Heavyweight fleece","price":0}]', '["S","M","L","XL"]', '[]'),
  ('df26c824-8c4a-45c5-a5ff-0dfbdc910dd4', 'bac', '2K27 Class Tee', 'tshirt', 'A heavy cotton class tee for graduation season and group orders.', 46, 100, '["Noir","Royal Blue","White"]', '[{"name":"Heavy cotton","price":0}]', '["S","M","L","XL"]', '[]'),
  ('fa3e9fc6-d53c-4501-b243-dafd05e23920', 'bac', '2K27 Varsity Jacket', 'jacket', 'A water-resistant varsity shell finished with your class details.', 149, 50, '["Noir","Navy"]', '[{"name":"Water-resistant shell","price":0}]', '["S","M","L","XL"]', '[]'),
  ('8d036403-7bc2-46cb-b397-4209dd9e314f', 'bac', '2K27 Class Cargo', 'other', 'A relaxed technical cotton cargo for the class of 2027.', 108, 50, '["Carbon","Sand"]', '[{"name":"Technical cotton","price":0}]', '["S","M","L","XL"]', '[]')
ON CONFLICT (id) DO NOTHING;
