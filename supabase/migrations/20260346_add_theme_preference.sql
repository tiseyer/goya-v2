-- Add theme preference column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'system'
CHECK (theme_preference IN ('light', 'dark', 'system'));
