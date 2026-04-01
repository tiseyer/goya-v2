---
phase: 36-database-migrations
plan: "02"
subsystem: database
tags: [migration, rls, course_categories, lessons, typescript-types]
dependency_graph:
  requires: [36-01]
  provides: [course_categories-rls, lessons-rls, types-supabase-regenerated]
  affects: [all-course-query-code, lesson-access-control]
tech_stack:
  added: []
  patterns: [supabase-management-api-direct-sql, rls-event-categories-mirror-pattern]
key_files:
  created:
    - supabase/migrations/20260382_course_categories_rls.sql
    - supabase/migrations/20260383_lessons_rls.sql
  modified:
    - types/supabase.ts (no diff — already current from Plan 01 regeneration)
decisions:
  - "Updated lessons RLS from Plan 01's coarser policies (public SELECT, owner ALL) to plan-spec policies (authenticated SELECT published + creator SELECT own) — more precise access control"
  - "Applied policies via Supabase Management API (SUPABASE_ACCESS_TOKEN) — established pattern, db push blocked"
  - "TypeScript type regeneration produced no diff — Plan 01 already regenerated types with identical schema state"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 2
  files_modified: 0
  completed_date: "2026-04-01"
---

# Phase 36 Plan 02: RLS Policies and TypeScript Types Summary

One-liner: RLS secured on course_categories (public SELECT, admin/mod ALL) and lessons (admin/mod ALL, authenticated SELECT published-course lessons, authenticated SELECT own-course lessons), with TypeScript types confirmed current and tsc --noEmit passing at exit code 0.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create RLS policies for course_categories and lessons | 7274f65 | 20260382_course_categories_rls.sql, 20260383_lessons_rls.sql |
| 2 | Regenerate TypeScript types and fix compilation errors | (no diff) | types/supabase.ts already current |

## What Was Built

### course_categories RLS (20260382)
- `ENABLE ROW LEVEL SECURITY` on `public.course_categories`
- Policy "Anyone can read course categories" — FOR SELECT USING (true)
- Policy "Admins and moderators can manage course categories" — FOR ALL USING (profiles.role IN ('admin', 'moderator'))
- Mirrors event_categories pattern exactly

### lessons RLS (20260383)
- `ENABLE ROW LEVEL SECURITY` on `public.lessons`
- Policy "Admins and moderators can manage lessons" — FOR ALL USING (profiles.role IN ('admin', 'moderator'))
- Policy "Members can read published course lessons" — FOR SELECT TO authenticated USING (courses.status = 'published' AND courses.deleted_at IS NULL)
- Policy "Course creators can read own course lessons" — FOR SELECT TO authenticated USING (courses.created_by = auth.uid())

### TypeScript Types
- `types/supabase.ts` confirmed current — course_categories (4 occurrences), lessons (2 occurrences), category_id (5 occurrences)
- courses Row type: category_id present, vimeo_url absent
- `tsc --noEmit` exits 0 (only pre-existing linkify-it/mdurl noise unrelated to this work)

## Deviations from Plan

### Auto-fixed: Lessons RLS policies from Plan 01 updated to match plan spec

Plan 01 added coarser lessons RLS policies ("Anyone can read published course lessons" with no role restriction, "Course owners can manage own course lessons" as ALL). Plan 02 specifies more precise policies (TO authenticated for SELECT, owner gets SELECT-only not ALL). Dropped the Plan 01 policies and applied the plan-specified ones via Management API.

### Note: TypeScript type regeneration produced no diff

The `npx supabase gen types` command produced output identical to HEAD — types/supabase.ts was already current from Plan 01. No new commit was needed. RLS policies are server-side only and do not affect TypeScript type generation.

## Known Stubs

None — this is a pure database security and types plan with no UI or data fetching stubs.

## Verification Results

- `pg_policies` on course_categories: "Anyone can read course categories" (SELECT, public) + "Admins and moderators can manage course categories" (ALL, public)
- `pg_policies` on lessons: "Admins and moderators can manage lessons" (ALL, public) + "Members can read published course lessons" (SELECT, authenticated) + "Course creators can read own course lessons" (SELECT, authenticated)
- `grep "course_categories" types/supabase.ts` → 4 matches
- `grep "lessons" types/supabase.ts` → 2 matches
- `grep "category_id" types/supabase.ts` → 5 matches
- `vimeo_url` absent from courses Row type
- `npx tsc --noEmit` → exit code 0

## Self-Check: PASSED

- [x] `supabase/migrations/20260382_course_categories_rls.sql` exists
- [x] `supabase/migrations/20260383_lessons_rls.sql` exists
- [x] `types/supabase.ts` contains course_categories, lessons, category_id
- [x] Commit 7274f65 exists (RLS migration files)
- [x] RLS policies verified in remote DB via Management API
- [x] tsc --noEmit exits 0
