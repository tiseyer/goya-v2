-- Add wp_media_id column to media_items for WordPress media library migration deduplication
ALTER TABLE public.media_items ADD COLUMN IF NOT EXISTS wp_media_id integer;

-- Partial unique index: only enforces uniqueness on non-null values
-- so existing rows without WP origin are unaffected
CREATE UNIQUE INDEX IF NOT EXISTS media_items_wp_media_id_idx
  ON public.media_items(wp_media_id)
  WHERE wp_media_id IS NOT NULL;
