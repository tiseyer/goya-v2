---
phase: 39-lesson-management-ui-logic
plan: "01"
subsystem: admin/courses/lessons
tags: [lessons, dnd-kit, server-actions, typescript, drag-and-drop]
dependency_graph:
  requires: [38-02]
  provides: [lesson-types, lesson-server-actions, lesson-list-component]
  affects: [admin/courses/edit-page]
tech_stack:
  added: []
  patterns: [float-midpoint-sort-order, dnd-kit-ssr-false, server-action-crud]
key_files:
  created:
    - lib/courses/lessons.ts
    - app/admin/courses/lesson-actions.ts
    - app/admin/courses/components/LessonList.tsx
    - app/admin/courses/[id]/edit/LessonSection.tsx
  modified:
    - app/admin/courses/[id]/edit/page.tsx
    - docs/admin/courses.md
    - public/docs/search-index.json
decisions:
  - "LessonSection client wrapper handles next/dynamic ssr:false for dnd-kit — keeps edit page a server component"
  - "handleDelete reverts optimistic update if server action returns error"
  - "fetchLessons runs in parallel with fetchCategories via Promise.all for performance"
metrics:
  duration: "3m 25s"
  completed: "2026-04-01"
  tasks_completed: 2
  files_changed: 7
---

# Phase 39 Plan 01: Lesson Data Layer + LessonList Component Summary

**One-liner:** Lesson type aliases, five server actions (CRUD + float midpoint reorder), and a dnd-kit sortable list wired into the course edit page with TouchSensor and SSR-safe dynamic import.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create Lesson types and server actions | 29e3043 | lib/courses/lessons.ts, app/admin/courses/lesson-actions.ts |
| 2 | Create LessonList component and wire into edit page | 88d192a | LessonList.tsx, LessonSection.tsx, edit/page.tsx |

## What Was Built

### lib/courses/lessons.ts
Exports `Lesson`, `LessonInsert`, `LessonUpdate`, `LessonType`, and `LessonFormData` types. Follows the same type alias pattern as `lib/courses/categories.ts` using the generated Supabase types.

### app/admin/courses/lesson-actions.ts
Five `'use server'` actions:
- `fetchLessons(courseId)` — SELECT ordered by sort_order ASC
- `createLesson(courseId, formData)` — computes sort_order as MAX + 1024, inserts, logs audit
- `updateLesson(lessonId, courseId, formData)` — UPDATE with updated_at, logs audit
- `deleteLesson(lessonId, courseId, lessonTitle)` — DELETE, logs audit
- `reorderLesson(lessonId, newSortOrder)` — single-row UPDATE for float midpoint drag reorder

All actions use `createSupabaseServerActionClient` (RLS-based) and audit via `logAdminCourseAction`.

### app/admin/courses/components/LessonList.tsx
Client component (`'use client'`) with:
- `DndContext`, `SortableContext`, `SortableLessonRow` using dnd-kit
- Sensors: `PointerSensor` (distance: 8), `TouchSensor` (delay: 200, tolerance: 5), `KeyboardSensor`
- `SortableLessonRow`: drag handle (6-dot SVG), sequential number, title, type badge (Video=blue, Audio=amber, Text=emerald), duration, edit/delete buttons
- `handleDragEnd`: float midpoint sort_order computation + `reorderLesson` call
- Optimistic delete with rollback on error
- Empty state: "No lessons yet. Add your first lesson below." when `lessons.length === 0`

### app/admin/courses/[id]/edit/LessonSection.tsx
Client wrapper that uses `next/dynamic(() => import('../../components/LessonList'), { ssr: false })`. Keeps the edit page as a server component while preventing dnd-kit browser API errors during SSR. Provides placeholder handlers for `onAddLesson` and `onEditLesson` (Plan 02 will add the form modal).

### app/admin/courses/[id]/edit/page.tsx
Updated to fetch lessons in parallel with categories via `Promise.all`, then renders `<LessonSection>` between `<CourseForm>` and the audit history timeline.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `LessonSection.handleAddLesson` — empty no-op. Plan 02 will open the lesson form modal.
- `LessonSection.handleEditLesson` — empty no-op. Plan 02 will open the lesson form modal with pre-filled data.

These stubs are intentional. The `+ Add Lesson` button renders but does nothing until Plan 02 ships the form.

## Self-Check

### Files exist
- lib/courses/lessons.ts: FOUND
- app/admin/courses/lesson-actions.ts: FOUND
- app/admin/courses/components/LessonList.tsx: FOUND
- app/admin/courses/[id]/edit/LessonSection.tsx: FOUND

### Commits exist
- 29e3043: FOUND
- 88d192a: FOUND
- 53b8599: FOUND (docs)

## Self-Check: PASSED
