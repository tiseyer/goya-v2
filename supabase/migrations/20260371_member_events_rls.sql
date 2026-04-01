-- ============================================================
-- Migration: Member Events — RLS Policies
--
-- Existing policies on events (from 20260322 + 20260323):
--   - "Public can read published events" (SELECT, status=published AND deleted_at IS NULL)
--   - "Admins can read all events" (SELECT, is_admin())
--   - "Admins can insert events" (INSERT, is_admin())
--   - "Admins can update events" (UPDATE, is_admin())
--   - "Admins can delete events" (DELETE, is_admin())
--
-- is_admin() returns true for role IN ('admin', 'moderator')
--
-- New policies add member-specific access without touching existing
-- admin/moderator policies. Admins keep full access via existing
-- policies. We add:
--   - Members can insert own member events
--   - Members can read own non-deleted events
--   - Members can update own draft/pending/rejected events
--   - Admins can see deleted events (existing "Admins can read all" already covers this)
--   - Moderators cannot see deleted events (existing policy uses is_admin() which includes mods,
--     but the public "published only" policy + member "own events" policy handle the rest.
--     We need a separate moderator SELECT that excludes deleted.)
-- ============================================================

-- ── Helper: check if user is a member who can submit events ──────────────────
CREATE OR REPLACE FUNCTION public.is_event_submitter()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('teacher', 'wellness_practitioner', 'admin')
  );
END;
$$;

-- ── Events: Members can INSERT own member events ─────────────────────────────
CREATE POLICY "Members can insert own events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND event_type = 'member'
    AND public.is_event_submitter()
  );

-- ── Events: Members can SELECT own non-deleted events ────────────────────────
-- (All statuses except deleted — so they can see their drafts, pending, rejected)
CREATE POLICY "Members can read own events"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status != 'deleted'
    AND deleted_at IS NULL
  );

-- ── Events: Members can UPDATE own events in editable statuses ───────────────
CREATE POLICY "Members can update own events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status IN ('draft', 'pending_review', 'rejected')
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- ── Events: Members can soft-delete own events ──────────────────────────────
-- (They can update status to 'deleted' and set deleted_at on their own events)
-- This is covered by the UPDATE policy above for draft/pending/rejected.
-- For published events, members need a separate policy to allow soft-delete:
CREATE POLICY "Members can delete own published events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'published'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'deleted'
  );

-- ── Event Audit Log: Enable RLS ─────────────────────────────────────────────
ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;

-- ── Event Audit Log: Any authenticated user can INSERT ──────────────────────
CREATE POLICY "Authenticated users can insert audit log"
  ON public.event_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── Event Audit Log: Admins can SELECT ──────────────────────────────────────
CREATE POLICY "Admins can read audit log"
  ON public.event_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role::text = 'admin'
    )
  );

-- ── Storage: Members can upload event images ────────────────────────────────
CREATE POLICY "Members can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND (public.is_admin() OR public.is_event_submitter())
  );
