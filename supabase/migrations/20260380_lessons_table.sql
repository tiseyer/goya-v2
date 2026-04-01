-- ============================================================
-- Migration: Lessons Table
-- Creates lessons table with course_id FK, type enum,
-- numeric sort_order (float-capable for midpoint drag reorder),
-- and all media fields (video, audio, featured_image).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'audio', 'text')),
  sort_order numeric NOT NULL DEFAULT 0,
  short_description text,
  description text,
  video_platform text CHECK (video_platform IN ('vimeo', 'youtube')),
  video_url text,
  audio_url text,
  featured_image_url text,
  duration_minutes integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);
CREATE INDEX idx_lessons_sort_order ON public.lessons(course_id, sort_order);

-- RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published course lessons"
  ON public.lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = public.lessons.course_id
      AND courses.status = 'published'
    )
  );

CREATE POLICY "Admins and moderators can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Course owners can manage own course lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = public.lessons.course_id
      AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = public.lessons.course_id
      AND courses.created_by = auth.uid()
    )
  );

-- updated_at trigger
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
