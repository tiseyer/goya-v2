-- Add columns to courses first (required for RLS policies below)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_organizers boolean NOT NULL DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_instructors boolean NOT NULL DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS show_attendees boolean NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS organizer_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id);

-- Course instructors join table (mirrors event_instructors)
CREATE TABLE IF NOT EXISTS course_instructors (
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, profile_id)
);

-- Enable RLS
ALTER TABLE course_instructors ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read course instructors"
  ON course_instructors FOR SELECT
  USING (true);

-- Organizers and admins can manage instructors
CREATE POLICY "Organizers and admins can manage course instructors"
  ON course_instructors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_instructors.course_id
      AND (
        auth.uid() = ANY(c.organizer_ids)
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
      )
    )
  );

-- Course attendees join table
CREATE TABLE IF NOT EXISTS course_attendees (
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (course_id, profile_id)
);

-- Enable RLS
ALTER TABLE course_attendees ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read course attendees"
  ON course_attendees FOR SELECT
  USING (true);

-- Organizers and admins can manage attendees
CREATE POLICY "Organizers and admins can manage course attendees"
  ON course_attendees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_attendees.course_id
      AND (
        auth.uid() = ANY(c.organizer_ids)
        OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'moderator'))
      )
    )
  );
