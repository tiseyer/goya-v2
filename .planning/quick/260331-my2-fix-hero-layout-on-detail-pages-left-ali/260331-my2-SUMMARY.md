---
phase: quick
plan: 260331-my2
subsystem: ui/heroes
tags: [hero, layout, typography, spacing, alignment]
dependency_graph:
  requires: []
  provides: [left-aligned-detail-heroes, consistent-hero-structure]
  affects: [app/events/[id]/page.tsx, app/academy/[id]/page.tsx, app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [tailwind-responsive-spacing, text-4xl-md-text-5xl]
key_files:
  modified:
    - app/events/[id]/page.tsx
    - app/academy/[id]/page.tsx
    - app/members/[id]/page.tsx
decisions:
  - "Course hero meta line shows instructor + duration only (lesson_count not on Course type)"
  - "Event gradient hero pills changed mb-4→mb-3 to match image hero pattern"
metrics:
  duration: ~10min
  completed: 2026-03-31
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260331-my2: Fix Hero Layout on Detail Pages Summary

**One-liner:** Left-aligned heroes with text-4xl md:text-5xl titles, consistent back link > pills > H1 > meta order across event, course, and member profile detail pages.

## What Was Done

### Task 1: Event and course detail hero fixes

**Event detail page (`app/events/[id]/page.tsx`):**
- Image hero: back link `mb-5` → `mb-4`, title `text-3xl sm:text-4xl` → `text-4xl md:text-5xl`, date meta `<p>` added after H1
- Gradient hero: pills `mb-4` → `mb-3`, title updated to `md:text-5xl` breakpoint

**Course detail page (`app/academy/[id]/page.tsx`):**
- Back link `mb-2` → `mb-4`
- Pills row `mb-2` → `mb-3`
- H1 title `text-3xl sm:text-4xl` → `text-4xl md:text-5xl`
- Instructor + duration meta line added after short_description (omits lesson_count — not on Course type)

### Task 2: Member profile hero fix

- Outer flex container: `items-center` → `items-start` (left-aligns mobile)
- Info div: `text-center sm:text-left` → `text-left` (always left)
- Role pill wrapper: `justify-center sm:justify-start` → `justify-start`
- Location div: `justify-center sm:justify-start` → `justify-start`
- H1 title: `text-3xl sm:text-4xl lg:text-5xl` → `text-4xl md:text-5xl`
- Location meta: `mt-2` → `mt-1`
- Avatar layout and ring styling preserved

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `43354ed` — feat(quick-260331-my2): fix event and course detail hero spacing, title size, meta line
- `5bbb045` — feat(quick-260331-my2): left-align member profile hero and bump title size

## Self-Check: PASSED

Files modified: 3/3 confirmed.
TypeScript: Only pre-existing `linkify-it 2` / `mdurl 2` declaration errors (unrelated duplicate file artifacts). Zero new errors.
