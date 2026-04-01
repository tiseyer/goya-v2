---
phase: quick
plan: 260327-l8q
subsystem: UI / ThemeToggle
tags: [theme, navbar, segmented-control, ui]
dependency_graph:
  requires: []
  provides: [ThemeInline segmented control]
  affects: [navbar profile dropdown]
tech_stack:
  added: []
  patterns: [segmented control with flex-1 equal-width buttons]
key_files:
  modified:
    - app/components/ThemeToggle.tsx
decisions:
  - Used bg-surface + shadow-sm for active state to achieve raised segment effect
  - Removed hover:bg-surface-muted from inactive state since container already provides background
metrics:
  duration: "~5 minutes"
  completed: "2026-03-27"
  tasks_completed: 1
  tasks_total: 1
---

# Quick Task 260327-l8q: Fix Theme Toggle Buttons in Navbar Dropdown — Summary

## One-liner

Restyled ThemeInline from small icon-only buttons to a full-width segmented control with icon + label using flex-1 equal-width segments and a raised active state.

## What Was Done

The `ThemeInline` component in `app/components/ThemeToggle.tsx` was updated to display as a proper segmented control inside the navbar profile dropdown.

**Changes made to ThemeInline (lines 109-134):**

- Container: `flex items-center justify-center gap-1` → `flex w-full bg-surface-muted rounded-lg p-1`
- Button: `p-2 rounded-lg` → `flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium`
- Active state: `bg-primary/15 text-primary` → `bg-surface text-primary shadow-sm`
- Inactive state: removed `hover:bg-surface-muted` (container provides background)
- Added `<span>{t.label}</span>` after icon so each segment shows icon + text

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- File modified: `app/components/ThemeToggle.tsx` — FOUND
- Commit `98430af` — FOUND
