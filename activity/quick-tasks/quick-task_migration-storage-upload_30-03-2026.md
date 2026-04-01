# Quick Task: Migration Storage Upload

**Date:** 2026-03-30
**Task ID:** 260330-hch
**Status:** DONE

## Description

Bypass Vercel's 4.5MB body size limit on the migration import route by uploading JSON files to Supabase Storage first, then passing only storage paths to the API route.

Large WordPress export files (5-20MB+) were failing with 413 Payload Too Large on the `/api/admin/migration/import` route. This makes the migration tool unusable for real-world data sets.

## Solution

1. **Created `migration-uploads` Supabase Storage bucket** (`20260367_migration_uploads_bucket.sql`):
   - Private bucket, 50MB file size limit, JSON-only
   - Admin-only RLS policies (SELECT/INSERT/DELETE) via `profiles.role = 'admin'` check

2. **Updated client** (`app/admin/migration/page.tsx`):
   - Uploads each file to `migration-uploads` bucket before calling the API
   - Shows per-file upload progress in the spinner text
   - Sends a small JSON POST (`{ storagePaths, mode }`) instead of FormData
   - Best-effort cleanup in `finally` block via `supabase.storage.remove()`

3. **Updated API route** (`app/api/admin/migration/import/route.ts`):
   - Detects `application/json` Content-Type for new storage-based path
   - Downloads blobs via service role client (bypasses RLS), parses users
   - Deletes storage files before streaming begins (server-side cleanup)
   - FormData path preserved for backward compatibility
   - SSE streaming logic unchanged

## Deviation

- **[Rule 3 - Blocking]** Fixed `20260366_add_faq_category.sql` to use `IF NOT EXISTS` — it was blocking `db push` due to an already-applied column. Also renamed bucket migration from `20260366` to `20260367` to avoid timestamp collision with that existing file.
