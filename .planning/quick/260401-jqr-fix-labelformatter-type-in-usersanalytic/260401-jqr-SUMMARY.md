# Quick Task 260401-jqr: Fix labelFormatter type in UsersAnalyticsClient

**Status:** Complete
**Date:** 2026-04-01
**Commit:** 98eecf6

## What was done

Fixed Recharts Tooltip type errors in two files:
- `app/admin/analytics/users/UsersAnalyticsClient.tsx` — `labelFormatter` param `string` → `unknown`, `formatter` param `number` → `unknown`
- `app/admin/dashboard/MemberGrowthChart.tsx` — same fixes (identical pattern)

## Files changed

- `app/admin/analytics/users/UsersAnalyticsClient.tsx` (2 lines)
- `app/admin/dashboard/MemberGrowthChart.tsx` (2 lines)

## Notes

The project has many other pre-existing TS errors unrelated to this fix (events, courses, messaging types). This task only addressed the Recharts Tooltip type mismatches.
