-- ============================================================
-- Migration: Create migration-uploads storage bucket
-- ============================================================
-- Private bucket for temporary upload staging of WordPress export JSON files.
-- Files are uploaded by the client before triggering the import API, which
-- downloads and processes them server-side, then deletes them.
-- Admin-only access via RLS policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'migration-uploads',
  'migration-uploads',
  false,
  52428800,
  ARRAY['application/json']
) ON CONFLICT (id) DO NOTHING;

-- SELECT: admins can read files they uploaded
CREATE POLICY "Admins can read migration uploads"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'migration-uploads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- INSERT: admins can upload files
CREATE POLICY "Admins can upload migration files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'migration-uploads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- DELETE: admins can delete files (cleanup after import)
CREATE POLICY "Admins can delete migration uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'migration-uploads'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
