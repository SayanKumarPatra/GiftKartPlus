-- ============================================================================
-- GIFTKART — COMPLETE PRODUCTION SUPABASE BACKEND SCHEMA
-- Target Project: ozopjebyoakjjvdsawzl
-- Includes:
--   • 23 Normalized Tables with PKs, FKs, Constraints, Indexes & Timestamps
--   • Automated updated_at & Auth-to-Profile/Admin Signup Triggers
--   • Strict Row Level Security (RLS) on EVERY Table
--   • Secure Atomic RPC Functions (Order Placement, Customer Cancellation, Order Tracking)
--   • Supabase Storage Bucket (giftkart-media) + Bucket Policies
--   • Supabase Realtime Publication for Instant Storefront & Admin Sync
--   • Clean Idempotent Official Store Seed (Zero Fake Orders/Customers/Reviews)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. GENERIC UPDATED_AT TRIGGER HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. AUTHORIZED ADMIN TABLE & ROLE HELPER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'GiftKart Store Admin',
  role TEXT NOT NULL DEFAULT 'SINGLE_ADMIN' CHECK (role IN ('SINGLE_ADMIN', 'SUPER_ADMIN')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_giftkart_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = TRUE
  );
$$;

-- ----------------------------------------------------------------------------
-- 3. CUSTOMERS, ADDRESSES, WISHLISTS & PERSISTENT CARTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  default_city TEXT NOT NULL DEFAULT 'Jalchak',
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED')),
  whatsapp_updates_on BOOLEAN NOT NULL DEFAULT TRUE,
  order_updates_on BOOLEAN NOT NULL DEFAULT TRUE,
  offers_on BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_email_lower ON public.customers (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers (status);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON public.customers;
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically provision customer profile (and authorized primary admin) on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(COALESCE(NEW.email, '')));
  v_name TEXT := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), ''),
    SPLIT_PART(v_email, '@', 1),
    'GiftKart Customer'
  );
  v_phone TEXT := COALESCE(TRIM(NEW.raw_user_meta_data ->> 'phone'), '');
BEGIN
  IF v_email <> '' THEN
    INSERT INTO public.customers (id, full_name, email, phone, default_city, avatar_url)
    VALUES (
      NEW.id,
      v_name,
      v_email,
      v_phone,
      COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'default_city'), ''), 'Jalchak'),
      NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
      SET full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.customers.full_name),
          phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.customers.phone),
          updated_at = NOW();

    -- Strictly promote ONLY the designated GiftKart primary store administrator email
    IF v_email = 'admin.giftkart@gmail.com' THEN
      INSERT INTO public.admin_users (user_id, email, display_name, role, is_active)
      VALUES (NEW.id, v_email, COALESCE(NULLIF(v_name, ''), 'GiftKart Store Admin'), 'SINGLE_ADMIN', TRUE)
      ON CONFLICT (user_id) DO UPDATE
        SET email = EXCLUDED.email,
            is_active = TRUE,
            updated_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address_line1 TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  landmark TEXT,
  delivery_zone_id TEXT NOT NULL DEFAULT 'zone-jalchak',
  city TEXT NOT NULL DEFAULT 'Jalchak',
  state TEXT NOT NULL DEFAULT 'West Bengal',
  pincode TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON public.customer_addresses (customer_id);

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON public.customer_addresses;
CREATE TRIGGER trg_customer_addresses_updated_at
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. CATALOG: CATEGORIES, SUBCATEGORIES & PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_sort ON public.categories (sort_order);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.subcategories (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON public.subcategories (category_id, sort_order);

DROP TRIGGER IF EXISTS trg_subcategories_updated_at ON public.subcategories;
CREATE TRIGGER trg_subcategories_updated_at
  BEFORE UPDATE ON public.subcategories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price_inr NUMERIC(10, 2) NOT NULL CHECK (price_inr >= 0),
  compare_at_price_inr NUMERIC(10, 2) CHECK (compare_at_price_inr IS NULL OR compare_at_price_inr >= 0),
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  subcategory_id TEXT REFERENCES public.subcategories(id) ON DELETE SET NULL,
  occasion_tags TEXT[] NOT NULL DEFAULT '{}',
  images TEXT[] NOT NULL DEFAULT '{}',
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  availability TEXT NOT NULL DEFAULT 'IN_STOCK' CHECK (availability IN ('IN_STOCK', 'OUT_OF_STOCK', 'PREORDER')),
  stock_count INTEGER NOT NULL DEFAULT 0 CHECK (stock_count >= 0),
  is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  supports_personalization BOOLEAN NOT NULL DEFAULT FALSE,
  supports_photo_upload BOOLEAN NOT NULL DEFAULT FALSE,
  personalization_prompt TEXT,
  translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products (is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_products_bestseller ON public.products (is_best_seller, is_featured);

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.customer_carts (
  customer_id UUID PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  gift_wrap JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_customer_carts_updated_at ON public.customer_carts;
CREATE TRIGGER trg_customer_carts_updated_at
  BEFORE UPDATE ON public.customer_carts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. GIFT WRAPPING, DELIVERY ZONES, BANNERS, COUPONS & STORE SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gift_wrap_config (
  id TEXT PRIMARY KEY DEFAULT 'primary' CHECK (id = 'primary'),
  globally_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  default_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 49 CHECK (default_charge_inr >= 0),
  max_message_length INTEGER NOT NULL DEFAULT 180 CHECK (max_message_length > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gift_wrap_styles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 49 CHECK (charge_inr >= 0),
  accent_color_hex TEXT NOT NULL DEFAULT '#6A11CB',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_gift_wrap_styles_updated_at ON public.gift_wrap_styles;
CREATE TRIGGER trg_gift_wrap_styles_updated_at
  BEFORE UPDATE ON public.gift_wrap_styles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'West Bengal',
  charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (charge_inr >= 0),
  free_delivery_above_inr NUMERIC(10, 2) NOT NULL DEFAULT 499 CHECK (free_delivery_above_inr >= 0),
  estimated_days TEXT NOT NULL DEFAULT '1–2 Days',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_delivery_zones_updated_at ON public.delivery_zones;
CREATE TRIGGER trg_delivery_zones_updated_at
  BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.hero_banners (
  id TEXT PRIMARY KEY,
  title_prefix TEXT NOT NULL DEFAULT '',
  title_highlight TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  cta_label TEXT NOT NULL DEFAULT 'Shop Now',
  cta_href TEXT NOT NULL DEFAULT '/shop',
  image_url TEXT NOT NULL,
  occasion_tag TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_banners_sort ON public.hero_banners (sort_order);

DROP TRIGGER IF EXISTS trg_hero_banners_updated_at ON public.hero_banners;
CREATE TRIGGER trg_hero_banners_updated_at
  BEFORE UPDATE ON public.hero_banners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FLAT_INR')),
  value NUMERIC(10, 2) NOT NULL CHECK (value > 0),
  min_order_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_order_inr >= 0),
  max_discount_inr NUMERIC(10, 2) CHECK (max_discount_inr IS NULL OR max_discount_inr >= 0),
  valid_from DATE,
  valid_until DATE,
  linked_banner_id TEXT REFERENCES public.hero_banners(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code_upper ON public.coupons (UPPER(code));

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'primary' CHECK (id = 'primary'),
  store_name TEXT NOT NULL DEFAULT 'GiftKart',
  tagline TEXT NOT NULL DEFAULT 'Har Gift Mein Ek Kahani.',
  logo_url TEXT DEFAULT '/assets/aistudio/GiftKart_Gift_Cart_Logo_604a8052.png',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  support_email TEXT NOT NULL DEFAULT 'hello.giftkart@gmail.com',
  support_phone TEXT NOT NULL DEFAULT '+91 9239505791',
  service_cities_summary TEXT NOT NULL DEFAULT 'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155',
  banner JSONB NOT NULL DEFAULT '{}'::jsonb,
  announcement JSONB NOT NULL DEFAULT '{}'::jsonb,
  newsletter JSONB NOT NULL DEFAULT '{}'::jsonb,
  page_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  policies JSONB NOT NULL DEFAULT '{}'::jsonb,
  footer_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact_version INTEGER NOT NULL DEFAULT 2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.store_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT NOT NULL DEFAULT 'ALL_REGISTERED_USERS',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_store_notifications_updated_at ON public.store_notifications;
CREATE TRIGGER trg_store_notifications_updated_at
  BEFORE UPDATE ON public.store_notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. ORDERS, ORDER ITEMS, STATUS HISTORY, PAYMENTS & ORDER NOTIFICATIONS
-- ----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.giftkart_order_seq START 1;

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'LIVE_ORDER' CHECK (mode IN ('LIVE_ORDER', 'DEMO_ORDER')),
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  customer_details JSONB NOT NULL,
  gift_wrap JSONB NOT NULL DEFAULT '{}'::jsonb,
  subtotal_inr NUMERIC(10, 2) NOT NULL CHECK (subtotal_inr >= 0),
  gift_wrap_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (gift_wrap_charge_inr >= 0),
  discount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount_inr >= 0),
  delivery_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (delivery_charge_inr >= 0),
  grand_total_inr NUMERIC(10, 2) NOT NULL CHECK (grand_total_inr >= 0),
  coupon_code TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash on Delivery (COD)',
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  payment_reference TEXT,
  payment_gateway_status TEXT NOT NULL DEFAULT 'CASHFREE_NOT_CONNECTED',
  fulfillment_status TEXT NOT NULL DEFAULT 'New Order',
  shipping_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  receipt JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders (LOWER(customer_email), created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (fulfillment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders (UPPER(order_number));

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  product_sku_snapshot TEXT NOT NULL DEFAULT '',
  unit_price_inr_snapshot NUMERIC(10, 2) NOT NULL CHECK (unit_price_inr_snapshot >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total_inr NUMERIC(10, 2) NOT NULL CHECK (line_total_inr >= 0),
  selected_variants JSONB NOT NULL DEFAULT '{}'::jsonb,
  personalization_details TEXT NOT NULL DEFAULT '',
  custom_photo_file_name TEXT,
  image_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'STATUS_UPDATE',
  status TEXT NOT NULL,
  note TEXT,
  updated_by TEXT NOT NULL DEFAULT 'System',
  admin_name TEXT,
  admin_email TEXT,
  metadata_summary TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history (order_id, timestamp ASC);

CREATE TABLE IF NOT EXISTS public.order_payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  amount_inr NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_inr >= 0),
  collection_date TIMESTAMPTZ,
  admin_name TEXT,
  admin_email TEXT,
  note TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order ON public.order_payments (order_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS public.order_notifications (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL DEFAULT '',
  event_key TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'DELIVERED_TO_APP',
  triggered_by TEXT NOT NULL DEFAULT 'System',
  admin_name TEXT,
  customer_note TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, event_key)
);

CREATE INDEX IF NOT EXISTS idx_order_notifications_customer ON public.order_notifications (customer_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_notifications_email ON public.order_notifications (LOWER(customer_email), sent_at DESC);

-- ----------------------------------------------------------------------------
-- 7. PRODUCT REVIEWS, NEWSLETTER SUBSCRIBERS & ADMIN ACTIVITY LOGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL DEFAULT '',
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_phone TEXT,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL DEFAULT '',
  photos TEXT[] NOT NULL DEFAULT '{}',
  verified_purchase BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews (product_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_reviews_order_product
  ON public.product_reviews (order_id, product_id)
  WHERE order_id IS NOT NULL;

DROP TRIGGER IF EXISTS trg_product_reviews_updated_at ON public.product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at
  BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_ts ON public.admin_activity_logs (timestamp DESC);

-- ----------------------------------------------------------------------------
-- 8. SECURE ATOMIC RPC FUNCTIONS (ORDER PLACEMENT, CANCELLATION, TRACKING)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_giftkart_order(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_customer JSONB := COALESCE(payload -> 'customer', '{}'::jsonb);
  v_customer_email TEXT := LOWER(TRIM(COALESCE(v_customer ->> 'email', '')));
  v_customer_name TEXT := TRIM(COALESCE(v_customer ->> 'fullName', ''));
  v_customer_phone TEXT := TRIM(COALESCE(v_customer ->> 'phone', ''));
  v_items JSONB := COALESCE(payload -> 'items', '[]'::jsonb);
  v_gift_wrap JSONB := COALESCE(payload -> 'giftWrap', '{}'::jsonb);
  v_seq BIGINT;
  v_order_number TEXT;
  v_order_id TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_status TEXT;
  v_payment_method TEXT := COALESCE(NULLIF(TRIM(payload ->> 'paymentMethod'), ''), 'Cash on Delivery (COD)');
  v_raw_pay_status TEXT := UPPER(COALESCE(payload ->> 'paymentStatus', 'UNPAID'));
  v_is_paid BOOLEAN := v_raw_pay_status IN ('PAID', 'SUCCESS');
  v_canonical_pay TEXT := CASE WHEN v_is_paid THEN 'Paid' ELSE 'Unpaid' END;
  v_legacy_pay TEXT := CASE WHEN v_is_paid THEN 'PAID' ELSE 'UNPAID' END;
  v_subtotal NUMERIC(10, 2) := GREATEST(0, COALESCE((payload ->> 'subtotalInr')::numeric, 0));
  v_wrap_charge NUMERIC(10, 2) := CASE WHEN COALESCE((v_gift_wrap ->> 'enabled')::boolean, FALSE) THEN GREATEST(0, COALESCE((payload ->> 'giftWrapChargeInr')::numeric, 0)) ELSE 0 END;
  v_discount NUMERIC(10, 2) := GREATEST(0, COALESCE((payload ->> 'discountInr')::numeric, 0));
  v_delivery NUMERIC(10, 2) := GREATEST(0, COALESCE((payload ->> 'deliveryChargeInr')::numeric, 0));
  v_grand_total NUMERIC(10, 2) := GREATEST(0, COALESCE((payload ->> 'grandTotalInr')::numeric, 0));
  v_item JSONB;
  v_idx INTEGER := 0;
  v_notif_id TEXT;
  v_hist1_id TEXT;
  v_hist2_id TEXT;
  v_pay_id TEXT;
BEGIN
  IF v_customer_name = '' OR v_customer_phone = '' OR jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Order requires customer name, phone, and at least one item.';
  END IF;

  -- Check if authenticated customer is blocked
  IF v_uid IS NOT NULL THEN
    SELECT status INTO v_status FROM public.customers WHERE id = v_uid;
    IF v_status = 'BLOCKED' THEN
      RAISE EXCEPTION 'Your account has been restricted by the administrator and cannot place new orders.';
    END IF;
    -- Keep customer profile synced with latest phone/city if missing
    UPDATE public.customers
    SET full_name = COALESCE(NULLIF(full_name, ''), v_customer_name),
        phone = COALESCE(NULLIF(phone, ''), v_customer_phone),
        default_city = COALESCE(NULLIF(TRIM(v_customer ->> 'city'), ''), default_city),
        updated_at = v_now
    WHERE id = v_uid;
  ELSIF v_customer_email <> '' THEN
    SELECT status INTO v_status FROM public.customers WHERE LOWER(email) = v_customer_email LIMIT 1;
    IF v_status = 'BLOCKED' THEN
      RAISE EXCEPTION 'This customer account has been restricted by the administrator.';
    END IF;
  END IF;

  v_seq := NEXTVAL('public.giftkart_order_seq');
  v_order_number := 'GK-' || EXTRACT(YEAR FROM v_now)::INT::TEXT || '-' || LPAD(v_seq::TEXT, 4, '0');
  v_order_id := 'ord-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-' || v_seq::TEXT;

  INSERT INTO public.orders (
    id, order_number, mode, customer_id, customer_email, customer_details, gift_wrap,
    subtotal_inr, gift_wrap_charge_inr, discount_inr, delivery_charge_inr, grand_total_inr,
    coupon_code, payment_method, payment_status, payment_reference, payment_gateway_status,
    fulfillment_status, shipping_details, payment_details, created_at, updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    'LIVE_ORDER',
    v_uid,
    v_customer_email,
    v_customer,
    jsonb_set(v_gift_wrap, '{chargeInrSnapshot}', to_jsonb(v_wrap_charge), TRUE),
    v_subtotal,
    v_wrap_charge,
    v_discount,
    v_delivery,
    v_grand_total,
    NULLIF(TRIM(COALESCE(payload ->> 'couponCode', '')), ''),
    v_payment_method,
    v_legacy_pay,
    'TXN-' || REGEXP_REPLACE(v_order_number, '[^A-Z0-9]', '', 'g'),
    'CASHFREE_NOT_CONNECTED',
    'New Order',
    '{}'::jsonb,
    jsonb_build_object(
      'status', v_canonical_pay,
      'collectedAmountInr', CASE WHEN v_is_paid THEN v_grand_total ELSE 0 END,
      'collectionDate', CASE WHEN v_is_paid THEN v_now ELSE NULL END,
      'confirmedAt', CASE WHEN v_is_paid THEN v_now ELSE NULL END,
      'note', CASE WHEN v_is_paid THEN 'Prepaid at checkout.' ELSE 'Awaiting Cash on Delivery payment collection.' END
    ),
    v_now,
    v_now
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_idx := v_idx + 1;
    INSERT INTO public.order_items (
      id, order_id, product_id, product_name_snapshot, product_sku_snapshot,
      unit_price_inr_snapshot, quantity, line_total_inr, selected_variants,
      personalization_details, custom_photo_file_name, image_snapshot, created_at
    ) VALUES (
      v_order_id || '-item-' || v_idx::TEXT,
      v_order_id,
      CASE
        WHEN EXISTS (SELECT 1 FROM public.products p WHERE p.id = (v_item ->> 'productId'))
        THEN v_item ->> 'productId'
        ELSE NULL
      END,
      COALESCE(v_item ->> 'productNameSnapshot', 'Gift Item'),
      COALESCE(v_item ->> 'productSkuSnapshot', ''),
      GREATEST(0, COALESCE((v_item ->> 'unitPriceInrSnapshot')::numeric, 0)),
      GREATEST(1, COALESCE((v_item ->> 'quantity')::integer, 1)),
      GREATEST(0, COALESCE((v_item ->> 'unitPriceInrSnapshot')::numeric, 0)) * GREATEST(1, COALESCE((v_item ->> 'quantity')::integer, 1)),
      COALESCE(v_item -> 'selectedVariants', '{}'::jsonb),
      COALESCE(v_item ->> 'personalizationDetails', ''),
      v_item ->> 'customPhotoFileName',
      v_item ->> 'imageSnapshot',
      v_now
    );

    -- Decrement stock cleanly if product exists
    UPDATE public.products
    SET stock_count = GREATEST(0, stock_count - GREATEST(1, COALESCE((v_item ->> 'quantity')::integer, 1))),
        availability = CASE
          WHEN GREATEST(0, stock_count - GREATEST(1, COALESCE((v_item ->> 'quantity')::integer, 1))) = 0 THEN 'OUT_OF_STOCK'
          ELSE availability
        END,
        updated_at = v_now
    WHERE id = (v_item ->> 'productId');
  END LOOP;

  IF v_is_paid THEN
    v_pay_id := 'pay-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-1';
    INSERT INTO public.order_payments (id, order_id, status, amount_inr, collection_date, note, timestamp)
    VALUES (v_pay_id, v_order_id, 'Paid', v_grand_total, v_now, 'Prepaid at checkout.', v_now);
  END IF;

  v_notif_id := 'notif-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-' || v_seq::TEXT;
  INSERT INTO public.order_notifications (
    id, order_id, order_number, customer_id, customer_email, event_key, status,
    title, message, delivery_status, triggered_by, sent_at
  ) VALUES (
    v_notif_id, v_order_id, v_order_number, v_uid, v_customer_email,
    'STATUS:New Order', 'New Order',
    'Order ' || v_order_number || ' • New Order',
    'Thank you for your order! Your GiftKart order has been placed successfully and is awaiting confirmation.',
    'DELIVERED_TO_APP', 'System', v_now
  );

  v_hist1_id := 'hist-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-1';
  v_hist2_id := 'hist-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-2';
  INSERT INTO public.order_status_history (id, order_id, event_type, status, note, updated_by, metadata_summary, timestamp)
  VALUES
    (v_hist1_id, v_order_id, 'ORDER_CREATED', 'New Order', 'Order placed by customer and received at GiftKart.', 'System', NULL, v_now),
    (v_hist2_id, v_order_id, 'NOTIFICATION_SENT', 'New Order', 'Thank you for your order! Your GiftKart order has been placed successfully and is awaiting confirmation.', 'System', 'Automatic customer notification delivered to GiftKart', v_now);

  RETURN jsonb_build_object(
    'id', v_order_id,
    'orderNumber', v_order_number
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_my_order(p_order_id TEXT, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT := LOWER(COALESCE(auth.jwt() ->> 'email', ''));
  v_order public.orders%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_reason TEXT := COALESCE(NULLIF(TRIM(p_reason), ''), 'Cancelled by customer.');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in to cancel your order.';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_order.customer_id IS DISTINCT FROM v_uid AND LOWER(v_order.customer_email) <> v_email THEN
    RAISE EXCEPTION 'You do not have permission to cancel this order.';
  END IF;

  IF v_order.fulfillment_status NOT IN ('New Order', 'New', 'Demo Placed') THEN
    RAISE EXCEPTION 'Order cannot be cancelled once processing has started.';
  END IF;

  UPDATE public.orders
  SET fulfillment_status = 'Cancelled',
      updated_at = v_now
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (id, order_id, event_type, status, note, updated_by, timestamp)
  VALUES (
    'hist-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-cancel',
    p_order_id,
    'CUSTOMER_ACTION',
    'Cancelled',
    v_reason,
    'Customer',
    v_now
  );

  INSERT INTO public.order_notifications (
    id, order_id, order_number, customer_id, customer_email, event_key, status,
    title, message, delivery_status, triggered_by, customer_note, sent_at
  ) VALUES (
    'notif-' || (EXTRACT(EPOCH FROM v_now) * 1000)::BIGINT::TEXT || '-cancel',
    v_order.id,
    v_order.order_number,
    v_order.customer_id,
    v_order.customer_email,
    'STATUS:Cancelled',
    'Cancelled',
    'Order ' || v_order.order_number || ' • Cancelled',
    'Your GiftKart order has been cancelled as requested.',
    'DELIVERED_TO_APP',
    'Customer',
    v_reason,
    v_now
  )
  ON CONFLICT (order_id, event_key) DO NOTHING;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_order_by_number(p_order_number TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT := UPPER(TRIM(COALESCE(p_order_number, '')));
  v_order public.orders%ROWTYPE;
  v_items JSONB;
  v_history JSONB;
  v_payments JSONB;
  v_notifications JSONB;
BEGIN
  IF v_clean = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE UPPER(order_number) = v_clean LIMIT 1;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi) ORDER BY oi.created_at ASC), '[]'::jsonb)
  INTO v_items FROM public.order_items oi WHERE oi.order_id = v_order.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(h) ORDER BY h.timestamp ASC), '[]'::jsonb)
  INTO v_history FROM public.order_status_history h WHERE h.order_id = v_order.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.timestamp DESC), '[]'::jsonb)
  INTO v_payments FROM public.order_payments p WHERE p.order_id = v_order.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(n) ORDER BY n.sent_at DESC), '[]'::jsonb)
  INTO v_notifications FROM public.order_notifications n WHERE n.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order),
    'items', v_items,
    'history', v_history,
    'payments', v_payments,
    'notifications', v_notifications
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. ENABLE ROW LEVEL SECURITY (RLS) ON EVERY SINGLE TABLE
-- ----------------------------------------------------------------------------
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_wrap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_wrap_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- ADMIN USERS (Only authenticated admin can read/update own admin record)
DROP POLICY IF EXISTS "admin_users_self_select" ON public.admin_users;
CREATE POLICY "admin_users_self_select" ON public.admin_users
  FOR SELECT USING (auth.uid() = user_id AND is_active = TRUE);

DROP POLICY IF EXISTS "admin_users_self_update" ON public.admin_users;
CREATE POLICY "admin_users_self_update" ON public.admin_users
  FOR UPDATE USING (auth.uid() = user_id AND is_active = TRUE)
  WITH CHECK (auth.uid() = user_id AND role = 'SINGLE_ADMIN');

-- CUSTOMERS (Customer sees/updates own profile; Admin manages all)
DROP POLICY IF EXISTS "customers_own_or_admin_select" ON public.customers;
CREATE POLICY "customers_own_or_admin_select" ON public.customers
  FOR SELECT USING (auth.uid() = id OR public.is_giftkart_admin());

DROP POLICY IF EXISTS "customers_own_insert" ON public.customers;
CREATE POLICY "customers_own_insert" ON public.customers
  FOR INSERT WITH CHECK (auth.uid() = id AND status = 'ACTIVE');

DROP POLICY IF EXISTS "customers_own_update" ON public.customers;
CREATE POLICY "customers_own_update" ON public.customers
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND status = (SELECT c.status FROM public.customers c WHERE c.id = auth.uid())
  );

DROP POLICY IF EXISTS "customers_admin_update" ON public.customers;
CREATE POLICY "customers_admin_update" ON public.customers
  FOR UPDATE USING (public.is_giftkart_admin())
  WITH CHECK (public.is_giftkart_admin());

-- CUSTOMER ADDRESSES (Strictly private per customer; Admin read-only)
DROP POLICY IF EXISTS "addresses_own_all" ON public.customer_addresses;
CREATE POLICY "addresses_own_all" ON public.customer_addresses
  FOR ALL USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "addresses_admin_select" ON public.customer_addresses;
CREATE POLICY "addresses_admin_select" ON public.customer_addresses
  FOR SELECT USING (public.is_giftkart_admin());

-- CUSTOMER WISHLISTS & CARTS (Strictly private per customer)
DROP POLICY IF EXISTS "wishlists_own_all" ON public.customer_wishlists;
CREATE POLICY "wishlists_own_all" ON public.customer_wishlists
  FOR ALL USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "carts_own_all" ON public.customer_carts;
CREATE POLICY "carts_own_all" ON public.customer_carts
  FOR ALL USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- PUBLIC STOREFRONT READ / ADMIN WRITE TABLES
DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "subcategories_public_read" ON public.subcategories;
CREATE POLICY "subcategories_public_read" ON public.subcategories FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "subcategories_admin_write" ON public.subcategories;
CREATE POLICY "subcategories_admin_write" ON public.subcategories
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "products_public_read" ON public.products;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "gift_wrap_config_public_read" ON public.gift_wrap_config;
CREATE POLICY "gift_wrap_config_public_read" ON public.gift_wrap_config FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "gift_wrap_config_admin_write" ON public.gift_wrap_config;
CREATE POLICY "gift_wrap_config_admin_write" ON public.gift_wrap_config
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "gift_wrap_styles_public_read" ON public.gift_wrap_styles;
CREATE POLICY "gift_wrap_styles_public_read" ON public.gift_wrap_styles FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "gift_wrap_styles_admin_write" ON public.gift_wrap_styles;
CREATE POLICY "gift_wrap_styles_admin_write" ON public.gift_wrap_styles
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "delivery_zones_public_read" ON public.delivery_zones;
CREATE POLICY "delivery_zones_public_read" ON public.delivery_zones FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "delivery_zones_admin_write" ON public.delivery_zones;
CREATE POLICY "delivery_zones_admin_write" ON public.delivery_zones
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "hero_banners_public_read" ON public.hero_banners;
CREATE POLICY "hero_banners_public_read" ON public.hero_banners FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "hero_banners_admin_write" ON public.hero_banners;
CREATE POLICY "hero_banners_admin_write" ON public.hero_banners
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "coupons_public_read" ON public.coupons;
CREATE POLICY "coupons_public_read" ON public.coupons FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "coupons_admin_write" ON public.coupons;
CREATE POLICY "coupons_admin_write" ON public.coupons
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read" ON public.store_settings FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "store_settings_admin_write" ON public.store_settings;
CREATE POLICY "store_settings_admin_write" ON public.store_settings
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "store_notifications_public_read" ON public.store_notifications;
CREATE POLICY "store_notifications_public_read" ON public.store_notifications FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "store_notifications_admin_write" ON public.store_notifications;
CREATE POLICY "store_notifications_admin_write" ON public.store_notifications
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

-- ORDERS & RELATED CHILD TABLES (Customer sees ONLY own orders; Admin manages ALL)
DROP POLICY IF EXISTS "orders_own_or_admin_select" ON public.orders;
CREATE POLICY "orders_own_or_admin_select" ON public.orders
  FOR SELECT USING (
    public.is_giftkart_admin()
    OR customer_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND LOWER(customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS "orders_admin_manage" ON public.orders;
CREATE POLICY "orders_admin_manage" ON public.orders
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "order_items_own_or_admin_select" ON public.order_items;
CREATE POLICY "order_items_own_or_admin_select" ON public.order_items
  FOR SELECT USING (
    public.is_giftkart_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.customer_id = auth.uid()
          OR (auth.uid() IS NOT NULL AND LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        )
    )
  );

DROP POLICY IF EXISTS "order_items_admin_manage" ON public.order_items;
CREATE POLICY "order_items_admin_manage" ON public.order_items
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "order_history_own_or_admin_select" ON public.order_status_history;
CREATE POLICY "order_history_own_or_admin_select" ON public.order_status_history
  FOR SELECT USING (
    public.is_giftkart_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
        AND (
          o.customer_id = auth.uid()
          OR (auth.uid() IS NOT NULL AND LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        )
    )
  );

DROP POLICY IF EXISTS "order_history_admin_manage" ON public.order_status_history;
CREATE POLICY "order_history_admin_manage" ON public.order_status_history
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "order_payments_own_or_admin_select" ON public.order_payments;
CREATE POLICY "order_payments_own_or_admin_select" ON public.order_payments
  FOR SELECT USING (
    public.is_giftkart_admin()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_payments.order_id
        AND (
          o.customer_id = auth.uid()
          OR (auth.uid() IS NOT NULL AND LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
        )
    )
  );

DROP POLICY IF EXISTS "order_payments_admin_manage" ON public.order_payments;
CREATE POLICY "order_payments_admin_manage" ON public.order_payments
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

DROP POLICY IF EXISTS "order_notifications_own_or_admin_select" ON public.order_notifications;
CREATE POLICY "order_notifications_own_or_admin_select" ON public.order_notifications
  FOR SELECT USING (
    public.is_giftkart_admin()
    OR customer_id = auth.uid()
    OR (auth.uid() IS NOT NULL AND LOWER(customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
  );

DROP POLICY IF EXISTS "order_notifications_admin_manage" ON public.order_notifications;
CREATE POLICY "order_notifications_admin_manage" ON public.order_notifications
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

-- PRODUCT REVIEWS (Public reads approved reviews; Verified buyers submit/edit own; Admin moderates)
DROP POLICY IF EXISTS "reviews_public_read" ON public.product_reviews;
CREATE POLICY "reviews_public_read" ON public.product_reviews
  FOR SELECT USING (is_approved = TRUE OR public.is_giftkart_admin() OR customer_id = auth.uid());

DROP POLICY IF EXISTS "reviews_customer_insert" ON public.product_reviews;
CREATE POLICY "reviews_customer_insert" ON public.product_reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND customer_id = auth.uid()
    AND (
      order_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.id = product_reviews.order_id
          AND (o.customer_id = auth.uid() OR LOWER(o.customer_email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')))
          AND o.fulfillment_status IN ('Delivered', 'Completed')
      )
    )
  );

DROP POLICY IF EXISTS "reviews_customer_update" ON public.product_reviews;
CREATE POLICY "reviews_customer_update" ON public.product_reviews
  FOR UPDATE USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "reviews_admin_manage" ON public.product_reviews;
CREATE POLICY "reviews_admin_manage" ON public.product_reviews
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

-- NEWSLETTER SUBSCRIBERS (Public can subscribe; Admin manages)
DROP POLICY IF EXISTS "newsletter_public_insert" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$');

DROP POLICY IF EXISTS "newsletter_admin_manage" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_admin_manage" ON public.newsletter_subscribers
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

-- ADMIN ACTIVITY LOGS (Strictly Admin only)
DROP POLICY IF EXISTS "activity_logs_admin_only" ON public.admin_activity_logs;
CREATE POLICY "activity_logs_admin_only" ON public.admin_activity_logs
  FOR ALL USING (public.is_giftkart_admin()) WITH CHECK (public.is_giftkart_admin());

-- ----------------------------------------------------------------------------
-- 10. SUPABASE STORAGE BUCKET (giftkart-media) & POLICIES
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'giftkart-media',
  'giftkart-media',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "giftkart_media_public_read" ON storage.objects;
CREATE POLICY "giftkart_media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'giftkart-media');

DROP POLICY IF EXISTS "giftkart_media_admin_write" ON storage.objects;
CREATE POLICY "giftkart_media_admin_write" ON storage.objects
  FOR ALL USING (bucket_id = 'giftkart-media' AND public.is_giftkart_admin())
  WITH CHECK (bucket_id = 'giftkart-media' AND public.is_giftkart_admin());

DROP POLICY IF EXISTS "giftkart_media_customer_avatar_review_upload" ON storage.objects;
CREATE POLICY "giftkart_media_customer_avatar_review_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'giftkart-media'
    AND auth.uid() IS NOT NULL
    AND (
      name LIKE ('avatars/' || auth.uid()::text || '/%')
      OR name LIKE ('reviews/' || auth.uid()::text || '/%')
    )
  );

-- ----------------------------------------------------------------------------
-- 11. SUPABASE REALTIME PUBLICATION (LIVE STOREFRONT + ADMIN SYNC)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'categories', 'subcategories', 'products', 'hero_banners', 'coupons',
    'gift_wrap_config', 'gift_wrap_styles', 'delivery_zones', 'store_settings',
    'store_notifications', 'orders', 'order_notifications', 'product_reviews', 'customers'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = v_table
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 12. CLEAN IDEMPOTENT OFFICIAL SEED (NO FAKE ORDERS, CUSTOMERS, OR REVIEWS)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, slug, name, description, image_url, sort_order, is_active) VALUES
  ('cat-all-gifts', 'all-gifts', 'All Gifts', 'Explore every personalized gift and keepsake across GiftKart.', '/assets/aistudio/Glossy_Purple_Gift_Box_with_Golden_Bow-edited_09de3fec.webp', 1, TRUE),
  ('cat-photo-frame', 'photo-frame', 'Photo Frame', 'Custom wooden, acrylic, collage, and tabletop photo frames.', '/assets/aistudio/Romantic_Framed_Couple_on_Golden_Pedestal_ac3f2968.webp', 2, TRUE),
  ('cat-coffee-mugs', 'coffee-mugs', 'Coffee Mugs', 'Personalized ceramic, magic heat-reveal, and couple coffee mugs.', '/assets/aistudio/Festive_Red_Ribbon_Coffee_Mug_195c9bba.webp', 3, TRUE),
  ('cat-tshirt-prints', 't-shirt-prints', 'T-Shirt Prints', 'Custom printed cotton tees, couple sets, and graphic gift t-shirts.', '/assets/aistudio/Tropical_Sunset_T-Shirt_on_Golden_Display_cf5d3e8e.webp', 4, TRUE),
  ('cat-home-decor', 'home-decor', 'Home Decor', 'Warm tabletop art, spiritual figurines, and personalized home accents.', '/assets/aistudio/Warm_Buddha_Moonlight_Decor_Display_c24a114f.webp', 5, TRUE),
  ('cat-hand-made', 'hand-made', 'Hand Made', 'Artisanal handcrafted keepsakes, explosion boxes, and custom craft gifts.', '/assets/images/handmade-gift.webp', 6, TRUE),
  ('cat-keychain', 'keychain', 'Keychain', 'Engraved metal, wooden, and acrylic photo keychains for everyday gifting.', '/assets/aistudio/Golden_Pedestal_Keychain_Collection_b507d441.webp', 7, TRUE),
  ('cat-gifts-bag-box', 'gifts-bag-box', 'Gifts Bag & Box', 'Curated celebration hampers, luxury gift boxes, and festive gift bags.', '/assets/aistudio/Luxury_Purple_Valentine_Gift_Hamper_7db1384e.webp', 8, TRUE),
  ('cat-led-lighting', 'led-lighting', 'LED Lighting', 'Warm engraved acrylic night lamps, moon lamps, and glowing couple plaques.', '/assets/aistudio/Romantic_Moonlight_Couple_Lamp_Gift_Set_a4d8a6f1.webp', 9, TRUE),
  ('cat-pvc-card', 'pvc-card', 'PVC Card', 'Durable custom printed PVC photo cards, wallet keepsakes, and ID cards.', '/assets/images/pvc-card.webp', 10, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gift_wrap_config (id, globally_enabled, default_charge_inr, max_message_length)
VALUES ('primary', TRUE, 49, 180)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gift_wrap_styles (id, name, description, charge_inr, accent_color_hex, is_active, sort_order) VALUES
  ('wrap-royal-purple', 'Royal Purple Satin Wrap', 'Matte lavender-purple signature wrap with satin ribbon and greeting card.', 49, '#6A11CB', TRUE, 1),
  ('wrap-blush-pink', 'Blush Pink Celebration Box', 'Festive rose-pink box with tissue lining and gold foil ribbon.', 79, '#FF4D8D', TRUE, 2),
  ('wrap-festive-gold', 'Festive Gold Keepsake Box', 'Premium rigid keepsake gift box finished with champagne ribbon.', 99, '#C084FC', TRUE, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.delivery_zones (id, name, state, charge_inr, free_delivery_above_inr, estimated_days, is_active, sort_order) VALUES
  ('zone-jalchak', 'Jalchak & Pingla Local', 'West Bengal', 0, 299, 'Same / Next Day', TRUE, 1),
  ('zone-medinipur', 'Paschim Medinipur & Kharagpur', 'West Bengal', 49, 699, '2–3 Days', TRUE, 2),
  ('zone-kolkata', 'Kolkata & West Bengal', 'West Bengal', 69, 999, '3–4 Days', TRUE, 3),
  ('zone-india', 'Rest of India', 'India', 99, 1499, '5–7 Days', TRUE, 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_settings (
  id, store_name, tagline, logo_url, support_email, support_phone, service_cities_summary,
  banner, announcement, newsletter, page_content, social_links, seo, policies, footer_content, contact_version
) VALUES (
  'primary',
  'GiftKart',
  'Har Gift Mein Ek Kahani.',
  '/assets/aistudio/GiftKart_Gift_Cart_Logo_604a8052.png',
  'hello.giftkart@gmail.com',
  '+91 9239505791',
  'Jalchak, Pingla, Paschim Medinipur, West Bengal - 721155',
  '{"enabled": true, "headline": "Personalized Gifts Crafted with Love", "subheadline": "Custom photo frames, magic mugs, LED lamps & curated hampers.", "ctaLabel": "Explore Gifts", "ctaHref": "/shop"}'::jsonb,
  '{"enabled": true, "desktopText": "Handcrafted Personalized Gifts • Jalchak, West Bengal • Fast Delivery", "mobileText": "Handcrafted Personalized Gifts • Fast Delivery", "showSupportLink": true, "showTrackOrderLink": true}'::jsonb,
  '{"enabled": true, "heading": "Get Exclusive Gift Offers", "description": "Receive festive discounts and new personalized gift launches.", "buttonLabel": "Subscribe"}'::jsonb,
  '{"aboutHeadline": "Every Gift Tells a Story", "aboutStory": "GiftKart brings thoughtful, handcrafted personalized gifts from Jalchak, Pingla to every celebration.", "customizationHeadline": "How Personalization Works", "customizationNote": "Choose your gift, place your order, and share photos or custom text directly with our GiftKart studio via WhatsApp."}'::jsonb,
  '{"instagram": "https://instagram.com", "facebook": "https://facebook.com", "whatsapp": "https://wa.me/919239505791", "youtube": ""}'::jsonb,
  '{"title": "GiftKart — Personalized Gifts & Custom Keepsakes", "description": "Order custom photo frames, printed mugs, LED lamps, keychains and gift hampers."}'::jsonb,
  '{"privacyPolicy": "We protect your personal data and use it strictly to process and deliver your GiftKart orders.", "termsAndConditions": "Customized products are crafted specifically to your specifications upon order confirmation.", "refundPolicy": "Damaged or incorrect items are eligible for replacement when reported within 48 hours of delivery with unboxing proof."}'::jsonb,
  '{"description": "Har Gift Mein Ek Kahani. Personalized gifts crafted with care.", "copyrightText": "© GiftKart. All rights reserved."}'::jsonb,
  2
)
ON CONFLICT (id) DO NOTHING;

-- Refresh PostgREST schema cache automatically
NOTIFY pgrst, 'reload schema';
