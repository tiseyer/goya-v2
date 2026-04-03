---
phase: quick-task
plan: 260403-mah
subsystem: PageHero / page_hero_content
tags: [pagehero, admin-editing, supabase-seed, ui-fix]
key-files:
  created:
    - supabase/migrations/20260404_seed_page_hero_defaults.sql
  modified:
    - app/components/PageHero.tsx
decisions:
  - ON CONFLICT DO NOTHING chosen for seed migration to preserve any admin customizations already in DB
  - Variables panel uses absolute positioning inside section (not fixed) to stay within hero bounds on scroll
  - Save/Cancel consolidated as icon buttons inside adminControl block (variant-aware styling) to avoid separate fixed panels
metrics:
  duration: ~10 minutes
  completed: 2026-04-03
  tasks: 2
  files: 2
---

# Quick Task 260403-mah: Fix PageHero Edit UI — Pill Visibility, Contained Panels, DB Seed

**One-liner:** Seeded 4 default hero content rows into DB, fixed pill input disappearing when cleared in edit mode, and moved all edit UI panels (variables + save/cancel) from fixed page-level positioning to absolute positioning inside the hero section.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Seed default hero content into DB | 6dd95a0 | supabase/migrations/20260404_seed_page_hero_defaults.sql |
| 2 | Fix pill input visibility and move edit UI inside hero | d982994 | app/components/PageHero.tsx |

## Changes Made

### Task 1: DB Seed Migration

Created `supabase/migrations/20260404_seed_page_hero_defaults.sql` with `INSERT ... ON CONFLICT (slug) DO NOTHING` for all 4 page slugs:

- `dashboard`: pill=`[role]`, title=`[greeting], [first_name].`, subtitle=`Ready to practice today?`
- `events`: pill=`Events`, title=`Events`, subtitle=workshops/trainings/talks description
- `academy`: pill=`GOYA Academy`, title=`Course Library`, subtitle=course library description
- `add-ons`: pill=`Brightcoms`, title=`All Add-Ons & Upgrades`, subtitle=add-ons description

Ran against remote DB using `npx supabase db query --linked`. All 4 rows confirmed present. Existing dashboard row (which had prior customization) was correctly preserved by ON CONFLICT DO NOTHING.

### Task 2: PageHero Edit UI Fixes

**A. Pill input always visible in edit mode:**
Changed `darkPillContent` and `lightPillContent` conditionals from `templatePill ? ...` to `(editing || templatePill) ? ...`. This ensures the pill container (including the input field) always renders while editing, even after the admin clears the pill text.

**B. Variables panel moved inside hero:**
Replaced `fixed left-0 top-1/2 -translate-y-1/2 z-50` panels with `absolute bottom-2 left-2 z-10` panels inside `<section>`. Used `flex-wrap gap-1` layout with smaller `text-[10px]` tokens instead of full pill-sized buttons to fit within the hero bounds. Dark variant: `bg-black/20` with white text. Light variant: `bg-slate-800/20` with slate text.

**C. Save/Cancel buttons moved inside hero:**
Removed two separate `fixed top-4 right-4 z-50` button panels. Modified `adminControl` block so that in editing state it renders two icon buttons side by side (`flex items-center gap-2`) at the existing `absolute top-4 right-4 z-10` position:
- Save button: checkmark SVG, disabled while saving, green hover tint
- Cancel button: X SVG, existing cancel styles

Both buttons are variant-aware (dark/light color schemes).

**D. DB-first architecture confirmed (no code change):**
Verified mount → fetch `/api/page-hero/${pageSlug}` → DB values → prop fallback chain is correct and unmodified.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npx tsc --noEmit`: zero errors in project files (one pre-existing generated validator.ts error in .next/ unrelated to this work)
- DB seed: all 4 rows confirmed via `SELECT` query after migration
- No `fixed` positioning remains in PageHero edit UI

## Known Stubs

None.

## Self-Check

- [x] `supabase/migrations/20260404_seed_page_hero_defaults.sql` exists
- [x] `app/components/PageHero.tsx` modified
- [x] Commit 6dd95a0 exists (Task 1)
- [x] Commit d982994 exists (Task 2)
