# Quick Task: Admin Inline Hero Editing

**Date:** 2026-04-03
**Status:** Complete
**Quick ID:** 260403-i2j

## Task Description

Allow admins to edit the hero section (pill, title, subtitle) of Dashboard, Events, Academy, and Add-Ons pages inline, with dynamic variable support.

## Solution

- Created `page_hero_content` Supabase table with RLS policies
- API route at `/api/page-hero/[slug]` for GET/POST
- `lib/hero-variables.ts` with 6 supported variables: [first_name], [full_name], [role], [greeting], [member_count], [event_count]
- Converted PageHero to client component with inline edit mode (pencil icon, inline inputs, variable bar, save indicator)
- Wired all 7 consumers (4 Dashboard layouts, Events, Academy, Add-Ons) with pageSlug, isAdmin, heroContext
- Admin documentation at `docs/admin/admin-hero-editing.md`

## Commits

- `d7d307e` — migration, API route, variable utility
- `57752d4` — PageHero client component with edit mode
- `a88a3b6` — wire all consumers
- `2ca02b3` — merge with conflict resolution
