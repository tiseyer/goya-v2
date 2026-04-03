CREATE TABLE IF NOT EXISTS public.page_hero_content (
  slug TEXT PRIMARY KEY,              -- e.g. 'dashboard', 'events', 'academy', 'addons'
  pill TEXT,                          -- nullable — null means use default
  title TEXT,                         -- nullable — null means use default
  subtitle TEXT,                      -- nullable — null means use default
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.page_hero_content ENABLE ROW LEVEL SECURITY;

-- Only admins can write
CREATE POLICY "Admins can manage hero content"
  ON public.page_hero_content
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Anyone can read (hero content is public display)
CREATE POLICY "Anyone can read hero content"
  ON public.page_hero_content
  FOR SELECT
  USING (true);
