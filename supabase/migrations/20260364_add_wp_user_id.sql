-- Add wp_user_id column to profiles for WordPress user ID mapping
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wp_user_id integer;

-- Index for fast lookups by WordPress user ID
CREATE INDEX IF NOT EXISTS idx_profiles_wp_user_id
  ON public.profiles (wp_user_id)
  WHERE wp_user_id IS NOT NULL;
