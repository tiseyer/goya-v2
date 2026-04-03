---
phase: quick
plan: 260403-i2j
subsystem: ui/admin
tags: [pagehero, admin, inline-editing, variables, cms]
dependency_graph:
  requires: []
  provides: [page_hero_content table, /api/page-hero/[slug], lib/hero-variables, PageHero edit mode]
  affects: [app/dashboard/page.tsx, app/events/page.tsx, app/academy/page.tsx, app/addons/page.tsx]
tech_stack:
  added: [lib/hero-variables.ts]
  patterns: [client-side inline edit, fetch-on-mount pattern, variable interpolation]
key_files:
  created:
    - supabase/migrations/_skip_20260403_page_hero_content.sql
    - app/api/page-hero/[slug]/route.ts
    - lib/hero-variables.ts
    - docs/admin/admin-hero-editing.md
  modified:
    - app/components/PageHero.tsx
    - app/dashboard/page.tsx
    - app/events/page.tsx
    - app/academy/page.tsx
    - app/addons/page.tsx
decisions:
  - PageHero converted to 'use client' — consistent with worktree convention (inline SVGs, no lucide-react)
  - Dashboard uses single page.tsx (no separate DashboardStudent/Teacher components in this worktree)
  - Add-Ons profile select extended to include full_name for heroContext
  - Variable bar uses clickable pills that insert at cursor position of focused field
metrics:
  duration: ~15min
  completed_date: 2026-04-03
  tasks_completed: 3
  files_changed: 9
---

# Quick Task 260403-i2j: Admin Inline Hero Editing Summary

**One-liner:** Admin pencil-icon inline editor on all PageHero banners with [variable] interpolation, saved to page_hero_content table via authenticated API.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Database migration, API route, variable utility | d7d307e | _skip migration, /api/page-hero/[slug]/route.ts, lib/hero-variables.ts |
| 2 | Convert PageHero to client component with edit mode | 57752d4 | app/components/PageHero.tsx |
| 3 | Wire pages, update consumers, create docs | a88a3b6 | 4 consumer pages, docs/admin/admin-hero-editing.md |

## What Was Built

### Database Layer
- `page_hero_content` table with `slug` PK, nullable `pill/title/subtitle`, `updated_at`, `updated_by` (UUID ref)
- RLS: admins can write; anyone can read
- Migration uses `_skip_` prefix (applied to main repo, not linked worktree)

### API Layer
- `GET /api/page-hero/[slug]` — returns `{pill, title, subtitle}` or nulls (no auth needed)
- `POST /api/page-hero/[slug]` — verifies admin role via session, upserts row

### Variable Utility (`lib/hero-variables.ts`)
- `HeroContext` interface with 6 fields
- `HERO_VARIABLES` array (const) for UI rendering
- `resolveHeroVariables(text, ctx)` — replaces `[first_name]`, `[full_name]`, `[role]`, `[greeting]`, `[member_count]`, `[event_count]`

### PageHero Component
- Converted to `'use client'` with backward-compatible props
- Fetches custom content from API on mount when `pageSlug` is set
- Admin pencil icon (top-right, absolute) toggles inline edit mode
- Inputs styled to match each variant's text appearance (transparent bg, dashed border-b)
- Variable bar below subtitle in edit mode — click to insert at cursor
- Save/Cancel buttons, green "Saved" flash indicator
- Supports both `variant="dark"` and `variant="light"` (default)

### Consumer Pages
- **Dashboard**: heroCtx from `profile.full_name` / `role`, `pageSlug="dashboard"`
- **Events**: added useEffect for admin check + heroCtx, `pageSlug="events"`
- **Academy**: added profile fetch within existing useEffect, `pageSlug="academy"`
- **Add-Ons**: server component, added `full_name` to profile select, heroCtx built server-side, `pageSlug="addons"`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Addons page profile select missing full_name**
- **Found during:** Task 3 TypeScript check
- **Issue:** `profile.full_name` referenced but select only fetched `role, designations`
- **Fix:** Added `full_name` to the `.select()` call in addons/page.tsx
- **Files modified:** app/addons/page.tsx
- **Commit:** a88a3b6

### Structural Differences from Plan Spec

The plan described `DashboardStudent.tsx`, `DashboardTeacher.tsx`, `DashboardWellness.tsx`, `DashboardSchool.tsx` as separate files — these do not exist in this worktree. The dashboard is a single `page.tsx` client component. The heroContext was wired directly there instead.

## Known Stubs

None — all variable resolution is live. The `[member_count]` and `[event_count]` variables default to `0` unless the calling page passes those values in heroContext (no consumer pages currently pass them — this is intentional; they can be added when those counts are available).

## Self-Check: PASSED

All created files exist on disk. All 3 task commits verified in git log (d7d307e, 57752d4, a88a3b6).
