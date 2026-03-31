-- Phase 1: Event Form Redesign — add new columns to events table
-- All columns nullable or with defaults — no breaking changes

ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE events ADD COLUMN IF NOT EXISTS all_day boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS online_platform_name text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS online_platform_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_required boolean DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_ids uuid[] DEFAULT '{}';
