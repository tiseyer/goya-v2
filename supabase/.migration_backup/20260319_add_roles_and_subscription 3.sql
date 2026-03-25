-- ============================================================
-- Migration: Add roles enum, subscription tracking, username,
--            updated_at trigger, and RLS policies
-- ============================================================

-- 1. Add username column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- 2. Create user_role enum
CREATE TYPE public.user_role AS ENUM (
  'student',
  'teacher',
  'wellness_practitioner',
  'moderator',
  'admin'
);

-- 3. Migrate role column from text to user_role enum
--    All existing values are 'student', so the cast is safe.
ALTER TABLE public.profiles
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role
  USING role::public.user_role;

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'student';

-- 4. Add subscription_status column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text
  NOT NULL DEFAULT 'guest'
  CHECK (subscription_status IN ('member', 'guest'));

-- 5. Add updated_at column and trigger
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. RLS policies

-- Admins and moderators can read ALL profiles
CREATE POLICY "Admins and moderators can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

-- Admins can update any profile's role, is_verified, and subscription_status
CREATE POLICY "Admins can update user admin fields"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- 7. Performance indices for admin user queries
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles (role);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_subscription_status_idx ON public.profiles (subscription_status);
CREATE INDEX IF NOT EXISTS profiles_is_verified_idx ON public.profiles (is_verified);

-- 8. Promote owner account to admin
UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'till@seyer-marketing.de';
