---
phase: 02-users-analytics
plan: 01
subsystem: admin-analytics
tags: [analytics, users, recharts, supabase, server-component]
completed: 2026-03-31
duration_minutes: 12
tasks_completed: 2
files_created: 2
files_modified: 0

dependency_graph:
  requires:
    - "01-01: AdminShell analytics nav with /admin/analytics/users link"
  provides:
    - "Users Analytics page at /admin/analytics/users"
    - "Stat cards for all user roles"
    - "Cumulative growth area chart with time/role filter pills"
    - "Recent signups table with admin links"
  affects:
    - "app/admin/analytics/users/"

tech_stack:
  added: []
  patterns:
    - "Promise.allSettled for parallel Supabase queries"
    - "getSupabaseService() for server-side counts"
    - "getMemberGrowthData server action reuse from dashboard"
    - "Recharts AreaChart with linearGradient fill"
    - "Client-side filter pills driving server action refetches"

key_files:
  created:
    - app/admin/analytics/users/page.tsx
    - app/admin/analytics/users/UsersAnalyticsClient.tsx
  modified: []

decisions:
  - "Reused getMemberGrowthData from dashboard/actions.ts rather than duplicating growth chart logic — single source of truth for faux/robot exclusion and range/role logic"
  - "Used gradient ID 'usersGradient' (not 'memberGradient') to avoid SVG gradient ID collision when both dashboard and analytics pages load simultaneously"
  - "Recent signups table rendered server-side (static data, no client state needed)"
---

# Phase 02 Plan 01: Users Analytics Page — Summary

Built the Users Analytics page at `/admin/analytics/users` giving admins a full view of user composition, growth trends, and recent registrations — all in one place without navigating to the dashboard.

## What Was Built

### Task 1: Server-side data fetching (`app/admin/analytics/users/page.tsx`)

Seven parallel Supabase queries via `Promise.allSettled` + `getSupabaseService()`:

| Card | Query |
|------|-------|
| Total Members | profiles IN (student, teacher, wp, moderator, admin), exclude faux/robot |
| Teachers | profiles role=teacher, exclude faux/robot |
| Students | profiles role=student, exclude faux/robot |
| Wellness Practitioners | profiles role=wellness_practitioner, exclude faux/robot |
| Schools | schools status IN (active, approved) |
| Guests | profiles subscription_status=guest, exclude faux/robot |
| Fake/Test Users | profiles wp_roles contains faux OR robot (muted grey card) |

Recent signups: 10 latest real profiles ordered by created_at DESC with id, full_name, email, role, avatar_url, created_at.

Table renders: 32px avatar (with initials fallback), name linked to `/admin/users/{id}`, email (hidden on mobile), role badge with color coding per role, relative join date ("2 days ago").

### Task 2: Client component (`app/admin/analytics/users/UsersAnalyticsClient.tsx`)

Recharts area chart with:
- Time filter pills: 30D (default) | 90D | 6M | 1Y | YTD | All — right-aligned
- Role filter pills: All (default) | Teachers | Students | Wellness | Schools — left-aligned
- Active pill: `bg-[#1B3A5C] text-white`, inactive: `border border-[#E5E7EB] hover:bg-slate-50`
- Area stroke/gradient: GOYA primary blue `#345c83`, gradient opacity 0.15→0
- Tooltip: dark navy `#1B3A5C` background, white text, 8px border-radius
- Loading spinner and "No data for this period" empty state
- Reuses `getMemberGrowthData` from `app/admin/dashboard/actions.ts` — no duplicated logic

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

One minor proactive improvement:
- Used `id="usersGradient"` for the SVG gradient (plan implied same as dashboard). This avoids a visual glitch if both dashboard and analytics pages are rendered in the same browser context where SVG gradient IDs would collide.

## Verification

- `npx tsc --noEmit` — zero errors in new files (pre-existing `linkify-it` type errors are unrelated)
- page.tsx makes 7 parallel count queries + 1 signups query
- All real-user queries use `.not('wp_roles', 'cs', '{"faux"}').not('wp_roles', 'cs', '{"robot"}')`
- Fake/Test card uses `.or('wp_roles.cs.{"faux"},wp_roles.cs.{"robot"}')`
- UsersAnalyticsClient imports getMemberGrowthData from `@/app/admin/dashboard/actions`
- Chart color is `#345c83` throughout
- Filter pill defaults: 30D time, `all` role
- Recent signups name column links to `/admin/users/${user.id}`

## Requirements Satisfied

- USER-01: Stat cards show all role counts
- USER-02: Faux/robot users excluded from real counts, included in Fake/Test card
- USER-03: Area chart with cumulative member growth
- USER-04: Time filter pills (30D | 90D | 6M | 1Y | YTD | All), default 30D
- USER-05: Role filter pills (All | Teachers | Students | Wellness | Schools), default All
- USER-06: Recent signups table with 10 users, avatar, name, email, role badge, join date, admin link

## Self-Check: PASSED

Files exist:
- `app/admin/analytics/users/page.tsx` — FOUND
- `app/admin/analytics/users/UsersAnalyticsClient.tsx` — FOUND

Commit: `1aefde8` — FOUND
