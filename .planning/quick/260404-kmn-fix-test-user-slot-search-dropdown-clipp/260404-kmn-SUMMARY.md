---
phase: quick
plan: 260404-kmn
subsystem: admin-settings
tags: [bug-fix, dropdown, overflow, z-index]
dependency_graph:
  requires: []
  provides: [visible-test-slot-search-dropdown]
  affects: [app/admin/settings/components/TestUsersTab.tsx]
tech_stack:
  added: []
  patterns: [z-50 dropdown stacking matching InstructorPicker]
key_files:
  modified:
    - app/admin/settings/components/TestUsersTab.tsx
decisions:
  - Removed overflow-hidden from both card containers — rounded-xl on child elements handles border radius visually
  - z-50 chosen to match established InstructorPicker dropdown pattern
metrics:
  duration: "2m"
  completed: "2026-04-04"
  tasks: 1
  files: 1
---

# Quick Task 260404-kmn: Fix Test User Slot Search Dropdown Clipping

**One-liner:** Removed `overflow-hidden` from two parent containers and raised dropdown z-index from z-20 to z-50 so the search results dropdown renders fully visible.

## What Was Done

The search results dropdown in Admin Settings > Test Users tab was being clipped (invisible) because two parent `<div>` elements had `overflow-hidden` set. The dropdown renders with `position: absolute` inside these containers, so the browser clips it to their bounds.

Three changes in `TestUsersTab.tsx`:

1. **Outer card wrapper (line 377):** `overflow-hidden` removed from `bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden`
2. **Individual slot card (line 123):** `overflow-hidden` removed from the same class string on the `SortableSlot` inner wrapper
3. **Dropdown z-index:** Both dropdown `<div>` elements changed from `z-20` to `z-50` to match the working `InstructorPicker` pattern

## Commits

| Hash | Message |
|------|---------|
| 900e820 | fix: test user slot search dropdown clipped by parent container - fix overflow/z-index |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- File `app/admin/settings/components/TestUsersTab.tsx` exists and modified
- Commit `900e820` exists in git log
- `npx tsc --noEmit` passes with 0 errors
