-- Phase 8 DB-01: Stripe entity mirror tables
-- Creates 5 tables for Stripe data sync with admin/moderator RLS and updated_at triggers.
-- No explicit FKs on stripe_id text columns — out-of-order webhook delivery would cause violations.

-- ---------------------------------------------------------------------------
-- Table 1: stripe_products
-- Maps Stripe product.* webhook events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id        text UNIQUE NOT NULL,
  name             text NOT NULL,
  description      text,
  active           boolean DEFAULT true,
  images           text[] DEFAULT '{}',
  metadata         jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe_products"
  ON public.stripe_products
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_stripe_products_updated_at
  BEFORE UPDATE ON public.stripe_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Table 2: stripe_prices
-- Maps Stripe price.* webhook events; prices are immutable on Stripe
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_prices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id           text UNIQUE NOT NULL,
  stripe_product_id   text NOT NULL,
  currency            text NOT NULL DEFAULT 'usd',
  unit_amount         integer,
  type                text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring')),
  interval            text CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count      integer,
  active              boolean DEFAULT true,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe_prices"
  ON public.stripe_prices
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_stripe_prices_updated_at
  BEFORE UPDATE ON public.stripe_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Table 3: stripe_orders
-- Maps Stripe payment_intent.* and subscription events; one row per payment/cycle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id                 text UNIQUE NOT NULL,
  stripe_customer_id        text,
  stripe_price_id           text,
  stripe_product_id         text,
  user_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_total              integer,
  currency                  text DEFAULT 'usd',
  status                    text NOT NULL,
  type                      text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring')),
  subscription_status       text,
  cancel_at_period_end      boolean DEFAULT false,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  canceled_at               timestamptz,
  metadata                  jsonb DEFAULT '{}',
  stripe_event_id           text,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe_orders"
  ON public.stripe_orders
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_stripe_orders_updated_at
  BEFORE UPDATE ON public.stripe_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Table 4: stripe_coupons
-- Maps Stripe coupon.* events; stores both coupon ID and promotion code ID separately
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_coupons (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id            text UNIQUE NOT NULL,
  stripe_promotion_code_id    text UNIQUE,
  name                        text NOT NULL,
  code                        text,
  discount_type               text NOT NULL CHECK (discount_type IN ('percent', 'amount', 'free_product')),
  percent_off                 numeric(5,2),
  amount_off                  integer,
  currency                    text DEFAULT 'usd',
  duration                    text CHECK (duration IN ('forever', 'once', 'repeating')),
  duration_in_months          integer,
  max_redemptions             integer,
  times_redeemed              integer DEFAULT 0,
  redeem_by                   timestamptz,
  valid                       boolean DEFAULT true,
  metadata                    jsonb DEFAULT '{}',
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe_coupons"
  ON public.stripe_coupons
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_stripe_coupons_updated_at
  BEFORE UPDATE ON public.stripe_coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Table 5: stripe_coupon_redemptions
-- One row per coupon use event; no updated_at (append-only log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stripe_coupon_redemptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id    text NOT NULL,
  stripe_order_id     text,
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at         timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe_coupon_redemptions"
  ON public.stripe_coupon_redemptions
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- No updated_at trigger for stripe_coupon_redemptions (append-only; no updated_at column)

-- ---------------------------------------------------------------------------
-- Lookup indices
-- ---------------------------------------------------------------------------

-- stripe_orders lookup indices
CREATE INDEX IF NOT EXISTS idx_stripe_orders_customer_id ON public.stripe_orders(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_user_id ON public.stripe_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_orders_price_id ON public.stripe_orders(stripe_price_id);

-- stripe_coupon_redemptions lookup indices
CREATE INDEX IF NOT EXISTS idx_stripe_coupon_redemptions_coupon_id ON public.stripe_coupon_redemptions(stripe_coupon_id);
CREATE INDEX IF NOT EXISTS idx_stripe_coupon_redemptions_user_id ON public.stripe_coupon_redemptions(user_id);
