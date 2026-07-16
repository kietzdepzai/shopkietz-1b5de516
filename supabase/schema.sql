-- ============================================================
-- ShopKietZ – Database schema snapshot
-- Keep in sync with any migration in supabase/migrations/*.
-- No schema changes were introduced by the "category page / homepage
-- category grid" refactor (frontend-only change).
-- ============================================================

-- ---------- Enums ----------
-- app_role: 'admin' | 'user' | 'ctv'

-- ---------- profiles ----------
-- Public user profile mapped 1-1 to auth.users.
CREATE TABLE public.profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE,
  username     text,
  display_name text,
  avatar_url   text,
  balance      integer NOT NULL DEFAULT 0,
  transfer_code text UNIQUE,
  bio          text,
  phone        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- user_roles ----------
CREATE TABLE public.user_roles (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role    app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- ---------- categories ----------
CREATE TABLE public.categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  image_url  text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- products ----------
CREATE TABLE public.products (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  description  text,
  price        integer NOT NULL,
  stock        integer NOT NULL DEFAULT 0,
  category     text NOT NULL,           -- matches categories.name
  image_url    text,
  status       text NOT NULL DEFAULT 'active',
  product_type text DEFAULT 'account',  -- 'account' | 'boost'
  account_info text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------- product_accounts (inventory) ----------
CREATE TABLE public.product_accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  account_info      text NOT NULL,
  is_sold           boolean NOT NULL DEFAULT false,
  sold_to_order_id  uuid,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ---------- orders ----------
CREATE TABLE public.orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL,
  product_name     text NOT NULL,
  product_category text NOT NULL,
  price            integer NOT NULL,
  account_info     text,
  order_code       text,
  status           text NOT NULL DEFAULT 'success',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------- boost_orders ----------
CREATE TABLE public.boost_orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL,
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

-- ---------- discount_codes ----------
CREATE TABLE public.discount_codes (
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

-- ---------- topup_requests ----------
-- Bank / card top-up log (see supabase/functions/bank-callback,card-callback).

-- ---------- ctv_assignments ----------
CREATE TABLE public.ctv_assignments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text NOT NULL,
  user_id             uuid,
  assigned_categories text[] NOT NULL DEFAULT '{}',
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ---------- shop_settings ----------
-- Key/value store for homepage banner, hotline, email, logo etc.

-- ============================================================
-- RPC functions (see supabase/migrations for definitions):
--   has_role, handle_new_user, update_updated_at_column,
--   generate_transfer_code, assign_transfer_code,
--   username_available, get_email_by_username,
--   get_recent_purchases, get_topup_leaderboard,
--   is_active_ctv, is_ctv_for_category,
--   purchase_product, purchase_product_batch,
--   purchase_boost, cancel_boost_order
-- ============================================================
