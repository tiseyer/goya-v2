---
phase: 44-shared-ui-components
plan: "01"
subsystem: dashboard-components
tags: [carousel, embla, components, dashboard, ui]
dependency_graph:
  requires: []
  provides:
    - HorizontalCarousel (embla drag + CSS snap + skeleton + empty state)
    - DashboardGreeting (time-of-day greeting + role badge pill)
    - PrimaryActionCard (headline + description + CTA link)
    - ProfileCompletionCard (progress bar + checklist + null at 100%)
    - StatHero + StatHeroGrid (text-4xl metric tile + grid helper)
    - "@utility no-scrollbar in globals.css"
  affects:
    - All Phase 45-46 role layout components (consumers)
tech_stack:
  added:
    - embla-carousel-react@^8.6.0
  patterns:
    - "@utility no-scrollbar (Tailwind v4 CSS utility)"
    - "useEmblaCarousel hook for desktop drag-to-scroll"
    - "CSS snap-x snap-mandatory for mobile swipe"
    - "Role badge pill with static color mapping"
key_files:
  created:
    - app/dashboard/components/HorizontalCarousel.tsx
    - app/dashboard/components/DashboardGreeting.tsx
    - app/dashboard/components/PrimaryActionCard.tsx
    - app/dashboard/components/ProfileCompletionCard.tsx
    - app/dashboard/components/StatHero.tsx
  modified:
    - app/globals.css (@utility no-scrollbar added)
    - package.json (embla-carousel-react dependency)
decisions:
  - "@utility no-scrollbar placed in globals.css — not a separate file (tailwind-scrollbar-hide confirmed broken under Tailwind v4)"
  - "embla pinned to ^8 per STACK.md"
  - "No carousel arrow buttons — swipe/scroll only (Apple aesthetic)"
  - "StatHero uses static display — no count-up animation (SSR-friendly)"
metrics:
  duration: "2m 29s"
  completed_date: "2026-04-02T04:36:19Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 5
  files_modified: 2
---

# Phase 44 Plan 01: Infrastructure Components Summary

**One-liner:** Five reusable dashboard components with embla-carousel-react drag + CSS snap scrolling, role badge pills, h-1.5 progress bar, em-dash null display, and Tailwind v4 @utility no-scrollbar.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install embla + no-scrollbar + HorizontalCarousel + DashboardGreeting | 6458dcf | app/globals.css, HorizontalCarousel.tsx, DashboardGreeting.tsx, package.json |
| 2 | PrimaryActionCard, ProfileCompletionCard, StatHero | 5c6aa7f | PrimaryActionCard.tsx, ProfileCompletionCard.tsx, StatHero.tsx |

## What Was Built

### HorizontalCarousel (`app/dashboard/components/HorizontalCarousel.tsx`)
- `'use client'` component using `useEmblaCarousel({ dragFree: true, containScroll: 'trimSnaps' })` for desktop drag-to-scroll
- CSS `snap-x snap-mandatory` track for mobile swipe
- `no-scrollbar` utility applied to hide the scrollbar visually
- 3-item skeleton loading state (`w-[280px] h-48 animate-pulse`) when `loading={true}`
- Empty state rendering when children are absent and `emptyState` is provided
- "Show all →" link aligned right when `showAllHref` is provided

### DashboardGreeting (`app/dashboard/components/DashboardGreeting.tsx`)
- `'use client'` component calling `getTimeOfDay()` from `./utils`
- Renders "Good {morning/afternoon/evening}, {firstName}." as `text-2xl font-bold`
- Role badge pill with static color map: student=blue, teacher=emerald, wellness_practitioner=purple, school=amber, default=slate
- Optional subtitle below in `text-base text-slate-500`

### PrimaryActionCard (`app/dashboard/components/PrimaryActionCard.tsx`)
- Server component using `Card` variant="default" padding="lg"
- headline: `text-lg font-bold`, description: `text-sm text-slate-500`
- CTA: `<a>` styled as `rounded-xl bg-[var(--goya-primary)] text-white hover:opacity-90`

### ProfileCompletionCard (`app/dashboard/components/ProfileCompletionCard.tsx`)
- Returns `null` when `completion.score >= 100` (hidden at full completion)
- Card variant="outlined" for visual differentiation
- `h-1.5` progress bar with `bg-[var(--goya-primary)]` fill and `transition-[width] duration-500`
- Checklist of `completion.missing` items with Lucide `Circle` icon (size 14) and deep link `href`

### StatHero + StatHeroGrid (`app/dashboard/components/StatHero.tsx`)
- `text-4xl font-bold` value with `\u2014` (em dash) for `null | undefined`
- Explicitly displays `0` when value is `0`
- Suffix appended only when value is not null
- `StatHeroGrid` companion: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`

### globals.css
- Added `@utility no-scrollbar` with Tailwind v4 syntax (did NOT install tailwind-scrollbar-hide — confirmed broken under v4)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all components are fully wired with real props. Data is injected by consumer pages (Phases 45-46).

## Verification

- `npx tsc --noEmit`: zero new errors (one pre-existing `.next/dev/types/validator.ts` error unrelated to this plan)
- All 5 component files exist in `app/dashboard/components/`
- `embla-carousel-react@^8.6.0` in `package.json`
- `@utility no-scrollbar` present in `app/globals.css`

## Self-Check: PASSED

Files created:
- FOUND: app/dashboard/components/HorizontalCarousel.tsx
- FOUND: app/dashboard/components/DashboardGreeting.tsx
- FOUND: app/dashboard/components/PrimaryActionCard.tsx
- FOUND: app/dashboard/components/ProfileCompletionCard.tsx
- FOUND: app/dashboard/components/StatHero.tsx

Commits:
- FOUND: 6458dcf
- FOUND: 5c6aa7f
