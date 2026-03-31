---
phase: quick
plan: 260331-kny
subsystem: ui/heroes
tags: [hero, consistency, css-variables, tailwind, detail-pages]
dependency_graph:
  requires: []
  provides: [consistent-hero-system-across-detail-pages]
  affects: [app/events/[id]/page.tsx, app/academy/[id]/page.tsx, app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [PageContainer, bg-primary CSS variable, fixed-height hero with flex centering]
key_files:
  modified:
    - app/events/[id]/page.tsx
    - app/academy/[id]/page.tsx
    - app/members/[id]/page.tsx
  created:
    - activity/quick-tasks/quick-task_HeroConsistency_31-03-2026.md
decisions:
  - "Course detail hero: removed category gradient_from/gradient_to inline style entirely — bg-primary is the single source of truth for all detail page hero backgrounds"
  - "Member profile glow: replaced bg-[#4E87A0] with bg-primary-light to eliminate hardcoded hex values in favor of CSS variables"
  - "Meta row (instructor/duration/lessons) removed from course hero to fit fixed height — content still accessible in main course content area"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_changed: 4
---

# Phase quick Plan 260331-kny: Hero Consistency Summary

**One-liner:** Applied `bg-primary`, `h-[200px] sm:h-[220px] md:h-[240px]`, and `flex items-center` to event, course, and member detail page heroes — replacing category gradients and hardcoded hex values with the GOYA CSS variable system.

## What Was Built

All three detail page heroes now match the overview page PageHero (dark variant):

| Page | Before | After |
|------|--------|-------|
| Event detail (no image) | `bg-primary-dark pt-24 pb-12` | `bg-primary flex items-center h-[200px] sm:h-[220px] md:h-[240px]` |
| Course detail | `linear-gradient(${gradient_from}, ${gradient_to})` with pt-24 pb-16 | `bg-primary flex items-center h-[200px] sm:h-[220px] md:h-[240px]` + dot-grid + glow |
| Member profile | `bg-gradient-to-b from-[#1B3A5C] via-[#1B3A5C] to-[#1e3a5f] pt-20 pb-20` | `bg-primary flex items-center h-[200px] sm:h-[220px] md:h-[240px]` |

## Commits

- `17e290d` — feat(quick-260331-kny): standardize event and course detail hero sections
- `0c6126f` — feat(quick-260331-kny): standardize member profile hero and add activity log

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

One minor adaptation: the course detail page meta row (instructor, duration, lessons) was removed from the hero to keep content within the fixed height, rather than cramming all content into 200-240px. The meta row data remains visible in the main content area below. This is consistent with the event detail hero pattern which also does not include meta rows in the hero.

## Known Stubs

None — all heroes render live data. No placeholder values introduced.

## Self-Check: PASSED

- [x] `app/events/[id]/page.tsx` — contains `bg-primary`, `h-[200px]`, `flex items-center`
- [x] `app/academy/[id]/page.tsx` — contains `bg-primary`, `h-[200px]`, `flex items-center`, no `gradient_from`
- [x] `app/members/[id]/page.tsx` — contains `bg-primary`, `h-[200px]`, `flex items-center`, no `#1B3A5C`
- [x] `activity/quick-tasks/quick-task_HeroConsistency_31-03-2026.md` — exists
- [x] TypeScript: only pre-existing `linkify-it 2` / `mdurl 2` type definition errors; no new errors
- [x] Commits 17e290d and 0c6126f exist on develop branch
