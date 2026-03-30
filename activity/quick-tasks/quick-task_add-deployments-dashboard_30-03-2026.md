# Quick Task: Add Live Deployments Branch Switcher to Admin Dashboard

**Date:** 2026-03-30
**Status:** Done
**Quick ID:** 260330-mlx

## Task

Add a "Deployments" section to the admin dashboard showing current deployment info and a list of recent Vercel deployments with branch names, commit messages, and clickable URLs.

## Solution

1. **API Route** (`app/api/admin/deployments/route.ts`): Admin-only proxy to Vercel's `/v6/deployments` endpoint. Returns simplified deployment list with `isCurrent` flag based on `VERCEL_GIT_COMMIT_SHA` comparison. Handles missing env vars with 503.

2. **Client Component** (`app/admin/dashboard/DeploymentsSection.tsx`): Auto-refreshing (60s) section showing current deployment card (branch, SHA, environment) and recent deployments list. Each deployment links to its URL. Current deployment highlighted with teal accent.

3. **Dashboard Integration**: DeploymentsSection added after the System section in `app/admin/dashboard/page.tsx`.
