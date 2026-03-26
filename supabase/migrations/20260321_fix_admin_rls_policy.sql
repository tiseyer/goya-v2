-- ============================================================
-- Fix recursive RLS policy on public.profiles
--
-- The "Admins and moderators can view all profiles" policy added
-- in 20260319 queries public.profiles from within a policy ON
-- public.profiles, causing infinite recursion. PostgreSQL detects
-- this and throws an error, which silently nullifies the profile
-- in the JS client — breaking the Admin nav link and any other
-- feature that depends on reading the user's own profile.
--
-- Fix: use the SECURITY DEFINER is_admin() function instead.
-- SECURITY DEFINER bypasses RLS when executing the inner SELECT,
-- breaking the recursion.
-- ============================================================

-- Ensure is_admin() exists and has SECURITY DEFINER
-- (defined in 001_profiles.sql but may be missing if schema.sql
--  was the only migration applied to the live DB)
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

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins and moderators can view all profiles" ON public.profiles;

-- Recreate it using the SECURITY DEFINER function (no recursion)
CREATE POLICY "Admins and moderators can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Also ensure the basic authenticated-read policy exists.
-- Without this, non-admin users cannot read any profile at all.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'profiles'
      AND policyname = 'Profiles are viewable by authenticated users'
  ) THEN
    CREATE POLICY "Profiles are viewable by authenticated users"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END;
$$;
