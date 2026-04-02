---
phase: 43
plan: "01"
subsystem: dashboard
tags: [cleanup, data-layer, queries, profile-completion, server-components]
dependency_graph:
  requires: []
  provides: [lib/dashboard/queries.ts, lib/dashboard/profileCompletion.ts]
  affects: [app/dashboard/page.tsx]
tech_stack:
  added: [server-only]
  patterns: [explicit-column-selects, supabase-join-pattern, weighted-scorer]
key_files:
  created:
    - lib/dashboard/queries.ts
    - lib/dashboard/profileCompletion.ts
  modified:
    - app/dashboard/page.tsx
decisions:
  - fetchUserInProgressCourses uses enrolled_at ordering (not last_accessed_at) because the actual user_course_progress schema has no last_accessed_at column
  - Supabase join return types require cast-through-unknown to satisfy TypeScript without generated DB types
  - server-only package installed (was missing from dependencies)
metrics:
  duration: ~18m
  completed_date: "2026-04-01"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
---

# Phase 43 Plan 01: Feed Cleanup + Data Infrastructure Summary

**One-liner:** Deleted 5 dead feed UI components and created server-only dashboard data layer with 5 typed fetch functions and a JSONB-safe weighted profile completion scorer.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Grep audit and delete feed component files | 2e4e762 | app/dashboard/{FeedView,FeedPostCard,PostComposer,PostActionsMenu,CommentDeleteButton}.tsx (deleted), app/dashboard/page.tsx |
| 2 | Create lib/dashboard/queries.ts with 5 fetch functions | 694bf77 | lib/dashboard/queries.ts |
| 3 | Create lib/dashboard/profileCompletion.ts with weighted scorer | 9a33d69 | lib/dashboard/profileCompletion.ts |

## Verification Results

- `app/dashboard/` contains only `page.tsx` — all 5 feed files deleted
- `grep -c "export" lib/dashboard/queries.ts` = 13 (5 functions + 8 type interfaces)
- `grep -c "export" lib/dashboard/profileCompletion.ts` = 5
- No `select('*')` usage in lib/dashboard/
- `npx tsc --noEmit` passes with zero new errors (pre-existing linkify-it type error unaffected)
- `isFieldComplete(null)` = false, `isFieldComplete('')` = false, `isFieldComplete([])` = false
- `isFieldComplete('hello')` = true, `isFieldComplete(['yoga'])` = true
- `getProfileCompletion({})` returns score 0

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adapted fetchUserInProgressCourses to actual schema**
- **Found during:** Task 2 — reading migration file 20260324_add_courses_tables.sql
- **Issue:** Plan spec referenced `completed_lessons`, `total_lessons`, `last_accessed_at` columns which do not exist in user_course_progress. Actual columns are: id, user_id, course_id, status, enrolled_at, completed_at
- **Fix:** Used `enrolled_at` for ordering (descending) and selected the actual columns. The return type `InProgressCourseRow` reflects the real schema.
- **Files modified:** lib/dashboard/queries.ts
- **Commit:** 694bf77

**2. [Rule 2 - Missing] Installed server-only package**
- **Found during:** Task 2 — server-only was referenced in other lib files but not in package.json
- **Fix:** `npm install server-only --legacy-peer-deps`
- **Files modified:** package.json, package-lock.json
- **Commit:** 694bf77

**3. [Rule 1 - Bug] Cast-through-unknown for Supabase join return types**
- **Found during:** Task 2 — tsc reported type overlap errors on join results
- **Issue:** Without generated DB types, Supabase returns joined rows typed as arrays. Direct cast to custom interfaces fails strict TS.
- **Fix:** Used `as unknown as T[]` pattern (consistent with project's existing approach in other files)
- **Files modified:** lib/dashboard/queries.ts
- **Commit:** 694bf77

## Known Stubs

- `app/dashboard/page.tsx` contains a placeholder div "Dashboard redesign in progress" in place of the FeedView section. This is intentional — the feed section will be replaced in plan 43-02 when page.tsx is rewritten as a server component.

## Self-Check: PASSED
