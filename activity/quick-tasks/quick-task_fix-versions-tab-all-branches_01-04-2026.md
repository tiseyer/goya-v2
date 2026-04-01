# Quick Task: Fix Versions Tab to Show All Branches

**Task ID:** 260401-oa7
**Date:** 2026-04-01
**Status:** DONE

## Task Description

The Versions tab Branches section only showed preview-deployed branches. The main branch (production) was missing because the API only fetched deployments without a `target` filter, which returns only preview deployments.

## Solution

1. **API route** (`app/api/admin/deployments/route.ts`): Added `target` field to `Deployment` interface. Made two parallel Vercel API calls — one for preview deployments (limit=50) and one for production deployments (limit=10, `target=production`). Merged results using a Map keyed by `commitSha`, with production taking priority on duplicate SHAs. Graceful degradation if one fetch fails.

2. **VersionsTab UI** (`app/admin/settings/components/VersionsTab.tsx`): Added `target` field to `BranchGroup`. Updated branch grouping to prefer the production deployment as the representative entry per branch (so Open button links to production URL for main). Added environment badges: blue for production, amber for preview — both in Branches section and Deployments section.

## Commits

- `406ad9f` — feat(260401-oa7): fetch both preview and production deployments in parallel
- `a85c9fa` — feat(260401-oa7): show environment badges for all branches in Versions tab
