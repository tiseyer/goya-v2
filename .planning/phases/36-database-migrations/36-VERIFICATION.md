---
phase: 36-database-migrations
verified: 2026-04-01T12:00:00Z
status: human_needed
score: 8/8 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 7/8
  gaps_closed:
    - "Migration files are idempotent and can be applied sequentially to a clean DB — both 20260382 and 20260383 now have DROP POLICY IF EXISTS guards before every CREATE POLICY"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Confirm active lessons RLS policies on remote DB"
    expected: "Exactly 3 policies on lessons: 'Admins and moderators can manage lessons' (ALL), 'Members can read published course lessons' (SELECT, authenticated), 'Course creators can read own course lessons' (SELECT, authenticated). The coarser Plan 01 inline policies ('Anyone can read published course lessons', 'Course owners can manage own course lessons') should NOT be active."
    why_human: "Cannot query remote DB pg_policies from CLI without a live Supabase connection. The DROP POLICY IF EXISTS statements in 20260383 ensure these are removed on future fresh deployments, but the current remote state cannot be verified programmatically."
  - test: "Confirm app code with dropped-column references does not break live pages"
    expected: "academy/page.tsx, admin/courses/page.tsx, admin/inbox/CoursesTab.tsx, my-courses pages — all pages load without JS errors. course.category, course.duration, course.vimeo_url render as undefined/empty, not crashing the page."
    why_human: "These are runtime UI regressions that tsc --noEmit does not catch. Phase 38 is planned to resolve these properly."
---

# Phase 36: Database Migrations Verification Report

**Phase Goal:** The database fully supports the course system redesign — course_categories and lessons tables exist, courses schema updated, RLS policies enforced, and TypeScript types pass
**Verified:** 2026-04-01
**Status:** human_needed (all automated checks pass; 2 items need human confirmation)
**Re-verification:** Yes — gap closure verification after previous gaps_found result

---

## Re-verification Summary

**Previous status:** gaps_found (7/8)
**Current status:** human_needed (8/8)

### Gaps Closed

The single blocker gap from the previous verification is now resolved:

- `supabase/migrations/20260382_course_categories_rls.sql` — lines 11–12 now contain:
  ```sql
  DROP POLICY IF EXISTS "Anyone can read course categories" ON public.course_categories;
  DROP POLICY IF EXISTS "Admins and moderators can manage course categories" ON public.course_categories;
  ```
  These precede the `CREATE POLICY` statements, making the file safe for sequential application on a clean database.

- `supabase/migrations/20260383_lessons_rls.sql` — lines 13–19 now contain five `DROP POLICY IF EXISTS` statements covering: the two coarser inline policies from `20260380` ("Anyone can read published course lessons", "Course owners can manage own course lessons"), the duplicate admin/mod policy name from `20260380` ("Admins and moderators can manage lessons"), and its own two new policies for idempotency. The file is fully safe for re-run and fresh-db-push.

### Regressions

None. All seven previously-verified truths remain intact (migration files unchanged, types file unchanged, tsc --noEmit still passes).

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                    | Status      | Evidence                                                                                          |
|----|------------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------|
| 1  | course_categories table exists with 5 seeded rows                                        | VERIFIED    | 20260379 lines 7–26: CREATE TABLE + 5 INSERTs with ON CONFLICT DO NOTHING                        |
| 2  | lessons table exists with course_id FK CASCADE, type enum, numeric sort_order, all media fields | VERIFIED | 20260380 lines 8–23: all columns present including `sort_order numeric NOT NULL DEFAULT 0`, CHECK constraints, CASCADE FK |
| 3  | courses.category_id FK points to course_categories and is backfilled from old category text | VERIFIED | 20260381 lines 12–22: ADD COLUMN + UPDATE SET category_id = cc.id JOIN on category name          |
| 4  | courses.category text column, vimeo_url column, and duration text column are dropped     | VERIFIED    | 20260381 lines 45–48: DROP COLUMN IF EXISTS for all three; types/supabase.ts courses Row lacks these fields |
| 5  | courses.duration_minutes integer column exists with parsed values                        | VERIFIED    | 20260381 lines 25–41: regexp_match parsing; types/supabase.ts has `duration_minutes: number | null` |
| 6  | RLS on course_categories allows admin/mod full CRUD and public SELECT                    | VERIFIED    | 20260382 lines 9–26: ENABLE RLS + DROP IF EXISTS guards + 2 correct policies                     |
| 7  | RLS on lessons allows admin/mod ALL, members SELECT published, creator SELECT own        | VERIFIED    | 20260383 lines 10–55: ENABLE RLS + 5 DROP IF EXISTS guards + 3 correct policies with authenticated clauses |
| 8  | Migration files are idempotent and can be applied sequentially to a clean DB             | VERIFIED    | 20260382 lines 11–12: DROP POLICY IF EXISTS for both course_categories policies; 20260383 lines 13–19: DROP POLICY IF EXISTS for all 5 lessons policies (coarser inline + own) |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact                                                           | Expected                                             | Status    | Details                                                              |
|--------------------------------------------------------------------|------------------------------------------------------|-----------|----------------------------------------------------------------------|
| `supabase/migrations/20260379_course_categories.sql`              | course_categories table creation and seed data       | VERIFIED  | 49 lines; CREATE TABLE, 5 INSERTs, inline RLS, trigger              |
| `supabase/migrations/20260380_lessons_table.sql`                  | lessons table creation with all columns              | VERIFIED  | 73 lines; CREATE TABLE, indexes, inline RLS (coarser — superseded by 20260383), trigger |
| `supabase/migrations/20260381_courses_category_fk_migration.sql` | courses schema migration — add category_id, backfill, drop old columns | VERIFIED | 52 lines; all 5 steps present |
| `supabase/migrations/20260382_course_categories_rls.sql`         | RLS policies for course_categories (idempotent)      | VERIFIED  | 27 lines; DROP IF EXISTS guards + ENABLE RLS + 2 correct policies   |
| `supabase/migrations/20260383_lessons_rls.sql`                   | RLS policies for lessons (idempotent, precise)       | VERIFIED  | 56 lines; 5 DROP IF EXISTS guards + ENABLE RLS + 3 correct policies |
| `types/supabase.ts`                                               | Regenerated TypeScript types with course_categories and lessons | VERIFIED | course_categories at line 483 (6 occurrences), lessons present, category_id at line 593, vimeo_url absent from courses Row |

---

### Key Link Verification

| From                          | To                                    | Via                           | Status    | Details                                                                                     |
|-------------------------------|---------------------------------------|-------------------------------|-----------|---------------------------------------------------------------------------------------------|
| courses.category_id           | course_categories.id                  | FOREIGN KEY REFERENCES        | VERIFIED  | 20260381 line 13: `ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.course_categories(id)` |
| lessons.course_id             | courses.id                            | FOREIGN KEY CASCADE           | VERIFIED  | 20260380 line 10: `course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE` |
| lessons RLS SELECT policy     | courses.status and courses.deleted_at | subquery on courses table     | VERIFIED  | 20260383 lines 34–43: `courses.status = 'published' AND courses.deleted_at IS NULL`         |
| types/supabase.ts             | all table definitions                 | supabase gen types            | VERIFIED  | course_categories (6 occurrences), courses_category_id_fkey FK relation present             |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase produces only SQL migration files and TypeScript type definitions. No UI components or data-rendering artifacts.

---

### Behavioral Spot-Checks

| Behavior                                | Command                                                                                              | Result                                                         | Status |
|-----------------------------------------|------------------------------------------------------------------------------------------------------|----------------------------------------------------------------|--------|
| tsc --noEmit passes                     | `npx tsc --noEmit 2>&1 \| grep "error TS" \| grep -v "linkify-it\|mdurl"`                          | No output (0 errors beyond pre-existing noise)                 | PASS   |
| Migration files exist on disk           | `ls supabase/migrations/2026037[89]* supabase/migrations/2026038[0-3]*`                             | All 5 files present                                            | PASS   |
| supabase.ts contains new types          | `grep -c "course_categories" types/supabase.ts`                                                     | 6 matches                                                      | PASS   |
| supabase.ts courses Row has category_id | `grep "category_id" types/supabase.ts` (courses FK relation)                                        | Line 593: `foreignKeyName: "courses_category_id_fkey"`         | PASS   |
| supabase.ts courses Row has no vimeo_url | `grep "vimeo_url" types/supabase.ts` filtered to courses type                                      | Absent from courses Row type                                   | PASS   |
| 20260382 has DROP guards                | Read file lines 11–12                                                                               | Both `DROP POLICY IF EXISTS` present before CREATE             | PASS   |
| 20260383 has DROP guards                | Read file lines 13–19                                                                               | Five `DROP POLICY IF EXISTS` statements present before CREATE  | PASS   |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                     | Status    | Evidence                                                                   |
|-------------|-------------|-------------------------------------------------------------------------------------------------|-----------|----------------------------------------------------------------------------|
| DB-01       | 36-01       | course_categories table created with id, name, slug (unique), description, color, parent_id, sort_order, created_at | SATISFIED | 20260379 lines 7–17: all columns present |
| DB-02       | 36-01       | course_categories seeded with 5 categories: Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research | SATISFIED | 20260379 lines 20–26: all 5 INSERTs confirmed |
| DB-03       | 36-01       | lessons table created with all specified columns including numeric sort_order                    | SATISFIED | 20260380 lines 8–23: all columns with correct types and constraints        |
| DB-04       | 36-01       | courses.category_id FK added, backfilled, old category + vimeo_url columns dropped             | SATISFIED | 20260381 has all steps; types confirm absent columns                       |
| DB-05       | 36-02       | RLS policies on course_categories — admin/mod full CRUD, public SELECT                         | SATISFIED | 20260382 has ENABLE RLS + DROP guards + 2 correct policies                 |
| DB-06       | 36-02       | RLS policies on lessons — admin/mod ALL, members SELECT published, creator SELECT own          | SATISFIED | 20260383 has ENABLE RLS + DROP guards + 3 correct policies with proper TO authenticated clauses |
| DB-07       | 36-02       | Supabase types regenerated and npx tsc --noEmit passes                                         | SATISFIED | types/supabase.ts has all new tables/columns; tsc --noEmit clean           |

All 7 requirements satisfied. No orphaned requirements found (REQUIREMENTS.md DB-01 through DB-07 all map to phase 36 plans 01 and 02).

---

### Anti-Patterns Found

| File                                              | Lines         | Pattern                                                          | Severity | Impact                                                                                              |
|---------------------------------------------------|---------------|------------------------------------------------------------------|----------|-----------------------------------------------------------------------------------------------------|
| `supabase/migrations/20260380_lessons_table.sql`  | 32–67         | Inline RLS superseded by 20260383; coarser policies still in file | WARNING  | On fresh db push the old coarser policies are created by 20260380 then immediately dropped by 20260383 — functional but noisy. Not a blocker post-fix. |
| `app/settings/my-courses/actions.ts`              | 37, 57, 106   | References dropped column `vimeo_url`                            | WARNING  | Runtime error if user submits course edit form — known deferred item (Phase 38)                     |
| `app/settings/my-courses/MyCoursesClient.tsx`     | 243, 248, 381, 409, 424 | References dropped columns `category`, `duration`, `vimeo_url` | WARNING | Renders undefined in UI; form writes to non-existent DB column — known deferred item (Phase 38) |
| `app/admin/courses/components/CourseForm.tsx`     | 35, 59        | References dropped column `vimeo_url`                            | WARNING  | Admin form writes to non-existent DB column — known deferred item (Phase 38)                        |
| `app/academy/[id]/page.tsx`                       | 93–208        | References dropped columns `category`, `duration`                | WARNING  | Renders undefined in UI — known deferred item (Phase 38)                                            |
| `app/academy/page.tsx`                            | 223–272       | References dropped columns `category`, `duration`                | WARNING  | Renders undefined in UI — known deferred item (Phase 38)                                            |
| `app/admin/courses/page.tsx`                      | 177–198       | References dropped columns `category`, `duration`                | WARNING  | Renders undefined in UI — known deferred item (Phase 38)                                            |
| `app/admin/inbox/CoursesTab.tsx`                  | 186, 191      | References dropped columns `category`, `duration`                | WARNING  | Renders undefined in UI — known deferred item (Phase 38)                                            |

No blockers remain. All warnings are known deferred items tracked for Phase 38.

---

### Human Verification Required

#### 1. Active Lessons RLS Policies on Remote DB

**Test:** Query `SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'lessons'` in Supabase SQL editor.
**Expected:** Exactly 3 active policies: "Admins and moderators can manage lessons" (ALL), "Members can read published course lessons" (SELECT, {authenticated}), "Course creators can read own course lessons" (SELECT, {authenticated}). The Plan 01 inline policies ("Anyone can read published course lessons", "Course owners can manage own course lessons") should NOT be active.
**Why human:** Cannot query remote pg_policies from CLI. The DROP POLICY IF EXISTS statements in 20260383 guarantee correctness on any future fresh-db-push, but cannot confirm what the current remote DB state reflects from the original (pre-fix) migration run.

#### 2. Dropped-Column References in Live App

**Test:** Visit `/academy`, `/academy/[any-course-id]`, `/admin/courses`, and the member course edit form (`/settings/my-courses`) while logged in as both admin and member.
**Expected:** Pages load without JS/React errors; category/duration/vimeo fields show empty/undefined gracefully (not crash).
**Why human:** Runtime behavior of queries referencing non-existent columns cannot be verified by static analysis or tsc. These are known Phase 38 deferred items.

---

### Gaps Summary

No automated gaps remain. The single blocker from the previous verification — duplicate `CREATE POLICY` names causing `db push` failures on clean environments — is resolved. Both `20260382` and `20260383` now contain `DROP POLICY IF EXISTS` guards before every `CREATE POLICY` statement, making the full 5-migration sequence safe for sequential application on any fresh database.

All 7 requirements (DB-01 through DB-07) are satisfied. Two items remain for human verification: the current remote DB's active lessons policies (cannot query pg_policies from CLI) and runtime behavior of pages that still reference the dropped columns (deferred to Phase 38).

---

_Verified: 2026-04-01_
_Verifier: Claude (gsd-verifier)_
