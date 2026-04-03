-- v1.20 Event Detail & Admin Form Overhaul
-- Phase 1: New columns + join tables

-- Short description on events
ALTER TABLE events ADD COLUMN IF NOT EXISTS short_description text;

-- Visibility toggles
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_organizers boolean NOT NULL DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_instructors boolean NOT NULL DEFAULT true;

-- External registration
ALTER TABLE events ADD COLUMN IF NOT EXISTS external_registration boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_website text;

-- Spot availability
ALTER TABLE events ADD COLUMN IF NOT EXISTS unlimited_spots boolean NOT NULL DEFAULT true;

-- Attendees join table
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_attendees' AND policyname = 'Anyone can read event attendees') THEN
    CREATE POLICY "Anyone can read event attendees" ON event_attendees FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_attendees' AND policyname = 'Users can join events') THEN
    CREATE POLICY "Users can join events" ON event_attendees FOR INSERT WITH CHECK (auth.uid() = profile_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_attendees' AND policyname = 'Users can leave events') THEN
    CREATE POLICY "Users can leave events" ON event_attendees FOR DELETE USING (
      auth.uid() = profile_id
      OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
    );
  END IF;
END $$;

-- Instructors join table (may already exist from prior migration)
CREATE TABLE IF NOT EXISTS event_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, profile_id)
);

ALTER TABLE event_instructors ENABLE ROW LEVEL SECURITY;

-- Policies for event_instructors may already exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_instructors' AND policyname = 'Anyone can read event instructors') THEN
    CREATE POLICY "Anyone can read event instructors" ON event_instructors FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_instructors' AND policyname = 'Organizers and admins can manage event instructors') THEN
    CREATE POLICY "Organizers and admins can manage event instructors" ON event_instructors FOR ALL USING (
      EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_instructors.event_id
        AND (
          auth.uid() = ANY(e.organizer_ids)
          OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
        )
      )
    );
  END IF;
END $$;
