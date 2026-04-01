---
phase: 37-admin-courses-tabs-categories
plan: "02"
subsystem: admin-courses
tags: [categories, ui, tab-bar, modal, client-component, tailwind]
dependency_graph:
  requires: [37-01]
  provides: [admin-category-ui, tab-bar, category-modal]
  affects: [app/admin/courses/page.tsx, app/admin/courses/AdminCoursesFilters.tsx]
tech_stack:
  added: []
  patterns: [url-search-param-tabs, client-crud-table, modal-with-auto-slug]
key_files:
  created:
    - app/admin/courses/AdminCategoriesTab.tsx
    - app/admin/courses/CategoryModal.tsx
  modified:
    - app/admin/courses/page.tsx
    - app/admin/courses/AdminCoursesFilters.tsx
    - docs/admin/courses.md
    - public/docs/search-index.json
decisions:
  - "CategoryModal fully implemented in Task 1 (not a stub) — both tasks share the same commit since AdminCategoriesTab depends on CategoryModal to compile"
  - "AdminCoursesFilters category filter now uses c.id (UUID) as option value, matching the category_id column updated in page.tsx"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 2
  files_modified: 4
---

# Phase 37 Plan 02: Admin Category UI Summary

**One-liner:** Courses/Categories tab bar with URL search params, full category CRUD table, add/edit modal with auto-slug and color preview, and delete guard showing course count — plus DB-driven category filter replacing hardcoded array.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Tab bar on courses page + Categories tab component | fb9d75f | page.tsx, AdminCategoriesTab.tsx, CategoryModal.tsx |
| 2 | Update filters to use DB categories | f84b5a1 | AdminCoursesFilters.tsx |

## What Was Built

### `app/admin/courses/page.tsx`

- Added `tab` search param reading (`sp.tab ?? 'courses'`)
- Tab bar with `Link` components using URL search params — "Courses" links to `/admin/courses`, "Categories" to `/admin/courses?tab=categories`
- Active tab styled with `border-b-2 border-[#4E87A0] text-[#1B3A5C] font-semibold`
- "Add New Course" button hidden when on categories tab
- Courses table, filters, and pagination conditionally rendered only when `tab !== 'categories'`
- `<AdminCategoriesTab />` rendered when `tab === 'categories'`
- **Bug fix (Rule 1):** `.eq('category', category)` updated to `.eq('category_id', category)` — the old text column was dropped in Phase 36 migration

### `app/admin/courses/AdminCategoriesTab.tsx`

- `'use client'` component — fetches categories on mount via `fetchCategories()`
- Table with columns: Color swatch (24×24 circle), Name, Slug (mono), Parent (resolved name), Description (truncated 60 chars), Actions
- Edit button opens `CategoryModal` pre-filled; Add Category button opens it in create mode
- Delete flow: calls `deleteCategory()` — if `courseCount > 0`, shows amber inline notice with course count; if success, removes row from local state; if other error, shows red error banner
- Empty state with centered message and "Add Category" button
- Loading state while fetching

### `app/admin/courses/CategoryModal.tsx`

- `'use client'` modal component following FaqModal.tsx pattern
- Backdrop click and Escape key both close the modal
- Form fields: Name (required, onBlur auto-generates slug), Slug (editable, monospace), Description (textarea), Parent Category (select, excludes self in edit mode), Color (hex input + live swatch preview)
- `slugManuallyEdited` state prevents auto-overwrite when user has typed a custom slug
- Default color `#345c83`; pre-populates all fields from `category` prop in edit mode; resets to defaults in create mode
- On save: validates name and slug non-empty, calls `createCategory` or `updateCategory`, calls `onSaved(result.category)` on success, shows inline error on failure

### `app/admin/courses/AdminCoursesFilters.tsx`

- Replaced hardcoded `const CATEGORIES = [...]` array with `fetchCategories()` server action
- Added `useEffect` to fetch on mount, stored in `dbCategories: CourseCategory[]` state
- Category select options now use `c.id` (UUID) as value, matching the `category_id` column in the Supabase filter

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed category filter column reference**
- **Found during:** Task 1 (as specified in plan notes)
- **Issue:** `query.eq('category', category)` references the old text column dropped in Phase 36 migration
- **Fix:** Changed to `query.eq('category_id', category)` matching the new FK column
- **Files modified:** app/admin/courses/page.tsx
- **Commit:** fb9d75f

### Implementation Note

The plan split CategoryModal into Task 2, but AdminCategoriesTab imports it, so both files were created in Task 1's commit to ensure TypeScript compilation passes after Task 1. This is a sequencing deviation, not a scope deviation — all planned functionality was implemented as specified.

## Known Stubs

None — all category CRUD is fully wired to the server actions from Plan 01.

## Self-Check: PASSED
