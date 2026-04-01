# Quick Task: Add Live Deployments Section to Admin Dashboard

**Date:** 30-03-2026
**Status:** Done

## Task Description

Add a live Deployments section to the admin dashboard showing current deployment info (branch, commit SHA, environment) and a scrollable list of recent Vercel deployments with branch badges, commit messages, relative timestamps, and clickable URLs.

## Solution

**Files created/modified:**

- `app/api/admin/deployments/route.ts` — Admin-only API route that proxies the Vercel `/v6/deployments` endpoint, maps results to a simplified shape with an `isCurrent` flag (matched via `VERCEL_GIT_COMMIT_SHA`), and returns 503 when Vercel env vars are absent.
- `app/admin/dashboard/DeploymentsSection.tsx` — `'use client'` component following the AnalyticsSection pattern: 60s auto-refresh, loading skeleton, not-configured state, error+retry state, current deployment card with teal branch pill, and a recent-deployments list with per-row branch badges and `timeAgo` helper.
- `app/admin/dashboard/page.tsx` — Added `import DeploymentsSection` and rendered it as Row 5 after the System section.

**Key decisions:**
- `isCurrent` detection relies on `VERCEL_GIT_COMMIT_SHA` — false for all rows in local dev (no SHA set), which is expected.
- Entire deployment row is an `<a>` tag linking to the deployment URL in a new tab.
- Left border accent (`border-l-2 border-[#00B5A3]`) applied per row for current deployment highlight.
