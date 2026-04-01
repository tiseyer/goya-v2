-- ============================================================
-- Migration: RLS Policies for lessons
--
-- Three policies:
--   1. Admin/mod full CRUD (ALL)
--   2. Authenticated members can SELECT lessons of published, non-deleted courses
--   3. Course creators can SELECT lessons of their own courses (any status)
-- ============================================================

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Drop coarser inline policies from 20260380_lessons_table.sql (superseded by precise policies below)
DROP POLICY IF EXISTS "Anyone can read published course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course owners can manage own course lessons" ON public.lessons;
-- Drop same-named policy from 20260380 to avoid duplicate error
DROP POLICY IF EXISTS "Admins and moderators can manage lessons" ON public.lessons;
-- Drop own policies for idempotency (safe re-run)
DROP POLICY IF EXISTS "Members can read published course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course creators can read own course lessons" ON public.lessons;

-- ── Admins and moderators: full CRUD ────────────────────────────────────────
CREATE POLICY "Admins and moderators can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- ── Members: SELECT lessons of published, non-deleted courses ────────────────
CREATE POLICY "Members can read published course lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND courses.status = 'published'
      AND courses.deleted_at IS NULL
    )
  );

-- ── Course creators: SELECT lessons of their own courses (any status) ────────
CREATE POLICY "Course creators can read own course lessons"
  ON public.lessons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
      AND courses.created_by = auth.uid()
    )
  );
