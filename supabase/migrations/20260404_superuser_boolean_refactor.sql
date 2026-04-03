-- Refactor: replace superuser role with is_superuser boolean column
-- The role stays 'admin' — is_superuser is a permission flag only

-- Add boolean column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_superuser BOOLEAN NOT NULL DEFAULT false;

-- Set superuser flag for the correct account
UPDATE public.profiles
  SET is_superuser = true, role = 'admin'
  WHERE email = 'till.seyer@icloud.com';

-- Ensure old account is plain admin
UPDATE public.profiles
  SET role = 'admin', is_superuser = false
  WHERE email = 'till@seyer-marketing.de'
    AND role = 'superuser';

-- Revert any other accounts that might have been set to superuser role
UPDATE public.profiles
  SET role = 'admin'
  WHERE role = 'superuser';

-- Restore is_admin() — remove superuser from role check (no longer needed)
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
      AND role::text IN ('admin', 'moderator')
  );
END;
$$;
