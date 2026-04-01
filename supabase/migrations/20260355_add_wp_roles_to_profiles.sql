ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wp_roles jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.profiles.wp_roles IS
'Legacy WordPress roles at time of migration. Read-only reference.';

CREATE INDEX IF NOT EXISTS idx_profiles_wp_roles
ON public.profiles USING gin(wp_roles);
