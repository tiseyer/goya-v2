# Quick Task 260401-nh4: Rename Deployments to Versions tab, add branches section

**Completed:** 2026-04-01
**Status:** Complete

## What Changed

- Renamed "Deployments" tab to "Versions" in admin System Settings
- Created `VersionsTab` component replacing `DeploymentsSection` with two sections:
  - **Branches**: Current branch display + all branches grouped from deployments, sorted with current first. Each branch shows latest commit, time, and "Open" button linking to preview URL.
  - **Deployments**: Current deployment card + recent deployments list (existing functionality preserved)
- Yellow warning banner when viewing a feature branch (not develop/main)
- Single Refresh button at top-right refreshes both sections
- API now fetches 50 deployments (was 10) to support branch grouping

## Files Changed

- `app/admin/settings/page.tsx` — Tab rename, import VersionsTab
- `app/admin/settings/components/VersionsTab.tsx` (new) — Full Versions tab with branches + deployments
- `app/api/admin/deployments/route.ts` — Increased limit from 10 to 50
