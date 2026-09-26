CREATE TABLE public.preorder_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  school text,
  phone text NOT NULL DEFAULT '',
  governorate text NOT NULL DEFAULT '',
  request_type text NOT NULL CHECK (request_type IN ('preorder', 'bulk')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 10000),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.preorder_requests TO anon, authenticated;
GRANT ALL ON public.preorder_requests TO service_role;
ALTER TABLE public.preorder_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors may submit preorder requests" ON public.preorder_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.set_preorder_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER set_preorder_updated_at BEFORE UPDATE ON public.preorder_requests FOR EACH ROW EXECUTE FUNCTION public.set_preorder_updated_at();