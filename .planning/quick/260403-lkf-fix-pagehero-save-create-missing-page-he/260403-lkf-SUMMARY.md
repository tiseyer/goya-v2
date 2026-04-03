---
phase: quick
plan: 260403-lkf
subsystem: page-hero
tags: [database, types, rls, admin-ui]
tech-stack:
  added: []
  patterns: [supabase-rls, slug-as-pk, upsert-on-conflict]
key-files:
  created: []
  modified:
    - supabase/migrations/20260404_page_hero_content.sql
    - types/supabase.ts
decisions:
  - Use slug as TEXT primary key (not uuid id) to match API onConflict: 'slug' upsert pattern
  - FK on updated_by references auth.users(id) not profiles(id) since RLS uses auth.uid()
  - Drop and recreate table via db query --linked since migration was already applied with wrong schema
metrics:
  duration: ~5m
  completed: 2026-04-03
  tasks_completed: 3
  files_modified: 2
---

# Quick Task 260403-lkf: Fix PageHero Save — Correct page_hero_content Schema

**One-liner:** Fixed page_hero_content migration column mismatches (page_slug→slug, pill_text→pill, uuid id→slug PK) and regenerated Supabase types so PageHero inline editing saves succeed end-to-end.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Fix migration column names and push DB | 323d3d1 | Done |
| 2 | Regenerate Supabase types + preserve is_superuser | 720be3c | Done |
| 3 | Verify pencil button visibility on Events and Academy | (no code change needed) | Done |

## What Was Done

### Task 1: Migration Fix

The `20260404_page_hero_content.sql` migration had three mismatches with the API route:

| Migration (old) | API expects | Fix |
|----------------|-------------|-----|
| `id uuid primary key` + `page_slug text not null unique` | `slug` as PK | `slug text primary key` |
| `pill_text text` | `pill` | `pill text` |
| `references profiles(id)` | `auth.users(id)` | `references auth.users(id)` |

The table was already created on the remote DB with the wrong schema, so the migration was rewritten with `drop table if exists page_hero_content` at the top and applied via `npx supabase db query --linked -f`.

Verified correct schema in production:
- slug (text, PK)
- pill (text)
- title (text)
- subtitle (text)
- updated_at (timestamptz)
- updated_by (uuid → auth.users)

RLS policies kept as-is (admin-only write, authenticated read).

### Task 2: Type Regeneration

Ran `npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts`.

Verified:
- `page_hero_content` table appears with correct column names
- `is_superuser: boolean` present in profiles Row, Insert, and Update sections
- `npx tsc --noEmit` passes with 0 source errors (only a stale `.next/` dev cache artifact, not a source error)

### Task 3: Pencil Button Verification

Confirmed all PageHero consumers pass correct props:
- `app/events/page.tsx`: `pageSlug="events"` + `isAdmin={isAdmin}` where `setIsAdmin(profile.role === 'admin')`
- `app/academy/page.tsx`: `pageSlug="academy"` + `isAdmin={isAdmin}` where `setIsAdmin(profile.role === 'admin')`
- Dashboard variants: `isAdmin={profile.role === 'admin'}` — already correct
- Add-Ons: `isAdmin={role === 'admin'}` — already correct

Final sweep: `grep -rn "'superuser'" app/ lib/` — zero matches. No source files reference 'superuser' as a role value.

## Verification

- [x] `npx tsc --noEmit` passes with 0 source errors
- [x] `grep -rn "'superuser'" app/ lib/` returns no matches
- [x] `page_hero_content` table has correct schema in Supabase (slug PK, pill, title, subtitle)
- [x] `types/supabase.ts` contains page_hero_content with correct columns AND is_superuser boolean on profiles

## Deviations from Plan

**1. [Rule 3 - Blocking] Applied SQL via db query --linked instead of db push**

- **Found during:** Task 1
- **Issue:** The constraint specified the migration was already applied to the remote DB. `npx supabase db push` would have failed or skipped the file due to migration history tracking. The plan itself noted this as a possibility.
- **Fix:** Used `npx supabase db query --linked -f supabase/migrations/20260404_page_hero_content.sql` to apply the corrected SQL directly, then verified schema via query.
- **Files modified:** supabase/migrations/20260404_page_hero_content.sql
- **Commit:** 323d3d1

## Known Stubs

None.
