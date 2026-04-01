# Quick Task: Fix admin analytics — user data, visitors UX, shop redesign

**Task ID:** 260401-kfs
**Date:** 2026-04-01
**Status:** COMPLETE

## Task Description

Three admin analytics fixes:
1. User data queries returning 0 due to `.in('role', [...])` filter excluding NULL-role profiles
2. Visitors tab time range buttons missing cursor-pointer and loading state
3. Shop analytics visual redesign to match visitors/users page style

## Solution

### Issue 1 — User data queries
Removed `.in('role', ['student', 'teacher', 'wellness_practitioner', 'moderator', 'admin'])` filter from the `totalMembersRes` query in both `app/admin/dashboard/page.tsx` and `app/admin/analytics/users/page.tsx`. The filter was excluding all 5,800+ WordPress-migrated profiles with NULL role. Only the faux/robot exclusions are now kept. Changed default chart range from `'30D'` to `'All'` in MemberGrowthChart.tsx and UsersAnalyticsClient.tsx.

### Issue 2 — Visitors loading UX
Added `useTransition` to `VisitorsAnalyticsInner` in `VisitorsAnalyticsClient.tsx`. Wrapped `router.push` in `startTransition`. Added spinner + `opacity-40 pointer-events-none` content dim while `isPending`. Added `cursor-pointer` to all time range pill buttons.

### Issue 3 — Shop analytics redesign
- **AnalyticsFilters.tsx**: Replaced `<select>` dropdowns with pill buttons (same active/inactive style as visitors/users)
- **AnalyticsMetricCard.tsx**: `rounded-xl border-[#E5E7EB]` card, xs label, bold #1B3A5C value, chevron TrendBadge
- **AnalyticsCharts.tsx**: Replaced LineChart+CartesianGrid+Legend with AreaChart+gradient (#00B5A3 for revenue, #345c83 for orders), dark tooltip
- **page.tsx**: Updated title, subtitle, section headers to uppercase tracking-widest pattern, grid to lg:grid-cols-4

## Commits
- `7c4a7a1` — fix(260401-kfs): remove role filter from Total Members query, default charts to All range
- `2e569b7` — feat(260401-kfs): add cursor-pointer and useTransition loading state to visitors time range buttons
- `87e9814` — feat(260401-kfs): redesign shop analytics to match visitors/users visual style
