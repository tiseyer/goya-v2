-- ============================================================
-- Migration: RLS Policies for course_categories
--
-- Mirrors the event_categories RLS pattern exactly:
--   - Public SELECT (anyone can read categories)
--   - Admin/moderator full CRUD via ALL policy
-- ============================================================

ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins and moderators can manage course categories" ON public.course_categories;

CREATE POLICY "Anyone can read course categories"
  ON public.course_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins and moderators can manage course categories"
  ON public.course_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
