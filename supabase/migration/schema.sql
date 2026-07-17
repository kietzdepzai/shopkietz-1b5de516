-- ============================================================
-- ShopKietZ – FULL schema export for a fresh Supabase project
-- Target project (user's own): diyucsqdeydnznrijmyt
--
-- HOW TO USE:
--   1) Open your Supabase Dashboard → SQL Editor → New query
--   2) Paste the ENTIRE content of this file and click "Run"
--   3) Then run supabase/migration/README.md steps to import data
--
-- Notes:
--   - Uses auth.users from Supabase Auth (already exists).
--   - All public tables have RLS enabled + GRANTs for Data API.
--   - Storage bucket "images" is created at the end.
-- ============================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Enum: app_role ----------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Tables
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text,
  display_name  text,
  full_name     text,
  avatar_url    text,
  phone         text,
  balance       integer NOT NULL DEFAULT 0,
  transfer_code text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- categories
CREATE TABLE IF NOT EXISTS public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  image_url  text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  price        integer NOT NULL,
  stock        integer NOT NULL DEFAULT 0,
  category     text NOT NULL,
  image_url    text,
  status       text NOT NULL DEFAULT 'active',
  product_type text DEFAULT 'account',
  account_info text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- product_accounts (inventory)
CREATE TABLE IF NOT EXISTS public.product_accounts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  account_info     text NOT NULL,
  is_sold          boolean NOT NULL DEFAULT false,
  sold_to_order_id uuid,
  created_at       timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_accounts TO authenticated;
GRANT ALL ON public.product_accounts TO service_role;
ALTER TABLE public.product_accounts ENABLE ROW LEVEL SECURITY;

-- orders
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name     text NOT NULL,
  product_category text NOT NULL,
  price            integer NOT NULL,
  account_info     text,
  order_code       text,
  status           text NOT NULL DEFAULT 'success',
  created_at       timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- boost_orders
CREATE TABLE IF NOT EXISTS public.boost_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL,
  product_name      text NOT NULL,
  price             integer NOT NULL,
  account_username  text NOT NULL,
  account_password  text NOT NULL,
  customer_note     text,
  admin_note        text,
  status            text NOT NULL DEFAULT 'pending',
  refunded          boolean NOT NULL DEFAULT false,
  order_code        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.boost_orders TO authenticated;
GRANT ALL ON public.boost_orders TO service_role;
ALTER TABLE public.boost_orders ENABLE ROW LEVEL SECURITY;

-- discount_codes
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  discount_percent  integer NOT NULL DEFAULT 0,
  discount_amount   integer NOT NULL DEFAULT 0,
  max_uses          integer,
  used_count        integer NOT NULL DEFAULT 0,
  min_order_amount  integer NOT NULL DEFAULT 0,
  is_active         boolean NOT NULL DEFAULT true,
  expires_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discount_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- topup_requests
CREATE TABLE IF NOT EXISTS public.topup_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      integer NOT NULL,
  method      text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  note        text,
  reviewed_by uuid REFERENCES auth.users(id),
  request_id  text,
  card_result text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.topup_requests TO authenticated;
GRANT ALL ON public.topup_requests TO service_role;
ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

-- ctv_assignments
CREATE TABLE IF NOT EXISTS public.ctv_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  user_id             uuid,
  assigned_categories text[] NOT NULL DEFAULT '{}',
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ctv_assignments TO authenticated;
GRANT ALL ON public.ctv_assignments TO service_role;
ALTER TABLE public.ctv_assignments ENABLE ROW LEVEL SECURITY;

-- shop_settings
CREATE TABLE IF NOT EXISTS public.shop_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shop_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.shop_settings TO authenticated;
GRANT ALL ON public.shop_settings TO service_role;
ALTER TABLE public.shop_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Functions (SECURITY DEFINER helpers)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.is_active_ctv(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ctv_assignments
    WHERE lower(email) = lower((SELECT email FROM auth.users WHERE id=_user_id))
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ctv_for_category(_user_id uuid, _category text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.ctv_assignments
    WHERE lower(email) = lower((SELECT email FROM auth.users WHERE id=_user_id))
      AND is_active = true
      AND _category = ANY(assigned_categories)
  );
$$;

CREATE OR REPLACE FUNCTION public.username_available(p_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username)=lower(p_username));
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT u.email FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  WHERE lower(p.username)=lower(p_username) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.generate_transfer_code()
RETURNS text LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE new_code text; code_exists boolean;
BEGIN
  LOOP
    new_code := 'VAK' || lpad(floor(random()*1000)::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE transfer_code=new_code) INTO code_exists;
    IF NOT code_exists THEN RETURN new_code; END IF;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.assign_transfer_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NEW.transfer_code IS NULL THEN
    NEW.transfer_code := public.generate_transfer_code();
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.raw_user_meta_data->>'username'
  );
  RETURN NEW;
END; $$;

-- (Business RPCs purchase_product, purchase_product_batch, purchase_boost,
--  cancel_boost_order, get_recent_purchases, get_topup_leaderboard
--  are omitted here for brevity — copy them from
--  supabase/migrations/*.sql in this repo if needed.)

-- ============================================================
-- Triggers
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_assign_transfer_code ON public.profiles;
CREATE TRIGGER profiles_assign_transfer_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_transfer_code();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_boost_orders_updated_at ON public.boost_orders;
CREATE TRIGGER update_boost_orders_updated_at BEFORE UPDATE ON public.boost_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_topup_requests_updated_at ON public.topup_requests;
CREATE TRIGGER update_topup_requests_updated_at BEFORE UPDATE ON public.topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS Policies
-- ============================================================

-- profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- categories
CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- products
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (status='active' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- product_accounts
CREATE POLICY "Admins full access product_accounts" ON public.product_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- boost_orders
CREATE POLICY "Users view own boost orders" ON public.boost_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own boost orders" ON public.boost_orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all boost orders" ON public.boost_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update boost orders" ON public.boost_orders
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- discount_codes
CREATE POLICY "Public can view valid discount codes" ON public.discount_codes
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY "Admins can manage discount codes" ON public.discount_codes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- topup_requests
CREATE POLICY "Users can view own topup requests" ON public.topup_requests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create topup requests" ON public.topup_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all topup requests" ON public.topup_requests
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update topup requests" ON public.topup_requests
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- ctv_assignments
CREATE POLICY "Admins can manage CTV" ON public.ctv_assignments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "CTV can view assignment by email" ON public.ctv_assignments
  FOR SELECT TO authenticated
  USING (lower(email) = lower((auth.jwt() ->> 'email')));

-- shop_settings
CREATE POLICY "Anyone can view shop settings" ON public.shop_settings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage shop settings" ON public.shop_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============================================================
-- Storage bucket "images" (public)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images','images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');
CREATE POLICY "Authenticated upload images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');
CREATE POLICY "Authenticated update images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'images');
CREATE POLICY "Authenticated delete images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'images');

-- Done.
