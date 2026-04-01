-- ============================================================
-- Migration: Member Courses — RLS Policies
--
-- Existing policies on courses (from 20260324):
--   - "Public can read published courses" (SELECT, status=published)
--   - "Admins and moderators can manage courses" (ALL, role IN admin/moderator)
--
-- New policies add member-specific access. Reuses is_event_submitter()
-- from events milestone (checks teacher/wellness_practitioner/admin roles).
-- ============================================================

-- ── Update public read policy to also exclude soft-deleted ───────────────────
DROP POLICY IF EXISTS "Public can read published courses" ON public.courses;
CREATE POLICY "Public can read published courses" ON public.courses
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- ── Courses: Members can INSERT own member courses ──────────────────────────
CREATE POLICY "Members can insert own courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND course_type = 'member'
    AND public.is_event_submitter()
  );

-- ── Courses: Members can SELECT own non-deleted courses ─────────────────────
CREATE POLICY "Members can read own courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status != 'deleted'
    AND deleted_at IS NULL
  );

-- ── Courses: Members can UPDATE own courses in editable statuses ────────────
CREATE POLICY "Members can update own courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status IN ('draft', 'pending_review', 'rejected')
  )
  WITH CHECK (
    created_by = auth.uid()
  );

-- ── Courses: Members can soft-delete own published courses ──────────────────
CREATE POLICY "Members can delete own published courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'published'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'deleted'
  );

-- ── Course Audit Log: Enable RLS ────────────────────────────────────────────
ALTER TABLE public.course_audit_log ENABLE ROW LEVEL SECURITY;

-- ── Course Audit Log: Any authenticated user can INSERT ─────────────────────
CREATE POLICY "Authenticated users can insert course audit log"
  ON public.course_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── Course Audit Log: Admins can SELECT ─────────────────────────────────────
CREATE POLICY "Admins can read course audit log"
  ON public.course_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role::text = 'admin'
    )
  );
