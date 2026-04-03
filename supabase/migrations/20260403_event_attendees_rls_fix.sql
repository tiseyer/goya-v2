-- v1.20 Fix 3: Allow organizers and admins to manage attendees via admin form
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_attendees' AND policyname = 'Organizers can manage attendees') THEN
    CREATE POLICY "Organizers can manage attendees" ON event_attendees
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM events e
          WHERE e.id = event_attendees.event_id
          AND auth.uid() = ANY(e.organizer_ids)
        )
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_attendees' AND policyname = 'Admins can manage attendees') THEN
    CREATE POLICY "Admins can manage attendees" ON event_attendees
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND p.role IN ('admin', 'moderator')
        )
      );
  END IF;
END $$;
