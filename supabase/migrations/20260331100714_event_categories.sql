CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text NOT NULL DEFAULT '#345c83',
  parent_id uuid REFERENCES event_categories(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with existing hardcoded categories
INSERT INTO event_categories (name, slug, color) VALUES
  ('Workshop', 'workshop', '#345c83'),
  ('Teacher Training', 'teacher-training', '#345c83'),
  ('Dharma Talk', 'dharma-talk', '#345c83'),
  ('Conference', 'conference', '#345c83'),
  ('Yoga Sequence', 'yoga-sequence', '#345c83'),
  ('Music Playlist', 'music-playlist', '#345c83'),
  ('Research', 'research', '#345c83')
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON event_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins and moderators can manage categories"
  ON event_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'moderator')
    )
  );
