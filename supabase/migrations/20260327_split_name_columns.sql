-- Add separate first_name and last_name columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;

-- Migrate existing full_name data: split on first space
UPDATE public.profiles
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = NULLIF(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1), '')
WHERE full_name IS NOT NULL AND full_name != '';

-- Keep full_name as auto-computed via trigger
CREATE OR REPLACE FUNCTION sync_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name = TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_full_name_trigger ON public.profiles;

CREATE TRIGGER sync_full_name_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_full_name();
