---
phase: quick
plan: 260401-kfs
subsystem: admin-analytics
tags: [analytics, dashboard, users, visitors, shop, ux, data-fix]
dependency_graph:
  requires: []
  provides: [accurate-member-counts, visitors-loading-ux, shop-analytics-redesign]
  affects: [admin/dashboard, admin/analytics/users, admin/analytics/visitors, admin/shop/analytics]
tech_stack:
  added: []
  patterns: [useTransition-for-router-push, AreaChart-gradient-fill, pill-button-filters]
key_files:
  created: []
  modified:
    - app/admin/dashboard/page.tsx
    - app/admin/analytics/users/page.tsx
    - app/admin/dashboard/MemberGrowthChart.tsx
    - app/admin/analytics/users/UsersAnalyticsClient.tsx
    - app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx
    - app/admin/shop/analytics/AnalyticsFilters.tsx
    - app/admin/shop/analytics/AnalyticsMetricCard.tsx
    - app/admin/shop/analytics/AnalyticsCharts.tsx
    - app/admin/shop/analytics/page.tsx
decisions:
  - "Remove .in('role',[...]) from Total Members query — NULL-role migrated WP profiles must be counted"
  - "Default growth chart range to 'All' so chart shows cumulative data on first load"
  - "useTransition wraps router.push in visitors range change — isPending drives spinner + opacity dim"
  - "Shop analytics pill-button filters use same key values as old selects (30d, 3mo, 6mo, custom)"
metrics:
  duration: 12m
  completed_date: "2026-04-01"
  tasks: 3
  files: 9
---

# Quick Task 260401-kfs Summary

**One-liner:** Fixed NULL-role member count exclusion, added useTransition loading state to visitors range pills, and redesigned shop analytics with AreaChart gradients and pill-button filters to match visitors/users visual style.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix user data queries — remove role filter, default chart to All | 7c4a7a1 | dashboard/page.tsx, analytics/users/page.tsx, MemberGrowthChart.tsx, UsersAnalyticsClient.tsx |
| 2 | Add cursor-pointer + useTransition loading state to visitors pills | 2e569b7 | VisitorsAnalyticsClient.tsx |
| 3 | Redesign shop analytics to match visitors/users style | 87e9814 | AnalyticsFilters.tsx, AnalyticsMetricCard.tsx, AnalyticsCharts.tsx, page.tsx |

## What Was Fixed

### Task 1 — User data queries
The `totalMembersRes` queries in both `dashboard/page.tsx` and `analytics/users/page.tsx` used `.in('role', ['student', 'teacher', ...])` which excludes profiles where `role IS NULL`. Since this is a WordPress-migrated database, most of the 5,800+ profiles have NULL role. The fix removes the `.in()` filter, keeping only the faux/robot exclusions. Role-specific cards (Teachers, Students, Wellness) retain their `.eq('role', ...)` filters unchanged.

The default `range` state in both growth chart components was changed from `'30D'` to `'All'` so the chart shows cumulative data on first load instead of an empty 30-day window with no new signups.

### Task 2 — Visitors loading UX
Added `useTransition` to `VisitorsAnalyticsInner`. The `handleRangeChange` function now wraps `router.push` in `startTransition`. When `isPending` is true: a spinner is shown below the filter pills, and the stats/chart/tables content area gets `opacity-40 pointer-events-none` to indicate loading. All time range buttons also gained `cursor-pointer`.

### Task 3 — Shop analytics redesign
- **AnalyticsFilters.tsx**: Replaced `<select>` dropdowns with pill buttons using the same `bg-[#1B3A5C]` active / `border-[#E5E7EB]` inactive pattern as visitors. Custom date inputs remain, shown inline when Custom is selected.
- **AnalyticsMetricCard.tsx**: Updated to `rounded-xl border-[#E5E7EB] shadow-sm` card, `text-xs text-[#6B7280]` label, `text-2xl font-bold text-[#1B3A5C]` value, chevron-SVG TrendBadge matching visitors.
- **AnalyticsCharts.tsx**: Replaced both `LineChart` + `CartesianGrid` + `Legend` with `AreaChart` + `linearGradient` fills. Revenue uses `#00B5A3` gradient; orders uses `#345c83`. Dark `#1B3A5C` tooltip on both.
- **page.tsx**: Title updated to "Shop Analytics" with subtitle, all section headers converted to `text-xs font-semibold text-[#6B7280] uppercase tracking-widest`, metric grids updated to `sm:grid-cols-3 lg:grid-cols-4`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- 7c4a7a1 exists: confirmed
- 2e569b7 exists: confirmed
- 87e9814 exists: confirmed
- All 9 modified files exist on disk: confirmed
- `npx tsc --noEmit` — 0 errors after all tasks
