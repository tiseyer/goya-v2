-- ─── Courses table ────────────────────────────────────────────────────────────
CREATE TABLE public.courses (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title             text        NOT NULL,
  short_description text,
  description       text,
  category          text        NOT NULL CHECK (category IN ('Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research')),
  instructor        text,
  duration          text,
  level             text        CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  access            text        DEFAULT 'members_only' CHECK (access IN ('members_only', 'free')),
  vimeo_url         text,
  thumbnail_url     text,
  gradient_from     text        DEFAULT '#0f766e',
  gradient_to       text        DEFAULT '#134e4a',
  status            text        DEFAULT 'published' CHECK (status IN ('published', 'draft')),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ─── User course progress ──────────────────────────────────────────────────────
CREATE TABLE public.user_course_progress (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status       text        DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  enrolled_at  timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(user_id, course_id)
);

-- ─── RLS for courses ──────────────────────────────────────────────────────────
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published courses" ON public.courses
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins and moderators can manage courses" ON public.courses
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ─── RLS for progress ─────────────────────────────────────────────────────────
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own progress" ON public.user_course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_course_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_course_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all progress" ON public.user_course_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ─── Trigger ──────────────────────────────────────────────────────────────────
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Seed data: 8 courses matching existing academy-data.ts ───────────────────
INSERT INTO public.courses (title, short_description, description, category, instructor, duration, level, access, gradient_from, gradient_to, status) VALUES
(
  'Foundations of Vinyasa',
  'A comprehensive breakdown of Vinyasa yoga fundamentals for teachers and advanced practitioners.',
  'A comprehensive breakdown of Vinyasa yoga fundamentals — from breath-movement synchronization to intelligent sequencing principles for diverse student populations.',
  'Workshop', 'Priya Sharma', '4h 30m', 'Intermediate', 'members_only', '#14b8a6', '#0f766e', 'published'
),
(
  'Introduction to Yoga Nidra',
  'Discover the ancient practice of yogic sleep and learn to lead powerful Yoga Nidra sessions.',
  'Discover the ancient practice of yogic sleep. This guided course walks you through the five layers of consciousness and teaches you to lead powerful Yoga Nidra sessions.',
  'Yoga Sequence', 'Kenji Nakamura', '2h 15m', 'All Levels', 'free', '#a855f7', '#7e22ce', 'published'
),
(
  'The Yoga Sutras: A Living Philosophy',
  'An in-depth, accessible reading of Patanjali''s Yoga Sutras in the context of modern life.',
  'An in-depth, accessible reading of Patanjali''s Yoga Sutras in the context of modern life. Each chapter is paired with practical reflections and journaling prompts.',
  'Dharma Talk', 'Dr. Anand Mehta', '6h 00m', 'All Levels', 'members_only', '#3b82f6', '#1d4ed8', 'published'
),
(
  'Yin Yoga for Beginners',
  'A gentle, grounding introduction to Yin Yoga. Learn key poses and how to use props safely.',
  'A gentle, grounding introduction to Yin Yoga. Learn the key poses, how to use props, and how to safely hold postures to target the connective tissues of the body.',
  'Yoga Sequence', 'Freya Andersen', '3h 00m', 'Beginner', 'free', '#10b981', '#047857', 'published'
),
(
  'Healing Mantras & Sacred Music',
  'A curated collection of traditional Sanskrit mantras, kirtan recordings, and ambient soundscapes.',
  'A curated collection of traditional Sanskrit mantras, kirtan recordings, and ambient soundscapes for use in yoga classes, meditation, and personal practice.',
  'Music Playlist', 'Various Artists', '1h 20m', 'All Levels', 'members_only', '#f59e0b', '#ea580c', 'published'
),
(
  'The Science of Breathwork',
  'Explore the neuroscience and physiology behind pranayama and modern breathwork techniques.',
  'Explore the neuroscience and physiology behind pranayama and modern breathwork. Includes current research on the vagus nerve, HRV, and stress response modulation.',
  'Research', 'Sarah Mitchell', '2h 45m', 'Advanced', 'members_only', '#6366f1', '#4338ca', 'published'
),
(
  'Advanced Pranayama Techniques',
  'A deep practice-focused journey through Nadi Shodhana, Kapalabhati, Bhramari, and kumbhaka.',
  'A deep practice-focused journey through Nadi Shodhana, Kapalabhati, Bhramari, and advanced kumbhaka (breath retention) practices. Prerequisites: RYT 200 or equivalent.',
  'Workshop', 'Priya Sharma', '5h 00m', 'Advanced', 'members_only', '#0d9488', '#0891b2', 'published'
),
(
  'Yoga & Mental Health: Research Overview',
  'A thorough review of current research on yoga''s applications for anxiety, depression, PTSD, and chronic pain.',
  'A thorough review of current research on yoga''s applications for anxiety, depression, PTSD, and chronic pain. Presented in accessible language for teachers and practitioners.',
  'Research', 'Sophie van Berg', '3h 30m', 'All Levels', 'free', '#f43f5e', '#be185d', 'published'
);
