---
phase: quick
plan: 260330-hch
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260366_migration_uploads_bucket.sql
  - app/admin/migration/page.tsx
  - app/api/admin/migration/import/route.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Admin can upload JSON files larger than 4.5MB without 413 error"
    - "Import progress streaming works identically to before"
    - "Uploaded files are cleaned up from storage after import completes"
  artifacts:
    - path: "supabase/migrations/20260366_migration_uploads_bucket.sql"
      provides: "migration-uploads storage bucket with admin-only RLS"
      contains: "migration-uploads"
    - path: "app/admin/migration/page.tsx"
      provides: "Client-side upload to Supabase Storage before triggering import"
    - path: "app/api/admin/migration/import/route.ts"
      provides: "API route that downloads from storage instead of parsing FormData"
  key_links:
    - from: "app/admin/migration/page.tsx"
      to: "supabase storage migration-uploads bucket"
      via: "supabase.storage.from('migration-uploads').upload()"
      pattern: "storage\\.from.*migration-uploads.*upload"
    - from: "app/api/admin/migration/import/route.ts"
      to: "supabase storage migration-uploads bucket"
      via: "getSupabaseService().storage.from('migration-uploads').download()"
      pattern: "storage\\.from.*migration-uploads.*download"
---

<objective>
Bypass Vercel's 4.5MB body size limit on the migration import route by uploading JSON files to Supabase Storage first, then passing only storage paths to the API route.

Purpose: Large WordPress export files (5-20MB+) currently fail with 413 Payload Too Large. This makes the migration tool unusable for real data sets.
Output: Working migration flow that handles arbitrarily large JSON files via storage intermediary.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/supabase.ts (browser client — `supabase` export)
@lib/supabase/service.ts (service role client — `getSupabaseService()`)
@app/admin/migration/page.tsx (current client upload flow)
@app/api/admin/migration/import/route.ts (current API route)
@migration/import-core.ts (import logic — unchanged)
@supabase/migrations/20260325_add_onboarding.sql (bucket creation pattern reference)

<interfaces>
From lib/supabase.ts:
```typescript
export const supabase: SupabaseBrowserClient // createBrowserClient(URL, ANON_KEY)
```

From lib/supabase/service.ts:
```typescript
export function getSupabaseService(): SupabaseClient // service_role key
```

From migration/import-core.ts:
```typescript
export type ImportMode = 'skip' | 'overwrite'
export interface WPExportUser { /* ... */ }
export interface UserResult { email: string; wp_id: number; status: 'created' | 'skipped' | 'updated' | 'error'; error?: string }
export function importUsersFromData(supabase, users: WPExportUser[], mode: ImportMode, onProgress): Promise<MigrationLog>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration-uploads storage bucket migration</name>
  <files>supabase/migrations/20260366_migration_uploads_bucket.sql</files>
  <action>
Create a new SQL migration file following the established bucket creation pattern (see 20260325_add_onboarding.sql):

1. Create the `migration-uploads` bucket:
   ```sql
   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
   VALUES (
     'migration-uploads',
     'migration-uploads',
     false,
     52428800,
     ARRAY['application/json']
   ) ON CONFLICT (id) DO NOTHING;
   ```
   - Private bucket (public = false)
   - 50MB file size limit (52428800 bytes)
   - Only allow application/json

2. RLS policies — admin-only access using the established `profiles.role` check pattern:
   - SELECT: `bucket_id = 'migration-uploads' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')`
   - INSERT: same WITH CHECK
   - DELETE: same USING clause
   - No UPDATE policy needed (files are write-once, read-once, delete)

3. Run `npx supabase db push` after creating the migration file (per project convention in MEMORY.md).
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx supabase db push --dry-run 2>&1 | head -20</automated>
  </verify>
  <done>Migration file exists, bucket created with admin-only RLS policies, db push succeeds</done>
</task>

<task type="auto">
  <name>Task 2: Update client upload flow and API route for storage-based transfer</name>
  <files>app/admin/migration/page.tsx, app/api/admin/migration/import/route.ts</files>
  <action>
**Client (`app/admin/migration/page.tsx`):**

1. Add import: `import { supabase } from '@/lib/supabase'`

2. Add a new state for upload phase: `const [uploadPhase, setUploadPhase] = useState<string | null>(null)`

3. Rewrite `handleImport()`:
   - Phase 1 — Upload to storage:
     - Set `setImporting(true)`, clear errors/log/progress
     - For each file in `files`:
       - Generate path: `${Date.now()}-${file.name}`
       - `setUploadPhase(`Uploading ${file.name}...`)`
       - Call `supabase.storage.from('migration-uploads').upload(path, file, { contentType: 'application/json' })`
       - If upload error, throw with message including filename
       - Collect `storagePaths[]`
     - `setUploadPhase(null)`
   - Phase 2 — Trigger import via small JSON POST:
     - `fetch('/api/admin/migration/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storagePaths, mode }), signal: abort.signal })`
     - Read SSE stream exactly as before (no changes to stream parsing)
   - Phase 3 — Cleanup (in finally block):
     - Best-effort delete all uploaded files: `supabase.storage.from('migration-uploads').remove(storagePaths)`
     - Don't throw on cleanup failure — just log to console

4. Update the "Preparing import..." spinner section to show `uploadPhase` text when non-null:
   - When `importing && !progress`: show `uploadPhase || 'Preparing import...'`

**API (`app/api/admin/migration/import/route.ts`):**

1. Detect request type by Content-Type header:
   - If `application/json` → new storage-based flow
   - If `multipart/form-data` → existing FormData flow (keep for backward compat)

2. For JSON body flow (new path):
   - Parse body: `const { storagePaths, mode } = await request.json()`
   - Validate: `storagePaths` must be non-empty string array, `mode` must be 'skip' or 'overwrite'
   - For each path in `storagePaths`:
     - `const { data, error } = await supabaseService.storage.from('migration-uploads').download(path)`
     - If error, return 400 with path info
     - `const text = await data.text()`
     - Parse JSON, extract users array (same logic as existing FormData path)
     - Push to `allUsers[]`
   - After downloading all files, delete them from storage: `supabaseService.storage.from('migration-uploads').remove(storagePaths)` — best-effort, don't fail import on cleanup error
   - Proceed with existing SSE streaming logic (unchanged)

3. Extract the shared logic (user parsing, SSE streaming) so both paths converge after `allUsers[]` is populated. The simplest approach: keep the FormData parsing block and add a new JSON parsing block before the shared `if (allUsers.length === 0)` check. Structure:
   ```
   // Detect content type
   const contentType = request.headers.get('content-type') || ''
   let allUsers: WPExportUser[] = []
   let mode: string
   let storagePaths: string[] = []

   if (contentType.includes('application/json')) {
     // NEW: storage-based flow
     // ... parse JSON body, download from storage, populate allUsers
   } else {
     // EXISTING: FormData flow (unchanged)
     // ... parse formData, populate allUsers
   }

   // SHARED: validation + SSE streaming (unchanged)
   ```

4. Add cleanup in the SSE stream's `finally` block as well (server-side belt-and-suspenders):
   ```
   finally {
     // Clean up storage files if any
     if (storagePaths.length > 0) {
       supabaseService.storage.from('migration-uploads').remove(storagePaths).catch(() => {})
     }
     controller.close()
   }
   ```
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next build 2>&1 | tail -20</automated>
  </verify>
  <done>
    - Client uploads files to Supabase Storage before triggering import
    - API route accepts JSON body with storagePaths, downloads from storage
    - FormData backward compatibility preserved
    - Storage cleanup happens both client-side and server-side
    - Build succeeds with no type errors
  </done>
</task>

</tasks>

<verification>
1. Build passes: `npx next build` completes without errors
2. Migration applied: `npx supabase db push` succeeds
3. Manual test: Upload a >4.5MB JSON file at /admin/migration — should succeed where it previously returned 413
</verification>

<success_criteria>
- Migration JSON files over 4.5MB upload successfully through the migration page
- Import progress streaming works identically to before (SSE events, progress bar)
- Storage files are cleaned up after import (no orphaned files in migration-uploads bucket)
- Existing small-file FormData flow still works as fallback
</success_criteria>

<output>
After completion, create `.planning/quick/260330-hch-migration-upload-via-supabase-storage-to/260330-hch-SUMMARY.md`
</output>
