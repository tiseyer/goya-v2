---
phase: quick
plan: 260330-mlx
subsystem: admin-dashboard
tags: [vercel, deployments, admin, dashboard]
dependency_graph:
  requires: []
  provides: [admin-deployments-section]
  affects: [app/admin/dashboard/page.tsx]
tech_stack:
  added: []
  patterns: [vercel-api-proxy, client-component-auto-refresh]
key_files:
  created:
    - app/api/admin/deployments/route.ts
    - app/admin/dashboard/DeploymentsSection.tsx
  modified:
    - app/admin/dashboard/page.tsx
decisions:
  - "isCurrent detection uses VERCEL_GIT_COMMIT_SHA env var comparison — works in Vercel prod; on dev both values empty so no row is highlighted"
  - "border-l-2 accent applied per row rather than via wrapper to preserve table-like list layout"
metrics:
  duration: 8min
  completed: 2026-03-30
  tasks_completed: 2
  files_changed: 3
---

# Quick Task 260330-mlx: Add Live Deployments Section to Admin Dashboard

**One-liner:** Vercel deployments proxy API + auto-refreshing admin dashboard section showing current deployment (branch/SHA/env) and recent deployment list with branch badges and relative timestamps.

## What Was Built

### `app/api/admin/deployments/route.ts`
Server-side API route (admin/moderator only) that proxies `GET /v6/deployments` from the Vercel API. Maps each deployment to a simplified `Deployment` shape with `url`, `branch`, `commitMessage`, `commitSha`, `createdAt` (ISO string), and `isCurrent` (matched against `VERCEL_GIT_COMMIT_SHA`). Returns `{ deployments, current: { branch, commitSha, environment } }` using Vercel's runtime env vars. Returns 503 when `VERCEL_ACCESS_TOKEN` or `VERCEL_PROJECT_ID` are absent.

### `app/admin/dashboard/DeploymentsSection.tsx`
Client component following the AnalyticsSection pattern exactly: `useState` for data/loading/error/notConfigured/lastUpdated/fetching, `useCallback` fetchData, `useEffect` with 60s auto-refresh interval. Renders:
- Current deployment card: branch pill (teal), short SHA badge, environment badge
- Recent deployments list: per-row branch pill (teal if current, slate if not), truncated commit message (60 chars), relative time helper (`Xm/Xh/Xd ago`), entire row links to deployment URL in new tab, current row gets `border-l-2 border-[#00B5A3]`
- Loading skeleton, not-configured, and error+retry states

### `app/admin/dashboard/page.tsx`
Added `import DeploymentsSection` and rendered `<DeploymentsSection />` inside a `<div className="mt-8">` after the System section (Row 5).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired to the live Vercel API. The `isCurrent` flag will be `false` for all rows in local development (VERCEL_GIT_COMMIT_SHA is empty), which is expected and acceptable.

## Self-Check: PASSED

- FOUND: app/api/admin/deployments/route.ts
- FOUND: app/admin/dashboard/DeploymentsSection.tsx
- FOUND: app/admin/dashboard/page.tsx (modified)
- Commit 3cbadf9 — Task 1 (API route + client component)
- Commit b024d68 — Task 2 (dashboard integration)
