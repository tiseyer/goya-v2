-- Bridge columns: link existing GOYA tables to Stripe IDs
-- stripe_product_id is nullable — existing 22 products have no Stripe IDs yet.
-- stripe_customer_id is nullable — populated when user first interacts with Stripe.

-- Add stripe_product_id to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id text;

CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id
  ON public.products(stripe_product_id);

-- Add stripe_customer_id to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);
