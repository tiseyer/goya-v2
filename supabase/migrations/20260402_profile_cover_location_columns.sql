-- Migration: Add cover image + location columns to profiles, create profile-covers storage bucket (DB-01, DB-03)

-- Add cover_image_url, location_lat, location_lng, location_place_id to profiles (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cover_image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lat double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_lng'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_lng double precision;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'location_place_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location_place_id text;
  END IF;
END $$;

-- Create profile-covers storage bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-covers', 'profile-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for profile-covers bucket (drop-and-recreate for idempotency)
DROP POLICY IF EXISTS "Public read profile covers" ON storage.objects;
CREATE POLICY "Public read profile covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-covers');

DROP POLICY IF EXISTS "Authenticated upload profile covers" ON storage.objects;
CREATE POLICY "Authenticated upload profile covers" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update profile covers" ON storage.objects;
CREATE POLICY "Authenticated update profile covers" ON storage.objects
  FOR UPDATE USING (bucket_id = 'profile-covers' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete profile covers" ON storage.objects;
CREATE POLICY "Authenticated delete profile covers" ON storage.objects
  FOR DELETE USING (bucket_id = 'profile-covers' AND auth.role() = 'authenticated');
