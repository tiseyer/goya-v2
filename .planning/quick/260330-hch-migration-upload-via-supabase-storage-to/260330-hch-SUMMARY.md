---
phase: quick
plan: 260330-hch
subsystem: migration
tags: [storage, supabase, file-upload, sse, admin]
dependency_graph:
  requires: []
  provides: [migration-uploads bucket, storage-based migration import]
  affects: [app/admin/migration/page.tsx, app/api/admin/migration/import/route.ts]
tech_stack:
  added: [Supabase Storage migration-uploads bucket]
  patterns: [storage-as-request-body-proxy, content-type-based-branching, belt-and-suspenders-cleanup]
key_files:
  created:
    - supabase/migrations/20260367_migration_uploads_bucket.sql
  modified:
    - app/admin/migration/page.tsx
    - app/api/admin/migration/import/route.ts
    - supabase/migrations/20260366_add_faq_category.sql
decisions:
  - "Detect content-type in API route to branch between storage-based and FormData paths — no flag needed, keeps backward compat"
  - "Server-side cleanup happens before streaming starts (not in finally) so service client is still in scope"
  - "storagePaths reset to [] after pre-stream cleanup so SSE finally block is a no-op in normal flow"
metrics:
  duration: ~15min
  completed: 2026-03-30
  tasks_completed: 2
  files_changed: 4
---

# Quick Task 260330-hch: Migration Upload via Supabase Storage — Summary

Storage-based migration upload that routes WordPress export JSON through Supabase Storage to bypass Vercel's 4.5MB body size limit, while preserving the existing SSE streaming import flow.

## What Was Built

### Task 1: migration-uploads Storage Bucket

`supabase/migrations/20260367_migration_uploads_bucket.sql` creates:
- Private `migration-uploads` bucket, 50MB limit, `application/json` only
- Admin-only RLS: SELECT / INSERT / DELETE policies via `profiles.role = 'admin'`
- Migration applied via `npx supabase db push`

### Task 2: Storage-Based Upload Flow

**Client (`app/admin/migration/page.tsx`):**
- Phase 1: uploads each file to `migration-uploads` bucket, showing `Uploading filename.json...` in the spinner
- Phase 2: sends `POST /api/admin/migration/import` with `{ storagePaths, mode }` JSON body
- Phase 3 (finally): best-effort `supabase.storage.remove(storagePaths)` client-side cleanup

**API Route (`app/api/admin/migration/import/route.ts`):**
- `getSupabaseService()` hoisted before content-type branch (needed for both download and import)
- `application/json` branch: validates `storagePaths` array, downloads each blob, parses users, deletes files before streaming
- `multipart/form-data` branch: original FormData logic unchanged
- Both paths converge at shared `allUsers.length === 0` check and SSE stream

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Timestamp collision with 20260366_add_faq_category.sql**
- **Found during:** Task 1 — `npx supabase db push`
- **Issue:** Both my new migration and the pre-existing `20260366_add_faq_category.sql` shared timestamp `20260366`. Supabase's `schema_migrations` table has a unique constraint on version, so the second push threw `duplicate key value violates unique constraint`.
- **Fix:** Renamed my migration to `20260367_migration_uploads_bucket.sql`
- **Files modified:** `supabase/migrations/20260367_migration_uploads_bucket.sql` (renamed from 20260366)

**2. [Rule 3 - Blocking] 20260366_add_faq_category.sql blocked db push with column-already-exists error**
- **Found during:** Task 1 — first `db push` attempt
- **Issue:** `ALTER TABLE faq_items ADD COLUMN category text` failed because the column already existed in the remote DB (`SQLSTATE 42701`). This prevented the push batch from completing.
- **Fix:** Changed to `ADD COLUMN IF NOT EXISTS category text`
- **Files modified:** `supabase/migrations/20260366_add_faq_category.sql`
- **Commit:** a14cb92

## Commits

| Hash | Message |
|------|---------|
| a14cb92 | chore(260330-hch): create migration-uploads storage bucket with admin-only RLS |
| 06cf491 | feat(260330-hch): storage-based migration upload to bypass 4.5MB Vercel limit |

## Self-Check: PASSED

- `supabase/migrations/20260367_migration_uploads_bucket.sql` — exists, applied
- `app/admin/migration/page.tsx` — exists, builds cleanly
- `app/api/admin/migration/import/route.ts` — exists, builds cleanly
- Commits a14cb92 and 06cf491 — present in git log
