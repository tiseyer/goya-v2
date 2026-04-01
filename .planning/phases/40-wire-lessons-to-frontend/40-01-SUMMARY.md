---
phase: 40-wire-lessons-to-frontend
plan: "01"
subsystem: academy-frontend
tags: [lessons, course-categories, academy, stale-columns, frontend]
dependency_graph:
  requires: [36-database-migrations, 37-admin-courses-tabs-categories, 38-course-creation-form-ui-redesign, 39-lesson-management-ui-logic]
  provides: [academy-lesson-list, category-color-badges, stale-column-cleanup]
  affects: [app/academy, app/admin/courses]
tech_stack:
  added: []
  patterns: [supabase-join-with-nested-select, formatDuration-helper, type-icon-map]
key_files:
  created:
    - lib/courses/lessons.ts
  modified:
    - app/academy/page.tsx
    - app/academy/[id]/page.tsx
    - app/admin/courses/page.tsx
    - lib/types.ts
decisions:
  - "Lesson type defined inline in lib/courses/lessons.ts (no supabase.ts dependency in worktree)"
  - "CourseWithCategory local type extends Course with _categoryColor for academy listing"
  - "Category filter uses category_id UUID matching instead of text string comparison"
metrics:
  duration: "~15m"
  completed_date: "2026-04-01"
  tasks: 2
  files: 5
---

# Phase 40 Plan 01: Wire Lessons to Frontend Summary

Real lesson data from the lessons table is now shown on the public course detail page, and academy course cards display category color dots from the course_categories DB join — replacing all stale text-column references to `course.category`, `course.duration`, and `course.vimeo_url`.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix stale column references and add category color to academy cards | 912ab85 | app/academy/page.tsx, app/admin/courses/page.tsx, lib/types.ts, lib/courses/lessons.ts |
| 2 | Add lesson list to /academy/[id] course detail page | c479a10 | app/academy/[id]/page.tsx |

## What Was Built

### Task 1: Stale Column Cleanup + Category Colors

**app/academy/page.tsx:**
- Replaced hardcoded `CATEGORIES` array with DB-fetched `course_categories` table
- Query now joins `course_categories(id, name, slug, color)` for each course
- Category filter bar uses `category_id` UUID matching instead of text string
- Course cards show colored dot (`_categoryColor` from DB) next to category name
- `course.duration` replaced with `formatDuration(duration_minutes)` helper

**app/admin/courses/page.tsx:**
- Query joins `course_categories(name, color)` and `profiles!created_by`
- Category filter uses `category_id` instead of legacy `category` text column
- Category badge uses dynamic DB color instead of hardcoded `CATEGORY_BADGE` map
- Duration column uses `formatDuration(duration_minutes)` helper

**lib/types.ts:**
- `Course` interface updated: added `category_id`, `duration_minutes`, `video_url`, `video_platform`; `category` made nullable

**lib/courses/lessons.ts (created):**
- Defines `Lesson` interface with all lessons table fields
- Defines `LessonType`, `LessonFormData` types

### Task 2: Lessons on Course Detail Page

**app/academy/[id]/page.tsx:**
- Course query now joins `course_categories(name, color)` for dynamic badge
- Fetches lessons from lessons table: `select id, title, type, duration_minutes, sort_order` ordered by `sort_order`
- Renders full lesson list with `TYPE_ICONS` map (video=🎬, audio=🎵, text=📝)
- Enrolled users get clickable `Link` to `/academy/${id}/lesson/${lesson.id}`
- Non-enrolled users see locked list with padlock icon
- Removed `CATEGORY_COLORS` hardcoded map, `lessonTitle` variable, single-lesson placeholder
- Hero meta row shows real lesson count from DB
- `course.duration` text references replaced with `formatDuration(course.duration_minutes)`

## Deviations from Plan

### Skipped Items

**1. [Rule N/A - Not applicable] app/admin/inbox/CoursesTab.tsx and inbox/page.tsx**
- **Found during:** Task 1 review
- **Issue:** `CoursesTab.tsx` does not exist in this worktree. The current `inbox/page.tsx` has no courses tab — it only has the `SchoolRegistrationsTab`. The plan's references to inbox courses appear to be from a different branch state.
- **Action:** Skipped — no stale references exist in the actual files since CoursesTab was never created in this worktree.

### Auto-created Supporting Files

**lib/courses/lessons.ts** — The plan required importing `Lesson` from `@/lib/courses/lessons`, but this file only existed in the main repo (not yet merged to the worktree branch). Created with inline type definitions matching the lessons DB schema to avoid dependency on `types/supabase.ts` (also absent from worktree).

## Known Stubs

None — lesson data is wired from the real `lessons` table. Category colors come from the real `course_categories` table. The lesson link `/academy/${id}/lesson/${lesson.id}` routes to a page that may not yet exist (Phase 40 subsequent plans), but the list itself is data-driven.

## Self-Check: PASSED

- lib/courses/lessons.ts: FOUND
- app/academy/page.tsx: FOUND
- app/academy/[id]/page.tsx: FOUND
- app/admin/courses/page.tsx: FOUND
- lib/types.ts: FOUND
- Commit 912ab85: FOUND
- Commit c479a10: FOUND
- TypeScript: only pre-existing linkify-it/mdurl errors (unrelated to this plan)
