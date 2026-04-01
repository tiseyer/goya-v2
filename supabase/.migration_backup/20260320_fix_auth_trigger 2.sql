-- ============================================================
-- Migration: Rebuild auth trigger robustly
--
-- Background: schema.sql and 001_profiles.sql diverged, which
-- may have left the live DB without a working on_auth_user_created
-- trigger. This migration recreates it idempotently.
--
-- Also updates handle_new_user() to:
--   1. Use ON CONFLICT DO NOTHING (safe for orphaned accounts)
--   2. Map the role from user metadata (Student → student, etc.)
--   3. Map country from user metadata into the location column
-- ============================================================

-- Recreate generate_mrn() in case it's missing
CREATE OR REPLACE FUNCTION public.generate_mrn()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_mrn text;
  done boolean;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_mrn := lpad(floor(random() * 100000000)::bigint::text, 8, '0');
    done := NOT EXISTS (SELECT 1 FROM public.profiles WHERE mrn = new_mrn);
  END LOOP;
  RETURN new_mrn;
END;
$$;

-- Recreate handle_new_user() with role mapping and safe ON CONFLICT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  raw_role text;
  mapped_role public.user_role;
BEGIN
  -- Map human-readable role from signup metadata to enum value
  raw_role := NEW.raw_user_meta_data->>'role';
  mapped_role := CASE
    WHEN raw_role = 'Teacher'               THEN 'teacher'::public.user_role
    WHEN raw_role = 'Wellness Practitioner' THEN 'wellness_practitioner'::public.user_role
    ELSE                                         'student'::public.user_role
  END;

  INSERT INTO public.profiles (id, email, full_name, mrn, role, location)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    public.generate_mrn(),
    mapped_role,
    COALESCE(NEW.raw_user_meta_data->>'country', NULL)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Fix orphaned accounts: users in auth.users with no profiles row.
-- This backfills them with a generated MRN and default 'student' role.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO public.profiles (id, email, full_name, mrn, role)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  public.generate_mrn(),
  'student'::public.user_role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;
