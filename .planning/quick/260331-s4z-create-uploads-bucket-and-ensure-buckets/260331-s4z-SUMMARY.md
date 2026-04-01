---
task_id: 260331-s4z
date: 2026-03-31
status: complete
commit: 9b9277b
files_created:
  - scripts/ensure-buckets.ts
files_modified:
  - package.json
---

# Quick Task 260331-s4z: Create uploads bucket and ensure-buckets setup script

**One-liner:** Idempotent bucket provisioning script using service-role client; created missing `uploads` (public) bucket that was blocking GOYA logo uploads.

## What Was Done

Created `scripts/ensure-buckets.ts` and added `buckets:ensure` npm script.

The script:
- Loads `.env.local` via dotenv (cwd-first then __dirname fallback — same as `migrate-wp-avatars.ts`)
- Creates an inline service-role Supabase client
- Iterates over three buckets: `avatars` (public), `uploads` (public), `school-documents` (private)
- Calls `supabase.storage.createBucket()` for each; treats "already exists" as success
- Exits with code 1 if any bucket fails for a non-idempotent reason
- Logs summary: `N created, N already existed, N failed`

## Execution Result

```
Bucket 'avatars' already exists
Created bucket 'uploads' (public: true)
Bucket 'school-documents' already exists

Done. 1 created, 2 already existed, 0 failed.
```

Exit code: 0

## Deviations

None — plan executed exactly as written.

## Self-Check: PASSED

- `scripts/ensure-buckets.ts` exists
- `package.json` contains `"buckets:ensure"` script
- Commit `9b9277b` exists
- `uploads` bucket created in Supabase Storage
