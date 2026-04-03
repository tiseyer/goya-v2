---
phase: quick
plan: 260403-c2q
subsystem: events
tags: [dark-mode, ui, tailwind, sidebar]
dependency_graph:
  requires: []
  provides: [events-sidebar-dark-mode-borders]
  affects: [app/events/page.tsx]
tech_stack:
  added: []
  patterns: [tailwind-dark-variants]
key_files:
  created: []
  modified:
    - app/events/page.tsx
decisions:
  - Use dark:bg-white/5 for subtle dark-mode box backgrounds on the events sidebar
  - Use dark:border-white/10 for dark-mode borders (matches site-wide dark UI convention)
  - Use dark:text-slate-300 dark:hover:bg-white/5 for inactive button states in dark mode
metrics:
  duration: 5m
  completed_date: "2026-04-03"
  tasks_completed: 1
  files_changed: 1
---

# Quick Task 260403-c2q: Fix Events Sidebar Filter Box Border Colors

**One-liner:** Dark-mode border and background fixes for all four sidebar filter boxes on the events page using Tailwind dark: variants.

## What Was Done

The events page sidebar contains four filter containers (Mini Calendar, Event Type, Format, Category). These used `border-slate-200/80` and `bg-white` which created a jarring white box appearance against the dark-themed events page background.

### Changes Applied

**File: `app/events/page.tsx`**

All four sidebar `<div>` containers updated:
- `bg-white` → `bg-white dark:bg-white/5`
- `border-slate-200/80` → `border-slate-200/80 dark:border-white/10`

Inner location filter divider updated:
- `border-slate-100` → `border-slate-100 dark:border-white/10`

Inactive filter buttons in all three filter boxes (Event Type, Format, Category) updated:
- Added `dark:text-slate-300 dark:hover:bg-white/5` alongside existing light-mode classes

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: `npx tsc --noEmit` — 0 errors in events page (one pre-existing unrelated error in `.next/dev/types` excluded)
- Visual: sidebar filter boxes will display subtle dark borders (white/10) against dark background
- No light/white borders on any of the four filter containers in dark mode

## Self-Check: PASSED

- [x] `app/events/page.tsx` modified — confirmed
- [x] Commit f3eb53c exists — confirmed
- [x] All four sidebar boxes updated
- [x] Inner divider updated
- [x] Button text colors updated for dark mode
