CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email text NOT NULL UNIQUE,
  phone text,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'main' CHECK (category IN ('main', 'bac')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  type text NOT NULL CHECK (type IN ('hoodie', 'jacket', 'tshirt', 'polo', 'oversized', 'other')),
  description text NOT NULL,
  base_price numeric(10,2) NOT NULL CHECK (base_price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  fabrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  print_prices jsonb NOT NULL DEFAULT '[]'::jsonb,
  color_zones jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_color_modes jsonb NOT NULL DEFAULT '[1,2]'::jsonb,
  model3d jsonb,
  sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_stock_check;
ALTER TABLE public.products ADD CONSTRAINT products_stock_check CHECK (stock >= 0);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_address text NOT NULL,
  governorate text NOT NULL,
  phone text NOT NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  extras numeric(10,2) NOT NULL DEFAULT 0 CHECK (extras >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash_on_delivery', 'online')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  bac_type text NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  product_color text NOT NULL,
  fabric text NOT NULL,
  front_design jsonb,
  back_design jsonb,
  logo jsonb,
  texts jsonb NOT NULL DEFAULT '[]'::jsonb,
  extras jsonb NOT NULL DEFAULT '[]'::jsonb,
  size text NOT NULL,
  total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bac_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  image text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_active_idx ON public.products(category, active);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS designs_user_id_idx ON public.designs(user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bac_categories ENABLE ROW LEVEL SECURITY;
