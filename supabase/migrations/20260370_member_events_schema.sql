-- ============================================================
-- Migration: Member Events — Schema Changes
-- Adds event_type, created_by, rejection_reason to events.
-- Extends status to support member submission workflow.
-- Creates event_audit_log table.
-- ============================================================

-- 1. Add event_type column (goya = admin-created, member = user-submitted)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type text NOT NULL DEFAULT 'goya'
  CHECK (event_type IN ('goya', 'member'));

-- 2. Add created_by FK (null for legacy admin-created events)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Extend status CHECK to include pending_review and rejected
--    Drop existing constraint (from 20260323_events_soft_delete.sql)
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'cancelled', 'deleted'));

-- 4. Add rejection_reason column
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 5. Create event_audit_log table
CREATE TABLE IF NOT EXISTS public.event_audit_log (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         uuid          NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  action           text          NOT NULL CHECK (action IN ('created', 'edited', 'status_changed', 'deleted')),
  performed_by     uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_role text,
  changes          jsonb,
  created_at       timestamptz   NOT NULL DEFAULT now()
);

-- 6. Index for efficient event history lookups
CREATE INDEX IF NOT EXISTS idx_event_audit_log_event_id
  ON public.event_audit_log(event_id);

-- 7. Index for efficient filtering by created_by
CREATE INDEX IF NOT EXISTS idx_events_created_by
  ON public.events(created_by);

-- 8. Index for efficient filtering by event_type
CREATE INDEX IF NOT EXISTS idx_events_event_type
  ON public.events(event_type);
