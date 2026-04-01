---
phase: 40-wire-lessons-to-frontend
plan: "03"
subsystem: settings/my-courses
tags: [lessons, member-courses, stale-columns, category_id, duration_minutes, LessonList]
dependency_graph:
  requires:
    - 39-lesson-management-ui-logic (LessonList, LessonForm, lesson-actions)
    - 36-database-migrations (lessons table, course_categories table, schema changes)
  provides:
    - Member course lesson management at /settings/my-courses
    - Fixed stale column refs in member course create/edit flow
  affects:
    - app/settings/my-courses/actions.ts
    - app/settings/my-courses/MyCoursesClient.tsx
    - app/settings/my-courses/page.tsx
tech_stack:
  added: []
  patterns:
    - next/dynamic with ssr:false for LessonList (dnd-kit browser API isolation)
    - DB-driven category dropdown via course_categories join in page.tsx
    - duration_minutes range slider replacing freeform text input
    - MemberLessons component fetching lessons client-side via fetchLessons server action
key_files:
  created: []
  modified:
    - app/settings/my-courses/actions.ts
    - app/settings/my-courses/MyCoursesClient.tsx
    - app/settings/my-courses/page.tsx
decisions:
  - MemberLessons uses useEffect + fetchLessons (not server-fetched initialLessons) — avoids re-architecting the edit view as a server component
  - next/dynamic ssr:false for LessonList — same pattern as admin LessonSection (dnd-kit fails on SSR)
  - Category lookup uses categories prop array search (option b) — avoids changing the courses select query
metrics:
  duration: ~10m
  completed_date: "2026-04-01"
  tasks: 2
  files: 3
---

# Phase 40 Plan 03: Member My Courses Lesson Management Summary

Member course management page now includes embedded lesson editing (add/edit/reorder/delete) reusing the admin LessonList component, with all stale column references replaced (category text -> category_id UUID, duration text -> duration_minutes integer, vimeo_url removed).

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix stale column references in my-courses actions | 45adf1e | app/settings/my-courses/actions.ts |
| 2 | Add lesson management to MyCoursesClient and fix form stale refs | fca1002 | app/settings/my-courses/MyCoursesClient.tsx, app/settings/my-courses/page.tsx |

## What Was Built

### Task 1: Fix stale column references in actions.ts

**app/settings/my-courses/actions.ts:**
- `MemberCourseFormData` interface: replaced `category: string` with `category_id: string | null`, `duration?: string` with `duration_minutes?: number | null`, removed `vimeo_url`
- `createMemberCourse`: now inserts `category_id`, `duration_minutes`, no longer inserts `category`, `duration`, `vimeo_url`
- `updateMemberCourse`: same payload changes — `category_id`, `duration_minutes`, no `vimeo_url`

### Task 2: Lesson management + form stale ref fixes

**app/settings/my-courses/page.tsx:**
- Added `course_categories` fetch (id, name, ordered by sort_order) in parallel with courses query via `Promise.all`
- Passes `categories` prop to `MyCoursesClient`

**app/settings/my-courses/MyCoursesClient.tsx:**
- Removed hardcoded `CATEGORIES` array (`CourseCategory` union type values)
- Added `categories: { id: string; name: string }[]` to `Props` interface
- `MemberCourseForm`: category dropdown now iterates over `categories` prop using `c.id` as value, `c.name` as display text
- `MemberCourseForm`: duration text input replaced with range slider (min=0, max=600, step=5) writing `durationMinutes` state
- `MemberCourseForm`: removed Vimeo URL field entirely
- `FormValues` interface: `category_id: string | null`, `duration_minutes: number`, no `vimeo_url`, `category`, `duration`
- Course list: category display now uses `categories.find(c => c.id === course.category_id)?.name ?? 'Uncategorized'`
- Course list: duration display uses `formatDuration(course.duration_minutes) ?? 'No duration set'`
- Added `formatDuration` helper (converts minutes to human-readable `Xh Ym` format)
- Added `LessonList` dynamic import (next/dynamic, ssr:false) from admin components
- Added `MemberLessons` component: fetches lessons via `fetchLessons` server action, renders admin `LessonList`
- Edit view now renders `MemberLessons` below the course form — full lesson add/edit/reorder/delete for members

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — lesson management is fully wired to the real lessons table via the same `lesson-actions` server actions used by admins. Category dropdown uses real `course_categories` rows. Duration slider writes to `duration_minutes` integer column.

## Self-Check: PASSED

- app/settings/my-courses/actions.ts: FOUND
- app/settings/my-courses/MyCoursesClient.tsx: FOUND
- app/settings/my-courses/page.tsx: FOUND
- Commit 45adf1e: FOUND
- Commit fca1002: FOUND
- TypeScript: only pre-existing linkify-it/mdurl errors (unrelated)
