-- ============================================================
-- Migration: Events soft-delete + public RLS hardening
-- ============================================================

-- 1. Add deleted_at column (soft-delete timestamp)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 2. Expand the status CHECK to allow 'deleted'
--    PostgreSQL inline CHECK constraints are named {table}_{col}_check
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_status_check
  CHECK (status IN ('published', 'draft', 'cancelled', 'deleted'));

-- 3. Re-create the public read policy to exclude soft-deleted events
DROP POLICY IF EXISTS "Public can read published events" ON public.events;
CREATE POLICY "Public can read published events"
  ON public.events FOR SELECT
  USING (status = 'published' AND deleted_at IS NULL);
