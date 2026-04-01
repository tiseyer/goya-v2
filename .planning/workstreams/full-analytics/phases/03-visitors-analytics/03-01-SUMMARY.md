---
phase: 03-visitors-analytics
plan: "01"
subsystem: analytics
tags: [ga4, analytics, visitors, recharts, google-api]
dependency_graph:
  requires: []
  provides: [ga4-client, visitors-analytics-page]
  affects: [admin-analytics]
tech_stack:
  added: ["@google-analytics/data@^5.2.1"]
  patterns: [BetaAnalyticsDataClient, server-component-data-fetch, parallel-promise-all]
key_files:
  created:
    - lib/analytics/ga4.ts
    - app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx
  modified:
    - app/admin/analytics/visitors/page.tsx
    - package.json
decisions:
  - "Use BetaAnalyticsDataClient (not AnalyticsDataClient) — it exposes runReport"
  - "Bounce rate from GA4 is 0-1 float; multiply by 100 for display"
  - "GA4 date dimension returns YYYYMMDD; convert to YYYY-MM-DD for Date parsing"
  - "Wrap VisitorsAnalyticsInner in Suspense so useSearchParams does not bail out"
  - "Pass availability flags as props so client can show per-section error cards"
metrics:
  duration: "~20 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 03 Plan 01: Visitors Analytics with GA4 Integration — Summary

**One-liner:** GA4 Data API client with service account auth feeding a full visitor analytics dashboard (6 trend metrics, area chart, top pages/sources/countries/devices tables) with graceful unconfigured fallback.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | GA4 Data API client + package install | 763dd9e | lib/analytics/ga4.ts, package.json |
| 2 | Visitors page + client component | 3131224 | app/admin/analytics/visitors/page.tsx, VisitorsAnalyticsClient.tsx |

## What Was Built

### lib/analytics/ga4.ts

Core GA4 client library:
- `getGA4PropertyId()` — queries `site_settings` table for `ga4_property_id` key
- `getGA4Client()` — creates `BetaAnalyticsDataClient` from `GOOGLE_SERVICE_ACCOUNT_KEY` env var JSON
- `isGA4Configured()` — returns true only if both property ID and service account key exist
- `runGA4Report(options)` — generic report runner, maps options to GA4 API format, wraps in try/catch

### app/admin/analytics/visitors/page.tsx

Server component that:
1. Short-circuits to `<GA4Fallback />` if GA4 is not configured
2. Reads `range` searchParam (7d/30d/90d/6m, defaults to 30d)
3. Computes current + previous period date ranges
4. Runs 7 parallel `runGA4Report` calls via `Promise.all`
5. Computes trend percentages: `((current - previous) / previous * 100)`
6. Formats values (fmtNum for sessions/users, fmtDuration for seconds, fmtBounce for 0-1 rate)
7. Builds typed props and renders `<VisitorsAnalyticsClient />`

### app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx

Client component:
- Time filter pills (7D / 30D / 90D / 6M) — uses `router.push` to update searchParams, triggering server re-fetch
- Stats row: 6 cards (Sessions, Pageviews, Unique Users, Bounce Rate, Avg. Session, New Users) each with green/red trend badge
- Area chart: Recharts AreaChart with #345c83 gradient fill, dark tooltip — same pattern as MemberGrowthChart
- Tables: Top Pages (path/sessions/pageviews/avgTime), Traffic Sources (source/sessions/%total), Countries (country/sessions/%total)
- Devices: horizontal bar breakdown with percentage widths
- Each section degrades to a "Unable to load [name]" card if GA4 API returns null
- Wrapped in Suspense to satisfy Next.js CSR bailout requirement for `useSearchParams`

## Requirements Satisfied

- VIS-01: GA4 Data API client with service account auth
- VIS-02: 6 overview metric cards (Sessions, Pageviews, Unique Users, Bounce Rate, Avg Session, New Users)
- VIS-03: Trend indicators vs previous period for all 6 metrics
- VIS-04: Time filter pills (7D/30D/90D/6M), default 30D
- VIS-05: Area chart showing daily sessions over selected period
- VIS-06: Top Pages table (path, sessions, pageviews, avg time)
- VIS-07: Traffic Sources table (source/medium, sessions, % total)
- VIS-08: Countries table (country, sessions, % total)
- VIS-09: Devices breakdown (desktop/mobile/tablet) as horizontal bars
- VIS-10: Graceful fallback UI when GA4 not configured, with link to /admin/settings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Suspense wrapper for useSearchParams**
- **Found during:** Task 2
- **Issue:** Next.js requires `useSearchParams` to be inside a `<Suspense>` boundary to avoid CSR bailout
- **Fix:** Split client into `VisitorsAnalyticsInner` (uses hook) wrapped by exported `VisitorsAnalyticsClient` (provides Suspense)
- **Files modified:** VisitorsAnalyticsClient.tsx

**2. [Rule 2 - Missing] Per-section availability flags**
- **Found during:** Task 2
- **Issue:** Plan said "show error for that section" if GA4 returns null, but client received pre-computed data with no way to know if the API actually returned data vs empty array
- **Fix:** Added 6 boolean `*Available` props to client interface, passed from server based on whether `runGA4Report` returned null
- **Files modified:** page.tsx, VisitorsAnalyticsClient.tsx

## Known Stubs

None — all data is wired to live GA4 API calls. Empty states show "No data" when GA4 returns zero rows.

## Self-Check: PASSED
