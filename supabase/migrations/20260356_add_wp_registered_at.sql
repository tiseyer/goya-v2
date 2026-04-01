ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wp_registered_at timestamptz;

COMMENT ON COLUMN public.profiles.wp_registered_at IS
'Original WordPress registration date preserved during migration.';
