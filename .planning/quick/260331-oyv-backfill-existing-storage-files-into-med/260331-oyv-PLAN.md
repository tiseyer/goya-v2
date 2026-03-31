---
phase: quick
plan: 260331-oyv
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/backfill-media-items.ts
  - package.json
autonomous: true
must_haves:
  truths:
    - "All existing Storage files across 5 buckets are represented in media_items"
    - "Duplicate runs do not create duplicate rows (idempotent by file_path)"
    - "Script logs per-bucket progress and final summary counts"
  artifacts:
    - path: "scripts/backfill-media-items.ts"
      provides: "One-time backfill script for media_items table"
    - path: "package.json"
      provides: "media:backfill npm script"
  key_links:
    - from: "scripts/backfill-media-items.ts"
      to: "media_items table"
      via: "supabase.from('media_items').upsert/insert"
      pattern: "from\\('media_items'\\)"
---

<objective>
Backfill all existing Supabase Storage files into the media_items table so the new media library has a complete inventory of previously uploaded assets.

Purpose: The media_items table was added after files already existed in storage. This one-time script bridges the gap.
Output: scripts/backfill-media-items.ts + "media:backfill" npm script
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/supabase/service.ts
@lib/media/register.ts
@app/admin/media/constants.ts
@scripts/seed-faqs.ts (env loading pattern)

<interfaces>
From app/admin/media/constants.ts:
```typescript
export const MEDIA_BUCKETS = [
  { key: 'avatars',              label: 'Avatars' },
  { key: 'event-images',         label: 'Events' },
  { key: 'school-logos',         label: 'Courses' },
  { key: 'upgrade-certificates', label: 'Certificates' },
  { key: 'uploads',              label: 'Uploads' },
] as const;
```

From lib/supabase/service.ts:
```typescript
export function getSupabaseService(): SupabaseClient<Database>
```

media_items columns: id, bucket, folder, file_name, file_path, file_url, file_type, file_size, width, height, title, alt_text, caption, uploaded_by, uploaded_by_role, created_at, updated_at
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create backfill script and add npm script</name>
  <files>scripts/backfill-media-items.ts, package.json</files>
  <action>
Create `scripts/backfill-media-items.ts` following the same env-loading pattern as `scripts/seed-faqs.ts`:

```
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '..', '.env.local') })
```

Then create a Supabase client directly (like seed-faqs.ts does — do NOT use getSupabaseService() since path aliases don't resolve in tsx scripts).

Script logic:

1. Define BUCKETS = ['avatars', 'event-images', 'school-logos', 'upgrade-certificates', 'uploads']

2. For each bucket:
   a. Use `supabase.storage.from(bucket).list('', { limit: 1000 })` to get root-level files and folders
   b. Recursively list subdirectories — storage.list() only returns one level. For each item where `item.id === null` (it's a folder), call list() again with that folder path. Continue recursively.
   c. Skip `.emptyFolderPlaceholder` files (Supabase creates these)
   d. For each real file, build:
      - file_path: `${folderPath}/${file.name}` (the storage path within the bucket)
      - file_name: `file.name`
      - file_url: `supabase.storage.from(bucket).getPublicUrl(file_path).data.publicUrl`
      - file_type: infer MIME from extension using a simple map (jpg/jpeg->image/jpeg, png->image/png, gif->image/gif, webp->image/webp, svg->image/svg+xml, pdf->application/pdf, default->application/octet-stream)
      - file_size: `file.metadata?.size ?? null`

3. Before inserting, query `media_items` for existing file_path+bucket combos to skip duplicates:
   - SELECT file_path FROM media_items WHERE bucket = $bucket
   - Build a Set of existing paths
   - Filter out files already in the set

4. Batch insert new files into media_items using `supabase.from('media_items').insert([...])` in chunks of 50. Set:
   - bucket, file_name, file_path, file_url, file_type, file_size
   - uploaded_by: null (we don't know who uploaded legacy files)
   - folder: null (media_folders feature is separate)

5. Log per-bucket: `[bucket] Found X files, Y already registered, Z inserted`
6. Log final summary: `Backfill complete: N total files inserted across all buckets`

IMPORTANT: Supabase storage.list() returns objects where folders have `id: null` and files have a non-null `id`. Use this to distinguish. The list() method takes a folder path as first arg and options as second. For root level, pass empty string ''.

IMPORTANT: Handle pagination — storage.list() returns max 100 items by default. Use `{ limit: 1000, offset: 0 }` and paginate if a bucket has >1000 files in a single folder (unlikely but handle gracefully with a while loop).

Add to package.json scripts: `"media:backfill": "tsx scripts/backfill-media-items.ts"`
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsx --version && cat scripts/backfill-media-items.ts | head -5</automated>
  </verify>
  <done>Script file exists with correct env loading, recursive listing, dedup logic, and batch insert. npm script "media:backfill" added to package.json.</done>
</task>

<task type="auto">
  <name>Task 2: Run the backfill and verify counts</name>
  <files>scripts/backfill-media-items.ts</files>
  <action>
Run: `npm run media:backfill`

If the script errors:
- Fix any issues (common: env var missing, type errors, storage API response shape)
- Re-run until successful

After success, verify by querying media_items counts:
- Run a quick tsx one-liner or use the script's output to confirm rows were inserted
- Run the script a SECOND TIME to verify idempotency — should report 0 new inserts

Log the final counts in the task output.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npm run media:backfill 2>&1 | tail -20</automated>
  </verify>
  <done>Backfill script ran successfully. All storage files are in media_items. Second run confirms 0 new inserts (idempotent).</done>
</task>

</tasks>

<verification>
- `npm run media:backfill` completes without errors
- Running it twice produces 0 new inserts on second run
- media_items table count matches total storage files found
</verification>

<success_criteria>
- All files from avatars, event-images, school-logos, upgrade-certificates, uploads buckets are in media_items
- Script is idempotent (safe to re-run)
- "media:backfill" npm script works
</success_criteria>

<output>
After completion, create `.planning/quick/260331-oyv-backfill-existing-storage-files-into-med/260331-oyv-SUMMARY.md`
</output>
