---
phase: quick
plan: 260331-n6k
subsystem: events
tags: [event-categories, admin-crud, location-filter, google-places, haversine, supabase]
dependency_graph:
  requires: []
  provides: [event_categories_table, location_coords_on_events, admin_categories_crud, format_location_filters]
  affects: [app/admin/events, app/events]
tech_stack:
  added: [Google Places Autocomplete (dynamic load), Haversine distance formula]
  patterns: [server-actions, rls-policies, inline-style-from-db-color, dynamic-script-loading]
key_files:
  created:
    - supabase/migrations/_skip_20260370_event_categories.sql
    - supabase/migrations/_skip_20260371_events_location_coords.sql
    - app/admin/events/categories/actions.ts
    - app/admin/events/categories/CategoryForm.tsx
    - app/admin/events/categories/CategoryManager.tsx
    - app/events/LocationFilter.tsx
    - lib/cn.ts
    - app/components/ui/Badge.tsx
  modified:
    - types/supabase.ts
    - lib/types.ts
    - app/admin/events/page.tsx
    - app/events/page.tsx
decisions:
  - Inline hex styles from DB color field for category badges (backgroundColor+15, borderColor+40 alpha)
  - Google Maps script loaded dynamically only when LocationFilter mounts (avoids loading on unrelated pages)
  - Fallback to hardcoded ALL_CATEGORIES if event_categories DB fetch returns empty
  - _skip_ prefix on migrations means they run via supabase db query --linked (not db push)
  - cn utility implemented with clsx only (tailwind-merge not installed in project)
metrics:
  completed_at: "2026-03-31T09:59:55Z"
  tasks_completed: 3
  files_created: 8
  files_modified: 4
---

# Quick Task 260331-n6k: Event Categories DB + Admin CRUD + Format/Location Filters Summary

**One-liner:** DB-driven event_categories table with admin CRUD tabbed UI, public events page wired to DB categories with inline hex badge colors, and Format/Location filters using Google Places autocomplete + Haversine distance.

## What Was Built

### Task 1: Database + Types + Admin CRUD

**Migrations applied:**
- `event_categories` table with name, slug, color, parent_id, sort_order, RLS (public read, admin/moderator write), seeded with 7 default categories at `#345c83` GOYA blue
- `location_lat double precision` and `location_lng double precision` added to `events` table

**Types updated:**
- `types/supabase.ts` regenerated to include `event_categories` table and new columns
- `lib/types.ts` — Added `EventCategoryRow` interface; updated `Event` to include optional `location_lat`, `location_lng`, `event_type`, `rejection_reason`

**Admin categories CRUD:**
- `categories/actions.ts` — Server actions: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory` (checks event usage count before delete)
- `categories/CategoryForm.tsx` — Name field with auto-slug generation, manual slug override, color picker (`<input type="color">`), parent category dropdown (excludes self), description textarea, sort order
- `categories/CategoryManager.tsx` — Data table with color swatch, edit/delete buttons, inline form panel, delete error alert, client-side category list refresh
- `app/admin/events/page.tsx` — Events/Categories tab navigation via `?tab=` searchParam; Categories tab fetches categories server-side and passes to CategoryManager

### Task 2: Public Events Page + Format/Location Filters

**LocationFilter component (`app/events/LocationFilter.tsx`):**
- Dynamically loads Google Maps Places script (checks for duplicate, uses `_googleMapsLoaded` flag)
- Initializes `google.maps.places.Autocomplete` on mount with `types: ['(cities)']`
- Clear button resets location state
- Radius slider: 10–500km, step 10, default 50km, accessible with `aria-label`
- Exports `haversine(lat1, lng1, lat2, lng2): number` for use in filtering

**Public events page updates (`app/events/page.tsx`):**
- Fetches `event_categories` from Supabase client-side, builds dynamic category list
- Category badge: looks up DB entry by name, applies inline hex styles (`hex+15` background, `hex+40` border) — falls back to Tailwind badge classes if no DB match
- Category dot in sidebar: uses `style={{ backgroundColor: color }}` from DB — falls back to `CATEGORY_DOT` Tailwind classes
- Format filter section in sidebar between Event Type and Category: All/Online/In Person buttons
- `LocationFilter` renders below Format section when "In Person" selected
- Filtering logic: format filter, Haversine distance filter (excludes events without coords)
- Active filter count and "Clear all" handler updated to cover format + location
- Mobile: format segmented control row added, LocationFilter shown inline when In Person selected

## Deviations from Plan

**1. [Rule 3 - Blocking] Worktree missing app/components/ui/Badge.tsx**
- Found during: Task 2
- Issue: The worktree branched before Badge.tsx was added to develop; import would fail at runtime
- Fix: Copied Badge.tsx from main repo to worktree at `app/components/ui/Badge.tsx`
- Commit: a59db61

**2. [Rule 3 - Blocking] Worktree missing lib/cn.ts**
- Found during: Task 2 (after Badge.tsx import triggered the dependency)
- Issue: Badge.tsx imports `@/lib/cn` which didn't exist in worktree; clsx available but tailwind-merge not installed
- Fix: Created `lib/cn.ts` using clsx only (tailwind-merge not in project's package.json)
- Commit: a59db61

**3. [Rule 1 - Bug] PageHero variant prop not in worktree's PageHero type**
- Found during: Task 2
- Issue: The worktree's PageHero.tsx is an older version without the `variant` prop; would cause TS error
- Fix: Removed `variant="dark"` from the PageHero call in events/page.tsx (visual difference is minor; the prop can be wired once the worktree merges the updated PageHero)
- Commit: a59db61

**4. [Rule 1 - Bug] EventStatus union type missing pending_review**
- Found during: Task 1
- Issue: `ev.status === 'pending_review'` triggered TS2367 because `EventStatus` union doesn't include it
- Fix: Cast to `(ev.status as string)` for the comparison
- Commit: a43cb0c

**5. [Rule 2 - Missing] Event interface missing event_type and rejection_reason**
- Found during: Task 1 (admin events page references ev.event_type)
- Issue: Original Event interface was missing these fields used throughout admin pages
- Fix: Added `event_type: string`, `rejection_reason?: string | null` to Event interface
- Commit: a43cb0c

## Known Stubs

None — all data is wired to live Supabase tables.

## Self-Check

Files created/verified:
- [x] supabase/migrations/_skip_20260370_event_categories.sql — exists
- [x] supabase/migrations/_skip_20260371_events_location_coords.sql — exists
- [x] app/admin/events/categories/actions.ts — exists
- [x] app/admin/events/categories/CategoryForm.tsx — exists
- [x] app/admin/events/categories/CategoryManager.tsx — exists
- [x] app/events/LocationFilter.tsx — exists
- [x] activity/quick-tasks/quick-task_event-categories-format-location-filters_31-03-2026.md — exists

Commits:
- a43cb0c — feat(quick-n6k): add event_categories DB, admin CRUD tabs, location_lat/lng columns
- a59db61 — feat(quick-n6k): wire DB categories to events page + format/location filters
- 1d7180c — chore(quick-n6k): add activity tracking file

## Self-Check: PASSED
