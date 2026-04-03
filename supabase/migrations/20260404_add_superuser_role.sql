-- Add 'superuser' to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superuser';

-- Promote owner to superuser
UPDATE public.profiles
  SET role = 'superuser'
  WHERE email = 'till@seyer-marketing.de';

-- Update is_admin() to include superuser (used by RLS policies across all tables)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'moderator', 'superuser')
  );
END;
$$;
