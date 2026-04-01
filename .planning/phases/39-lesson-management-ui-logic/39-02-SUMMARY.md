---
phase: 39-lesson-management-ui-logic
plan: "02"
subsystem: admin/courses/lessons
tags: [lessons, lesson-form, type-selector, dnd-kit, server-actions, typescript, inline-form]
dependency_graph:
  requires: [39-01]
  provides: [lesson-form-component, lesson-inline-editing]
  affects: [admin/courses/edit-page, LessonList]
tech_stack:
  added: []
  patterns: [inline-form-state, type-conditional-fields, client-side-optimistic-update]
key_files:
  created:
    - app/admin/courses/components/LessonForm.tsx
  modified:
    - app/admin/courses/components/LessonList.tsx
    - app/admin/courses/[id]/edit/LessonSection.tsx
    - docs/admin/courses.md
    - public/docs/search-index.json
decisions:
  - "LessonForm manages all type-specific state locally — no external state lifted to LessonList"
  - "LessonList owns formMode ('closed'/'add'/'edit') and editingLesson state — keeps edit page a server component"
  - "handleSave uses functional setState to avoid stale closure issues when appending/replacing lessons"
  - "featuredImageUrl is nullified for video type (not relevant) but preserved for audio and text"
metrics:
  duration: "8m"
  completed: "2026-04-01"
  tasks_completed: 2
  files_changed: 5
---

# Phase 39 Plan 02: LessonForm Component + Inline Integration Summary

**One-liner:** Inline lesson add/edit form with 3-card type selector (Video/Audio/Text), type-specific fields (platform toggle, audio URL, featured image), duration slider, and immediate list update via server actions.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Create LessonForm with type selector and type-specific fields | 7b373fb | app/admin/courses/components/LessonForm.tsx |
| 2 | Wire LessonForm inline into LessonList, simplify LessonSection | 08c392e | LessonList.tsx, LessonSection.tsx |

## What Was Built

### app/admin/courses/components/LessonForm.tsx
`'use client'` component with props `courseId`, `lesson` (optional, determines add vs edit mode), `onSave`, and `onCancel`.

- **Type selector:** 3 visual cards with emoji icons — Video (U+1F3AC), Audio (U+1F3B5), Text (U+1F4DD). Selected card gets `border-[#4E87A0] bg-[#4E87A0]/5` highlight.
- **Video fields:** Vimeo/YouTube pill toggle (selected pill `bg-[#4E87A0] text-white`), Video URL input with dynamic placeholder.
- **Audio fields:** Audio URL input, Featured Image URL input.
- **Text fields:** Featured Image URL input, 8-row description textarea (vs 6 rows for other types).
- **Common fields:** Title (required), Short Description (200 char max with counter), Full Description, Duration slider (1–180 min, step 1, formatted as "Xh Ym").
- **handleSubmit:** Validates title, builds `LessonFormData` with type-irrelevant fields nullified, calls `createLesson` or `updateLesson`, then calls `onSave(result.data)` on success.

### app/admin/courses/components/LessonList.tsx
Updated to manage form state internally:

- **Removed props:** `onAddLesson`, `onEditLesson` — callers no longer need to wire callbacks.
- **Added state:** `formMode` (`'closed' | 'add' | 'edit'`), `editingLesson` (`Lesson | undefined`).
- **"+ Add Lesson" button:** Sets `formMode('add')`, clears `editingLesson`.
- **Edit button on row:** Calls `handleEditClick(lesson)` which sets `formMode('edit')` + `editingLesson`.
- **`handleSave`:** Appends lesson to list (add mode) or replaces by id (edit mode), then closes form.
- **`handleCancel`:** Resets `formMode` to `'closed'` and clears `editingLesson`.
- **LessonForm rendered** below the list when `formMode !== 'closed'`, with a border-t divider.

### app/admin/courses/[id]/edit/LessonSection.tsx
Simplified — still uses `next/dynamic({ ssr: false })` to avoid dnd-kit SSR errors, but now passes only `courseId` and `initialLessons` to `LessonList` (no callback props).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all lesson management functionality is fully wired: add, edit, delete, and reorder all work end-to-end.

## Self-Check

### Files exist
- app/admin/courses/components/LessonForm.tsx: FOUND
- app/admin/courses/components/LessonList.tsx: FOUND (modified)
- app/admin/courses/[id]/edit/LessonSection.tsx: FOUND (modified)

### Commits exist
- 7b373fb: Task 1 — LessonForm component
- 08c392e: Task 2 — Wire LessonForm into LessonList

## Self-Check: PASSED
