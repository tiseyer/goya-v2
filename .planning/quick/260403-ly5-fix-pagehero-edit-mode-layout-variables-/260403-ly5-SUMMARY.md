---
phase: quick
plan: 260403-ly5
subsystem: ui/components
tags: [pagehero, edit-mode, layout, admin, fixed-positioning]
dependency_graph:
  requires: []
  provides: [pagehero-edit-mode-fixed-panels]
  affects: [app/components/PageHero.tsx]
tech_stack:
  added: []
  patterns: [fixed-position-overlay-panels]
key_files:
  created: []
  modified:
    - app/components/PageHero.tsx
decisions:
  - Variables panel uses fixed left-edge positioning to avoid hero content overlap
  - Save/Cancel buttons use fixed top-right positioning (above hero, accessible regardless of scroll)
  - X icon in adminControl replaces null case when editing — same style as pencil button
metrics:
  duration: "3m"
  completed: "2026-04-03"
  tasks: 1
  files_modified: 1
---

# Quick Task 260403-ly5: Fix PageHero Edit Mode Layout — Variables and Buttons to Fixed Panels

**One-liner:** Moved variable pills to fixed left-edge panel and Save/Cancel to fixed top-right, eliminating hero content overlap in edit mode.

## What Was Done

Refactored `app/components/PageHero.tsx` edit mode UI:

1. **Removed `editToolbar` const** — the absolute-positioned bottom toolbar that caused variable pills and Save/Cancel buttons to overlap hero content.

2. **Added fixed variables panel** — renders when `editing === true` in both dark and light variants; positioned `fixed left-0 top-1/2 -translate-y-1/2 z-50` as a vertical panel on the left edge of the screen.

3. **Added fixed Save/Cancel panel** — renders when `editing === true` in both variants; positioned `fixed top-4 right-4 z-50`.

4. **Changed pencil to X icon when editing** — the `adminControl` const previously returned `null` when `editing === true`. Now it renders an X button (same variant-aware styling as the pencil button) that calls `handleCancel`.

## Commits

| Hash | Message |
|------|---------|
| 5434734 | fix(quick-260403-ly5): move PageHero edit mode UI to fixed panels |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- [x] `app/components/PageHero.tsx` modified
- [x] Commit 5434734 exists
- [x] `npx tsc --noEmit` passes (pre-existing unrelated error in `.next/dev/types/validator.ts` only)
- [x] No `editToolbar` references remain in file
- [x] Both dark and light variants have fixed panels
- [x] `adminControl` shows X when editing
