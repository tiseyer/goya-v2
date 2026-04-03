-- Event instructors join table (replaces text-based instructor field)
CREATE TABLE IF NOT EXISTS event_instructors (
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

-- Enable RLS
ALTER TABLE event_instructors ENABLE ROW LEVEL SECURITY;

-- Public read for published events
CREATE POLICY "Anyone can read event instructors"
  ON event_instructors FOR SELECT
  USING (true);

-- Organizers and admins can manage instructors
CREATE POLICY "Organizers and admins can manage event instructors"
  ON event_instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_instructors.event_id
      AND (
        auth.uid() = ANY(e.organizer_ids)
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
      )
    )
  );

-- Visibility toggle columns on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_organizers boolean NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_instructors boolean NOT NULL DEFAULT true;
