---
phase: 36-database-migrations
plan: "03"
subsystem: database/migrations
tags: [rls, migrations, idempotency, gap-closure]
dependency_graph:
  requires: [36-01, 36-02]
  provides: [idempotent-migration-sequence]
  affects: [fresh-db-setup, local-dev, staging]
tech_stack:
  added: []
  patterns: [DROP POLICY IF EXISTS before CREATE POLICY]
key_files:
  created: []
  modified:
    - supabase/migrations/20260382_course_categories_rls.sql
    - supabase/migrations/20260383_lessons_rls.sql
decisions:
  - "Used DROP POLICY IF EXISTS pattern (not removing inline RLS from 20260379/20260380) to keep earlier migrations unmodified and self-contained"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_modified: 2
requirements_closed: [DB-05, DB-06, DB-07]
---

# Phase 36 Plan 03: Migration Idempotency Gap Closure Summary

**One-liner:** Added DROP POLICY IF EXISTS guards to 20260382 and 20260383 so the full 5-migration sequence applies cleanly to any fresh database without duplicate policy errors.

---

## What Was Done

The Phase 36 verification (36-VERIFICATION.md) found one gap: migration files 20260382 and 20260383 created RLS policies with names already created inline in their predecessor migration files (20260379 and 20260380). This caused "policy already exists" errors on any fresh `db push`.

Both files were edited to add DROP POLICY IF EXISTS statements before all CREATE POLICY statements.

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add DROP POLICY IF EXISTS to course_categories RLS migration | 1f85aab | supabase/migrations/20260382_course_categories_rls.sql |
| 2 | Add DROP POLICY IF EXISTS to lessons RLS migration | 6e9e921 | supabase/migrations/20260383_lessons_rls.sql |

---

## Changes Made

### 20260382_course_categories_rls.sql

Added two DROP statements after `ALTER TABLE ENABLE ROW LEVEL SECURITY` and before the CREATE POLICY statements:

```sql
DROP POLICY IF EXISTS "Anyone can read course categories" ON public.course_categories;
DROP POLICY IF EXISTS "Admins and moderators can manage course categories" ON public.course_categories;
```

These drop the same-named policies created inline in 20260379_course_categories.sql.

### 20260383_lessons_rls.sql

Added five DROP statements after `ALTER TABLE ENABLE ROW LEVEL SECURITY` and before the CREATE POLICY statements:

```sql
-- Drop coarser inline policies from 20260380_lessons_table.sql (superseded by precise policies below)
DROP POLICY IF EXISTS "Anyone can read published course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course owners can manage own course lessons" ON public.lessons;
-- Drop same-named policy from 20260380 to avoid duplicate error
DROP POLICY IF EXISTS "Admins and moderators can manage lessons" ON public.lessons;
-- Drop own policies for idempotency (safe re-run)
DROP POLICY IF EXISTS "Members can read published course lessons" ON public.lessons;
DROP POLICY IF EXISTS "Course creators can read own course lessons" ON public.lessons;
```

The 5 DROPs cover: 2 superseded coarse policies from 20260380, 1 same-name duplicate from 20260380, and 2 self-idempotency guards for this file's own policies.

---

## Verification Results

| Check | Result |
|-------|--------|
| 20260382 DROP count = 2 | PASS |
| 20260383 DROP count = 5 | PASS |
| All DROPs appear before CREATEs in 20260382 | PASS |
| All DROPs appear before CREATEs in 20260383 | PASS |

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Decisions Made

**Kept predecessor migration files unmodified:** The alternative approach (removing inline RLS blocks from 20260379 and 20260380) would have made those earlier files rely on their successors to function correctly. Instead, the DROP POLICY IF EXISTS pattern keeps each migration file self-contained and the earlier files unmodified — a safer choice for already-applied migrations.

---

## Known Stubs

None.

---

## Self-Check: PASSED

- `supabase/migrations/20260382_course_categories_rls.sql` — file exists, 2 DROP statements confirmed
- `supabase/migrations/20260383_lessons_rls.sql` — file exists, 5 DROP statements confirmed
- Commit 1f85aab — exists in git log
- Commit 6e9e921 — exists in git log
