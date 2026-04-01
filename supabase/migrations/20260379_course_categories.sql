-- ============================================================
-- Migration: Course Categories Table
-- Creates course_categories lookup table mirroring event_categories.
-- Seeds the 5 canonical categories matching courses.category CHECK values.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text NOT NULL DEFAULT '#345c83',
  parent_id uuid REFERENCES public.course_categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with the 5 canonical categories (matching courses.category CHECK values)
INSERT INTO public.course_categories (name, slug, color, sort_order) VALUES
  ('Workshop', 'workshop', '#0d9488', 1),
  ('Yoga Sequence', 'yoga-sequence', '#a855f7', 2),
  ('Dharma Talk', 'dharma-talk', '#3b82f6', 3),
  ('Music Playlist', 'music-playlist', '#f59e0b', 4),
  ('Research', 'research', '#6366f1', 5)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.course_categories ENABLE ROW LEVEL SECURITY;

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

-- updated_at trigger
CREATE TRIGGER update_course_categories_updated_at
  BEFORE UPDATE ON public.course_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
