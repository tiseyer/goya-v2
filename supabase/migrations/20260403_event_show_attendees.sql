-- v1.20 Fix 5: Attendees visibility toggle (default OFF)
ALTER TABLE events ADD COLUMN IF NOT EXISTS show_attendees boolean NOT NULL DEFAULT false;
