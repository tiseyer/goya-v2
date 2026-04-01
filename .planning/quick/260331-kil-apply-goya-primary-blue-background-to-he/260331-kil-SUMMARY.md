---
phase: quick
plan: 260331-kil
subsystem: ui/components
tags: [hero, branding, dark-variant, PageHero]
dependency_graph:
  requires: []
  provides: [PageHero dark variant]
  affects: [dashboard, events, academy, addons]
tech_stack:
  added: []
  patterns: [conditional variant prop, dark hero with texture overlay]
key_files:
  created: []
  modified:
    - app/components/PageHero.tsx
    - app/dashboard/page.tsx
    - app/events/page.tsx
    - app/academy/page.tsx
    - app/addons/page.tsx
    - activity/quick-tasks/quick-task_HeroBlueBackground_31-03-2026.md
decisions:
  - "Dark variant added as prop rather than separate component — keeps API minimal and avoids duplication"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_changed: 6
---

# Phase quick Plan 260331-kil: Apply GOYA Primary Blue Hero Background Summary

**One-liner:** Added `variant="dark"` to PageHero — GOYA primary blue (#345c83) background with dot-grid texture, white text, and matching pill styles applied to Dashboard, Events, Academy, and Add-Ons hero sections.

## What Was Built

Extended `PageHero.tsx` with a `variant` prop (`'light' | 'dark'`, default `'light'`). The dark variant renders `bg-primary` (#345c83) section background with:
- Dot-grid texture overlay at `opacity-[0.04]`
- Top-right soft glow using `bg-primary-light/20 blur-3xl`
- Center background glow using `bg-white opacity-[0.05]`
- Pill: `bg-white/12 text-white/90 border-white/15`
- Title: `text-white font-black`
- Subtitle: `text-primary-200`

Applied to four pages by adding `variant="dark"` to their existing `<PageHero>` calls. No structural changes to those pages.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `6b49a0a` | Add dark variant to PageHero component |
| Task 2 | `35bb518` | Apply dark hero variant to Dashboard, Events, Academy, Add-Ons |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit` — only pre-existing `linkify-it 2` / `mdurl 2` type errors (unrelated duplicate files); no new errors introduced
- All four pages confirmed with `variant="dark"` via grep
- `app/events/[id]/page.tsx` unchanged (verified no modifications)

## Self-Check: PASSED

- `app/components/PageHero.tsx` — modified, variant prop present
- `app/dashboard/page.tsx` — `variant="dark"` on line 124
- `app/events/page.tsx` — `variant="dark"` on line 236
- `app/academy/page.tsx` — `variant="dark"` on line 114
- `app/addons/page.tsx` — `variant="dark"` on line 156
- Commits `6b49a0a` and `35bb518` confirmed in git log
