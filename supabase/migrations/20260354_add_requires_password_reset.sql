-- Add requires_password_reset column to profiles
-- Used by migration import to flag users who need to set a new password on first login.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS requires_password_reset boolean NOT NULL DEFAULT false;

-- Index for middleware lookups (every request checks this flag)
CREATE INDEX IF NOT EXISTS idx_profiles_requires_password_reset
  ON public.profiles (requires_password_reset)
  WHERE requires_password_reset = true;
