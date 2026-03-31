ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lat double precision;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location_lng double precision;
