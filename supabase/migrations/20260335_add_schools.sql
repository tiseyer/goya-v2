CREATE TABLE public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  description text,
  street_address text,
  city text,
  state text,
  zip text,
  country text,
  website text,
  instagram text,
  facebook text,
  youtube text,
  tiktok text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved schools" ON public.schools
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Owner can read own school" ON public.schools
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can update own school" ON public.schools
  FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create schools" ON public.schools
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all schools" ON public.schools
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE TRIGGER update_schools_updated_at
  BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('school-logos', 'school-logos', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Public can view school logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-logos');
CREATE POLICY "School owners can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-logos' AND auth.uid()::text = (storage.foldername(name))[1]
  );
