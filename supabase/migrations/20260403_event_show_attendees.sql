-- v1.20 Fix 5: Attendees visibility toggle
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_attendees boolean NOT NULL DEFAULT true;
