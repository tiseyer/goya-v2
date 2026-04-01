-- ============================================================
-- Migration: MRN lifecycle tracking system
--
-- Purpose: Ensure MRNs are never reused, even after user
-- deletion/anonymization. Previously generate_mrn() only
-- checked the profiles table, meaning a deleted user's MRN
-- could be reassigned to a new user.
--
-- This migration:
--   1. Creates the used_mrns table (permanent MRN registry)
--   2. Updates generate_mrn() to check used_mrns for uniqueness
--   3. Adds trigger to record MRNs in used_mrns on profile insert/update
--   4. Adds trigger to retire MRNs in used_mrns on profile delete
--   5. Backfills all existing profile MRNs into used_mrns
--   6. Generates and records MRNs for any profiles missing them
-- ============================================================

-- ============================================================
-- 1. Create used_mrns table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.used_mrns (
  mrn TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired'))
);

-- Enable RLS
ALTER TABLE public.used_mrns ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read (for lookup/display purposes)
CREATE POLICY "used_mrns are viewable by authenticated users"
  ON public.used_mrns FOR SELECT
  TO authenticated
  USING (true);

-- RLS: full access for service_role (trigger functions run as service_role)
CREATE POLICY "Service role has full access to used_mrns"
  ON public.used_mrns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index on status for efficient queries filtering by active/retired
CREATE INDEX IF NOT EXISTS idx_used_mrns_status ON public.used_mrns(status);

COMMENT ON TABLE public.used_mrns IS 'Tracks all MRNs ever issued. Prevents reuse after user deletion or anonymization.';

-- ============================================================
-- 2. Update generate_mrn() to check used_mrns instead of profiles
-- ============================================================
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
    done := NOT EXISTS (SELECT 1 FROM public.used_mrns WHERE mrn = new_mrn);
  END LOOP;
  RETURN new_mrn;
END;
$$;

-- ============================================================
-- 3. Trigger function: record MRN in used_mrns on profile insert/update
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_mrn_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.mrn IS NOT NULL THEN
    INSERT INTO public.used_mrns (mrn, status)
    VALUES (NEW.mrn, 'active')
    ON CONFLICT (mrn) DO UPDATE SET status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_mrn_set ON public.profiles;

CREATE TRIGGER on_profile_mrn_set
  AFTER INSERT OR UPDATE OF mrn ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.record_mrn_usage();

-- ============================================================
-- 4. Trigger function: retire MRN in used_mrns on profile delete
-- ============================================================
CREATE OR REPLACE FUNCTION public.retire_mrn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.mrn IS NOT NULL THEN
    UPDATE public.used_mrns SET status = 'retired' WHERE mrn = OLD.mrn;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;

CREATE TRIGGER on_profile_deleted
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.retire_mrn();

-- ============================================================
-- 5. Backfill: insert all existing profile MRNs into used_mrns
-- ============================================================
INSERT INTO public.used_mrns (mrn, status)
SELECT mrn, 'active'
FROM public.profiles
WHERE mrn IS NOT NULL
ON CONFLICT (mrn) DO NOTHING;

-- ============================================================
-- 6. Backfill: generate MRNs for any profiles missing them
--
-- Note: generate_mrn() now checks used_mrns (just backfilled above),
-- so uniqueness is guaranteed. The on_profile_mrn_set trigger will
-- automatically insert each new MRN into used_mrns.
-- ============================================================
DO $$
DECLARE
  profile_record RECORD;
  new_mrn TEXT;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE mrn IS NULL LOOP
    new_mrn := public.generate_mrn();
    UPDATE public.profiles SET mrn = new_mrn WHERE id = profile_record.id;
    -- The on_profile_mrn_set trigger auto-inserts into used_mrns
  END LOOP;
END;
$$;
