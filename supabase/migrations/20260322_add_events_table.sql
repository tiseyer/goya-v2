-- ============================================================
-- Migration: Add events table, storage bucket, and seed data
-- ============================================================

-- Reusable updated_at trigger function (alias for handle_updated_at)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── Events table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text          NOT NULL,
  category         text          NOT NULL CHECK (category IN ('Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research')),
  format           text          NOT NULL CHECK (format IN ('Online', 'In Person', 'Hybrid')),
  description      text,
  date             date          NOT NULL,
  time_start       time          NOT NULL,
  time_end         time          NOT NULL,
  location         text,
  instructor       text,
  price            numeric(10,2) DEFAULT 0,
  is_free          boolean       DEFAULT false,
  spots_total      integer,
  spots_remaining  integer,
  featured_image_url text,
  status           text          DEFAULT 'published' CHECK (status IN ('published', 'draft', 'cancelled')),
  created_at       timestamptz   DEFAULT now(),
  updated_at       timestamptz   DEFAULT now()
);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Public can read published events"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Admins / moderators can read ALL events (including draft/cancelled)
CREATE POLICY "Admins can read all events"
  ON public.events FOR SELECT
  USING (public.is_admin());

-- Admins / moderators can insert, update, delete
CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (public.is_admin());

-- ── Storage bucket ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND public.is_admin()
  );

CREATE POLICY "Admins can update event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images'
    AND public.is_admin()
  );

CREATE POLICY "Admins can delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND public.is_admin()
  );

-- ── Seed: 10 events ───────────────────────────────────────────────────────────

INSERT INTO public.events (title, category, format, description, date, time_start, time_end, location, instructor, price, is_free, spots_total, spots_remaining, status) VALUES

-- 1 (existing)
('Vinyasa Flow Masterclass',
 'Workshop', 'Online',
 'A deep dive into the art of sequencing in Vinyasa yoga. Learn how to build intelligent, creative flows that honor anatomy and serve diverse bodies. Suitable for teachers and advanced students.',
 '2026-03-20', '10:00', '12:30', 'Online via Zoom', 'Priya Sharma', 25.00, false, 60, 40, 'published'),

-- 2 (existing)
('200-Hour Teacher Training: Info Session',
 'Teacher Training', 'Online',
 'Join us for an open information session about GOYA-accredited 200-hour teacher training programs. Ask questions, meet lead trainers, and learn about the application process.',
 '2026-03-22', '18:00', '19:30', 'Online via Zoom', 'GOYA Team', 0, true, null, null, 'published'),

-- 3 (existing)
('Dharma Talk: The Eight Limbs of Yoga',
 'Dharma Talk', 'Online',
 'An accessible and inspiring journey through Patanjali''s Ashtanga — the eight-limbed path of yoga. Open to all levels. No prior philosophy background required.',
 '2026-03-25', '19:00', '20:30', 'Online via YouTube Live', 'Kenji Nakamura', 0, true, null, null, 'published'),

-- 4 (existing)
('Yin Yoga & Meridian Theory Immersion',
 'Workshop', 'In Person',
 'A full-day immersion exploring Yin Yoga through the lens of Traditional Chinese Medicine. Learn how meridian theory can inform your practice and teaching. Includes lunch and course materials.',
 '2026-03-28', '09:00', '17:00', 'London, United Kingdom', 'Sarah Mitchell', 95.00, false, 24, 8, 'published'),

-- 5 (existing)
('Dharma Talk: Lessons from the Bhagavad Gita',
 'Dharma Talk', 'Online',
 'Exploring the timeless wisdom of the Bhagavad Gita and its practical relevance for modern yoga practitioners. This talk focuses on the concept of dharma and its application to daily life.',
 '2026-04-02', '19:00', '20:30', 'Online via Zoom', 'Ravi Krishnan', 0, true, null, null, 'published'),

-- 6 (new)
('Trauma-Informed Yoga: Foundations Workshop',
 'Workshop', 'Online',
 'An essential training for yoga teachers working with students who have experienced trauma. Learn the neurological basis of trauma responses and how to create truly safe, empowering spaces.',
 '2026-04-10', '14:00', '17:00', 'Online via Zoom', 'Dr. Ananya Menon', 65.00, false, 40, 29, 'published'),

-- 7 (new)
('Pranayama Immersion: Breath as Medicine',
 'Workshop', 'Hybrid',
 'A comprehensive exploration of pranayama techniques from the Hatha and Tantric traditions. Learn how conscious breath regulation affects the autonomic nervous system. Both in-person and live-stream attendance available.',
 '2026-04-18', '09:00', '16:00', 'Berlin, Germany', 'Thomas Bergmann', 120.00, false, 30, 18, 'published'),

-- 8 (new)
('300-Hour Advanced Teacher Training: Open Day',
 'Teacher Training', 'Online',
 'Explore our GOYA-accredited 300-hour advanced training pathway. This session covers curriculum overview, faculty introductions, practicum requirements, and scholarship opportunities.',
 '2026-04-25', '17:00', '18:30', 'Online via Zoom', 'GOYA Team', 0, true, null, null, 'published'),

-- 9 (new)
('GOYA Asia-Pacific Yoga Conference 2026',
 'Conference', 'Hybrid',
 'Our flagship Asia-Pacific gathering brings together teachers, researchers, and practitioners for three days of workshops, panels, and community connection. Early-bird pricing available through April 30.',
 '2026-05-08', '08:00', '18:00', 'Sydney, Australia', 'Multiple Presenters', 280.00, false, 200, 143, 'published'),

-- 10 (new — draft, should not appear on public page)
('Yoga Nidra & Restorative Sequence Training',
 'Workshop', 'Online',
 'An in-depth exploration of yoga nidra as a therapeutic tool. Learn to craft and lead 45–90 minute sessions for diverse contexts including stress management, sleep, and chronic pain.',
 '2026-05-15', '10:00', '15:00', 'Online via Zoom', 'Lakshmi Rao', 85.00, false, 35, 35, 'draft');
