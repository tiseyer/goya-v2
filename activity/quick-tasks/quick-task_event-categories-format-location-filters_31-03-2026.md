# Quick Task: Event Categories DB + Admin CRUD + Format/Location Filters

**Date:** 31-03-2026
**Task ID:** 260331-n6k
**Status:** Complete

## Task Description

Two-part feature:

1. **DB-driven event categories with admin CRUD tab** — Replace hardcoded category arrays with a database-backed `event_categories` table, add a Categories tab to the admin events page with full CRUD (create, edit, delete with in-use protection).

2. **Format + Location filters on public events page** — Add a Format filter (All/Online/In Person) to the sidebar and mobile filter bar. Selecting In Person reveals a Google Places city autocomplete field and radius slider for geographic filtering using client-side Haversine distance calculation.

## Solution Summary

### Migrations
- `_skip_20260370_event_categories.sql` — Creates `event_categories` table with `id`, `name`, `slug`, `color`, `parent_id`, `sort_order`, seeded with 7 default categories, RLS policies for public read + admin/moderator write
- `_skip_20260371_events_location_coords.sql` — Adds `location_lat` and `location_lng` (`double precision`) columns to `events` table

### Types
- Regenerated `types/supabase.ts` with new table and columns
- Added `EventCategoryRow` interface to `lib/types.ts`
- Added `location_lat`, `location_lng`, `event_type`, and `rejection_reason` fields to `Event` interface

### Admin Categories CRUD
- `app/admin/events/categories/actions.ts` — Server actions: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` (with in-use count check)
- `app/admin/events/categories/CategoryForm.tsx` — Form with name, slug (auto-generated from name), color picker, parent dropdown, description, sort order
- `app/admin/events/categories/CategoryManager.tsx` — Table with color swatch, CRUD actions, inline form, delete error display
- `app/admin/events/page.tsx` — Added Events/Categories tab navigation using `?tab=` searchParam

### Public Events Page
- `app/events/LocationFilter.tsx` — Google Places autocomplete (cities) with dynamic script loading, clear button, radius slider (10–500km, step 10, default 50km), exports `haversine` utility
- `app/events/page.tsx` — Added `dbCategories` state from Supabase, inline badge styles from DB hex colors, Format filter sidebar section, LocationFilter integration, Haversine distance filtering, mobile format segmented control, updated active filter count and clear handler

### Support Files
- `lib/cn.ts` — Added `clsx`-based `cn` utility (was missing from worktree)
- `app/components/ui/Badge.tsx` — Added Badge component with exports (was missing from worktree)
