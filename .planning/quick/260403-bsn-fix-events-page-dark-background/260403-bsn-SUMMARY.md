---
phase: quick
plan: 260403-bsn
subsystem: events-ui
tags: [dark-mode, css, events]
dependency_graph:
  requires: []
  provides: [events-page-dark-mode]
  affects: [app/events/page.tsx, app/globals.css]
tech_stack:
  added: []
  patterns: [tailwind-dark-variant, css-hex-override]
key_files:
  created: []
  modified:
    - app/globals.css
    - app/events/page.tsx
decisions:
  - "Used .dark CSS override in globals.css for hex bg instead of adding dark: variant inline, matching existing pattern"
metrics:
  duration: "5m"
  completed: "2026-04-03"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 2
---

# Quick Task 260403-bsn: Fix Events Page Dark Background Summary

**One-liner:** Added `.dark .bg-[#F8FAFC]` CSS override mapping to `var(--background)` and updated mobile filter bar with `dark:bg-[#0F1117]/95` and `dark:border-slate-700` variants.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add dark mode override for events page background | cb6135d |

## Changes Made

### app/globals.css
Added one line after the existing hex background overrides (lines 208-210):
```css
.dark .bg-\[\#F8FAFC\] { background-color: var(--background) !important; }
```
This follows the exact pattern of the existing `.dark .bg-\[\#F9FAFB\]` and `.dark .bg-\[\#F3F4F6\]` overrides.

### app/events/page.tsx (line 328)
Updated mobile sticky filter bar from:
```
bg-white/95 backdrop-blur-sm border-b border-slate-200
```
to:
```
bg-white/95 dark:bg-[#0F1117]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700
```

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes (source files only; pre-existing `.next/` generated type error is unrelated)
- `grep -n 'F8FAFC' app/globals.css` confirms new dark override present
- No other pages affected

## Self-Check: PASSED

- app/globals.css: modified (cb6135d)
- app/events/page.tsx: modified (cb6135d)
- Commit cb6135d exists in git log
