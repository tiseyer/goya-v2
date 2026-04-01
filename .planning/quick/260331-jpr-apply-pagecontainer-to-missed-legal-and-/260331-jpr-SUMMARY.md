---
phase: quick-260331-jpr
plan: 01
subsystem: layout
tags: [layout, pagecontainer, legal-pages, events]
dependency_graph:
  requires: [quick-260331-j10]
  provides: [LAYOUT-CONSISTENCY]
  affects: [app/privacy, app/terms, app/code-of-conduct, app/code-of-ethics, app/events/[id]]
tech_stack:
  added: []
  patterns: [PageContainer for full-bleed hero + content width, inner max-w-3xl for prose]
key_files:
  created: []
  modified:
    - app/privacy/page.tsx
    - app/terms/page.tsx
    - app/code-of-conduct/page.tsx
    - app/code-of-ethics/page.tsx
    - app/events/[id]/page.tsx
decisions:
  - Prose pages keep inner max-w-3xl inside PageContainer per CLAUDE.md prose convention
  - Event detail absolute-positioned overlay uses PageContainer to align with page content
key_decisions:
  - Prose pages keep inner max-w-3xl inside PageContainer per CLAUDE.md prose convention
  - Event detail absolute-positioned overlay uses PageContainer to align with page content
metrics:
  duration: ~5 min
  completed: 2026-03-31
  tasks: 2
  files: 5
---

# Phase quick-260331-jpr Plan 01: PageContainer on Legal Pages + Event Detail Summary

**One-liner:** Replaced hardcoded `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with PageContainer on 4 legal pages and the event detail page, completing the layout width consistency standard.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Apply PageContainer to 4 legal pages | c58e3fc | app/privacy/page.tsx, app/terms/page.tsx, app/code-of-conduct/page.tsx, app/code-of-ethics/page.tsx |
| 2 | Apply PageContainer to event detail page | 3cac382 | app/events/[id]/page.tsx |

## What Was Done

**Task 1 — Legal pages (privacy, terms, code-of-conduct, code-of-ethics):**
- Added `import PageContainer from '@/app/components/ui/PageContainer'` to each file
- Hero section: removed `px-4 sm:px-6 lg:px-8` from the full-bleed `bg-primary-dark` div, replaced inner `max-w-7xl mx-auto` div with `<PageContainer>`
- Body section: replaced `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24` outer div with `<PageContainer className="py-14 pb-24">`, kept inner `<div className="max-w-3xl mx-auto">` for prose readability per CLAUDE.md

**Task 2 — Event detail page:**
- Added import
- Image hero overlay: removed `px-4 sm:px-6 lg:px-8` from absolute-positioned wrapper, replaced `max-w-7xl mx-auto` inner div with `<PageContainer>`
- Gradient hero: removed `px-4 sm:px-6 lg:px-8` from `bg-primary-dark` outer div, replaced `max-w-7xl mx-auto relative` inner div with `<PageContainer className="relative">`
- Main content: replaced `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10` div with `<PageContainer className="py-10">`

## Verification

- `npx tsc --noEmit` — only pre-existing errors for `linkify-it 2` and `mdurl 2` type definitions (unrelated to this task)
- `grep max-w-7xl` in all 5 page paths — zero matches
- `grep PageContainer` confirms import + usage in all 5 files

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files exist:
- app/privacy/page.tsx — FOUND
- app/terms/page.tsx — FOUND
- app/code-of-conduct/page.tsx — FOUND
- app/code-of-ethics/page.tsx — FOUND
- app/events/[id]/page.tsx — FOUND

Commits exist:
- c58e3fc — FOUND
- 3cac382 — FOUND
