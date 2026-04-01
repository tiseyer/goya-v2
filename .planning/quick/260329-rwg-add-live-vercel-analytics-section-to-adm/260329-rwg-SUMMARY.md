---
phase: quick
plan: 260329-rwg
subsystem: admin-dashboard
tags: [analytics, vercel, admin, dashboard, polling]
dependency_graph:
  requires: []
  provides: [admin-analytics-section, analytics-api-proxy]
  affects: [app/admin/dashboard/page.tsx]
tech_stack:
  added: []
  patterns: [60s-polling-with-setInterval, server-proxy-to-vercel-api, role-guard-api-route]
key_files:
  created:
    - app/api/admin/analytics/route.ts
    - app/admin/dashboard/AnalyticsSection.tsx
  modified:
    - app/admin/dashboard/page.tsx
decisions:
  - "Summed timeseries data points for today vs last-7-days using two separate API calls to Vercel's internal timeseries endpoint"
  - "Used setInterval in useEffect for 60s polling rather than a polling library to keep dependencies minimal"
  - "Country code lookup implemented as a static object rather than an npm package (i18n-iso-countries) to avoid bundle overhead"
  - "Pre-existing build failure (migration/import-core missing) documented as out-of-scope deviation — TypeScript passes for all new files"
metrics:
  duration: "~12 min"
  completed: "2026-03-29"
  tasks: 2
  files: 3
---

# Quick Task 260329-rwg: Add Live Vercel Analytics Section to Admin Dashboard Summary

**One-liner:** Vercel internal analytics proxy API + client-side polling dashboard section showing visitors/page views (today + 7d), top 5 pages, and top 5 countries with 60s auto-refresh.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create analytics API route | 001ed8b | app/api/admin/analytics/route.ts |
| 2 | Create AnalyticsSection component + integrate | 1af9367 | app/admin/dashboard/AnalyticsSection.tsx, app/admin/dashboard/page.tsx |

## What Was Built

**`app/api/admin/analytics/route.ts`**
- Admin/moderator-only GET handler (401 if not authenticated, 403 if wrong role)
- Proxies Vercel internal analytics API: two timeseries calls (today + last 7 days), top pages, top countries
- All four calls run in parallel with `Promise.allSettled`
- 503 response if `VERCEL_ACCESS_TOKEN` or `VERCEL_PROJECT_ID` are missing
- Defensive optional chaining on all Vercel response fields — degrades to zeros rather than crash
- `Cache-Control: no-store` + `export const dynamic = 'force-dynamic'`

**`app/admin/dashboard/AnalyticsSection.tsx`**
- `'use client'` component fetching `/api/admin/analytics`
- `useEffect` + `setInterval` polling every 60 seconds; interval cleared on unmount
- Loading skeleton (animate-pulse cards), not-configured message (503), error banner with retry
- 4 stat cards matching existing `StatCard` visual style: Visitors Today, Visitors (7d), Page Views Today, Page Views (7d)
- Top Pages list (monospace path, visitor count right-aligned, numbered)
- Top Countries list (country code mapped to full name via static lookup, ~30 countries)
- Pulsing dot indicator when actively fetching; "Last updated: HH:MM:SS" timestamp
- Numbers formatted with `toLocaleString()` for comma separators

**`app/admin/dashboard/page.tsx`**
- Imported `AnalyticsSection` and inserted as Row 2 between "User Stats" and "Platform"

## Decisions Made

1. Two separate timeseries calls (today range + 7-day range) rather than one long call — matches how Vercel's dashboard queries the API
2. `Promise.allSettled` so partial failures don't block other data from rendering
3. Static country lookup object instead of an npm package to avoid bundle overhead
4. Polling with `setInterval` in `useEffect` — minimal and idiomatic for a dashboard with infrequent updates

## Deviations from Plan

### Pre-existing Issues (Out of Scope)

**1. [Pre-existing] next build fails due to missing migration/import-core module**
- **Found during:** Task 2 build verification
- **Issue:** `app/api/admin/migration/import/route.ts` imports `../../../../migration/import-core` which does not exist. This was confirmed pre-existing by running `git stash` and verifying the same failure without my changes.
- **Action:** Logged, not fixed. Out of scope per plan boundary rules.
- **Impact on this task:** Zero — TypeScript compiles cleanly for all files created/modified in this plan. The build failure is in an unrelated route.

No other deviations. Plan executed as specified.

## Known Stubs

None. The analytics section shows live data when env vars are configured, and a clear "not configured" message when they are not. No placeholder values flow to the UI unintentionally.

## Self-Check: PASSED

- app/api/admin/analytics/route.ts — FOUND
- app/admin/dashboard/AnalyticsSection.tsx — FOUND
- app/admin/dashboard/page.tsx (modified) — FOUND
- Commit 001ed8b — FOUND
- Commit 1af9367 — FOUND
