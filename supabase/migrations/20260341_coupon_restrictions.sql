-- CPN-02: Add role restrictions and product restrictions to stripe_coupons
-- These are GOYA-local fields, NOT sent to Stripe.
-- role_restrictions: { mode: 'whitelist'|'blacklist', roles: string[] }
-- product_restrictions: { mode: 'whitelist'|'blacklist', product_ids: string[] }
ALTER TABLE public.stripe_coupons
  ADD COLUMN IF NOT EXISTS role_restrictions jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS product_restrictions jsonb DEFAULT '{}';
