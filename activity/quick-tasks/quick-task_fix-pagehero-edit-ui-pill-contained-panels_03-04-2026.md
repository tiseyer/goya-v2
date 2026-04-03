# Quick Task: Fix PageHero Edit UI — Pill Visibility, Contained Panels, DB Seed

**Task ID:** 260403-mah
**Date:** 2026-04-03
**Status:** Complete

## Task Description

Three related issues with the PageHero admin edit UI:

1. The pill input disappeared in edit mode when the pill text was cleared (bug in conditional rendering)
2. The variables panel and save/cancel buttons were rendered as fixed-position page-level overlays, causing them to overlap other page content and break on scroll
3. No default content existed in the DB — the dashboard pill (`[role]`) had been accidentally deleted with no seed data to restore it

## Solution

**DB seed migration** (`supabase/migrations/20260404_seed_page_hero_defaults.sql`):
- Upserted default rows for all 4 pages (dashboard, events, academy, add-ons) using `ON CONFLICT (slug) DO NOTHING`
- Preserved any existing admin customizations
- Applied to remote DB via `npx supabase db query --linked`

**PageHero.tsx changes:**
- Pill container now always renders in edit mode: changed `templatePill ? ...` to `(editing || templatePill) ? ...` for both dark and light variants
- Variables panel moved from `fixed left-0 top-1/2 z-50` to `absolute bottom-2 left-2 z-10` inside `<section>` — stays within hero bounds
- Save + Cancel buttons consolidated into `adminControl` block (already `absolute top-4 right-4`) as two icon buttons side by side — removed all `fixed top-4 right-4 z-50` panels

## Commits

- `6dd95a0` — DB seed migration
- `d982994` — PageHero UI fixes
