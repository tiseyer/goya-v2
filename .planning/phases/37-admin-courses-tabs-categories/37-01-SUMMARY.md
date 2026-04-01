---
phase: 37-admin-courses-tabs-categories
plan: "01"
subsystem: admin-courses
tags: [categories, server-actions, typescript, supabase]
dependency_graph:
  requires: [36-database-migrations]
  provides: [category-crud-actions, category-types]
  affects: [app/admin/courses]
tech_stack:
  added: []
  patterns: [server-action-crud, delete-guard-with-count]
key_files:
  created:
    - lib/courses/categories.ts
    - app/admin/courses/category-actions.ts
  modified: []
decisions:
  - "Use maybeSingle() for slug uniqueness checks — returns null instead of error on no-match"
  - "Return courseCount in all deleteCategory outcomes for consistent caller interface"
  - "Input validation (name required) added inside actions per Rule 2 — missing validation is a correctness requirement"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 37 Plan 01: Category Server Actions Summary

**One-liner:** Course category CRUD server actions with slug uniqueness checks and course-count delete guard, backed by Supabase `course_categories` table.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Category helper utilities and type export | fc27655 | lib/courses/categories.ts |
| 2 | Server actions for category CRUD with delete guard | 9c2fc26 | app/admin/courses/category-actions.ts |

## What Was Built

### `lib/courses/categories.ts`

- `CourseCategory` type alias derived from Supabase generated types (`Database['public']['Tables']['course_categories']['Row']`)
- `CategoryFormData` interface with name, slug, description, color, parent_id fields
- `generateCategorySlug()` function converting free-text names to URL-safe slugs (lowercase, trim, replace non-alphanumeric with hyphens, strip leading/trailing hyphens)

### `app/admin/courses/category-actions.ts`

- `fetchCategories()` — Returns all categories ordered by sort_order (nulls last) then name alphabetically
- `createCategory(formData)` — Validates name, checks slug uniqueness via `maybeSingle()`, inserts row
- `updateCategory(id, formData)` — Validates name, checks slug uniqueness excluding self, updates row
- `deleteCategory(id)` — Counts courses referencing category via `courses.category_id`, blocks deletion if count > 0, returns `courseCount` in all response shapes

## Deviations from Plan

### Auto-added Functionality

**1. [Rule 2 - Missing Validation] Added name required validation to createCategory and updateCategory**
- **Found during:** Task 2 implementation
- **Issue:** Plan spec showed slug uniqueness check but did not explicitly include name-empty guard
- **Fix:** Added `if (!formData.name.trim()) return { success: false, error: 'Category name is required.' }` at top of both mutation actions
- **Files modified:** app/admin/courses/category-actions.ts
- **Commit:** 9c2fc26

All other plan actions executed exactly as specified.

## Known Stubs

None — this plan creates backend-only server actions with no UI rendering.

## Self-Check: PASSED
