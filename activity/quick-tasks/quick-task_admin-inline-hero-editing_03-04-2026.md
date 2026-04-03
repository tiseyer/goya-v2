---
task_id: 260403-i2j
date: 2026-04-03
status: complete
---

# Quick Task: Admin Inline Hero Editing

## Task Description

Add admin inline editing to PageHero — admins can click a pencil icon on any page hero to edit pill text, title, and subtitle with variable support ([first_name], [greeting], etc.). Content persists to a new page_hero_content table.

## Solution

1. Created `page_hero_content` DB table (migration) with slug PK, nullable pill/title/subtitle, RLS for admin writes and public reads.
2. Added GET + POST API route at `/api/page-hero/[slug]` with admin auth guard on POST.
3. Created `lib/hero-variables.ts` with `HeroContext` type, `HERO_VARIABLES` array, and `resolveHeroVariables()` utility.
4. Converted `PageHero` to `'use client'` component with full inline edit mode: pencil icon toggle, transparent inputs, variable insertion bar, Save/Cancel, "Saved" flash.
5. Wired `pageSlug`, `isAdmin`, and `heroContext` to all 4 consumer pages (Dashboard, Events, Academy, Add-Ons).
6. Created `docs/admin/admin-hero-editing.md`.

## Commits

- `d7d307e` — feat: migration, API route, hero-variables utility
- `57752d4` — feat: PageHero client component with edit mode
- `a88a3b6` — feat: wire all consumer pages + docs

## Status: COMPLETE
