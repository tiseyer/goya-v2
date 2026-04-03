---
phase: quick
plan: 260403-n8u
subsystem: ui-components
tags: [pagehero, ux, visual-polish, fofc]
key-files:
  modified:
    - app/components/PageHero.tsx
decisions:
  - Dot grid opacity doubled from 0.04 to 0.08 on dark variant only (light variant has no grid)
  - FOFC prevention via contentReady/showFallback dual-flag pattern — text fades in, outer section always visible
  - 800ms timeout as fallback ensures text always appears even on slow/failed fetches
metrics:
  duration: "~5 minutes"
  completed: "2026-04-03"
  tasks: 1
  files: 1
---

# Quick Task 260403-n8u: PageHero Dot Grid Visibility + No Flash of Fallback Content

**One-liner:** Doubled dark variant dot grid opacity (0.04 → 0.08) and added dual-state FOFC prevention so hero text fades in after fetch resolves or 800ms elapses, while background/height remain stable throughout.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Increase dot grid visibility and add FOFC prevention | 48ecc5c | app/components/PageHero.tsx |

## Changes Made

### Fix 1: Dot grid opacity (dark variant)

`opacity-[0.04]` → `opacity-[0.08]` on the dot-grid texture div. No change to dot size (1px), spacing (28px), or color (white). Light variant untouched.

### Fix 2: FOFC prevention

Two new state variables:
- `contentReady` — starts `true` when no `pageSlug` (no fetch needed), otherwise set to `true` on fetch success or failure
- `showFallback` — starts `true` when no `pageSlug`, otherwise set to `true` after 800ms timeout as safety valve

Derived `isVisible = contentReady || showFallback` controls a `transition-opacity duration-200` on the inner text content div (both dark and light variants). The outer `<section>` is never hidden — background color and height are always visible with no layout shift.

Cleanup: the 800ms timer is cleared on fetch resolve/reject and on effect cleanup.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- File exists: app/components/PageHero.tsx
- Commit 48ecc5c exists in git log
- TypeScript compiles with 0 errors
