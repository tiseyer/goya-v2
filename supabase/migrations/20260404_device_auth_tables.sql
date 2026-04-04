-- =============================================================================
-- Device Authentication Tables
-- Migration: 20260404_device_auth_tables
-- Creates: trusted_devices, device_verification_codes
-- Also: indexes, RLS policies
-- =============================================================================

-- === Table 1: trusted_devices (DB-01) ===

CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_name text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_trusted_device UNIQUE (profile_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_profile_id ON public.trusted_devices(profile_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_lookup ON public.trusted_devices(profile_id, device_fingerprint);

-- === Table 2: device_verification_codes (DB-02) ===

CREATE TABLE IF NOT EXISTS public.device_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hashed_code text NOT NULL,
  device_fingerprint text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  invalidated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_verification_codes_profile_id ON public.device_verification_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_device_verification_codes_lookup ON public.device_verification_codes(profile_id, invalidated, expires_at);

-- === RLS Policies: trusted_devices (DB-03) ===

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can read their own trusted devices (read-only)
CREATE POLICY "users_read_own_devices" ON public.trusted_devices
  FOR SELECT
  USING (profile_id = auth.uid());

-- Admins have full access (select, insert, update, delete)
CREATE POLICY "admins_full_access_devices" ON public.trusted_devices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- === RLS Policies: device_verification_codes (DB-03) ===

ALTER TABLE public.device_verification_codes ENABLE ROW LEVEL SECURITY;

-- No user-facing policies — all access via service role in API routes only
-- Authenticated users cannot SELECT, INSERT, UPDATE, or DELETE directly
