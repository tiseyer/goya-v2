-- ============================================================
-- Migration: Backfill onboarding_completed for pre-existing users
-- ============================================================
-- Admins and moderators pre-date the onboarding system.
-- Mark them as completed so they aren't forced through onboarding.
UPDATE public.profiles
SET onboarding_completed = true
WHERE role IN ('admin', 'moderator')
  AND onboarding_completed = false;
