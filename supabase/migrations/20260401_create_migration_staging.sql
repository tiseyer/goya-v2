-- Migration staging table for WooCommerce → GOYA v2 user categorization
CREATE TABLE IF NOT EXISTS public.migration_staging (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  woo_customer_id integer,
  supabase_profile_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  woo_subscription_status text,
  woo_subscription_total numeric,
  wp_roles jsonb DEFAULT '[]',
  migration_group text NOT NULL CHECK (migration_group IN ('A', 'B', 'C', 'D')),
  migration_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS migration_staging_email_idx ON public.migration_staging(email);
CREATE INDEX IF NOT EXISTS migration_staging_group_idx ON public.migration_staging(migration_group);

-- RLS: admin-only access
ALTER TABLE public.migration_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON public.migration_staging
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'moderator'))
  );
