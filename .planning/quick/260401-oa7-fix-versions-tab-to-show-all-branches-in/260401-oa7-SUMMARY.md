---
phase: quick
plan: 260401-oa7
subsystem: admin-settings
tags: [vercel, deployments, versions-tab, ui]
tech-stack:
  added: []
  patterns: [parallel-fetch, deduplication-by-sha]
key-files:
  modified:
    - app/api/admin/deployments/route.ts
    - app/admin/settings/components/VersionsTab.tsx
decisions:
  - Production deployments take priority over preview when same commit SHA appears in both fetch results
  - Each branch prefers its production deployment as the representative (for correct URL in Open button)
metrics:
  duration: "~8 minutes"
  completed: "2026-04-01"
  tasks: 2
  files: 2
---

# Quick Task 260401-oa7: Fix Versions Tab to Show All Branches

**One-liner:** Dual-fetch Vercel API (preview + production) with SHA deduplication and environment badges on branch rows.

## What Was Done

The Versions tab Branches section only showed preview-deployed branches (develop, feature/*) because the API route only called the Vercel deployments endpoint without a `target` filter — which returns preview deployments. Production deployments (main branch) have `target=production` and were excluded.

### Task 1: API Route — Fetch Both Preview + Production

- Added `target: 'production' | 'preview'` field to the exported `Deployment` interface
- Replaced single fetch with `Promise.all` of two parallel Vercel API calls:
  - Default call (limit=50): returns preview deployments
  - `target=production` call (limit=10): returns production deployments
- Each array is mapped separately, setting the correct `target` value
- Results are merged into a `Map<string, Deployment>` keyed by `commitSha || url`
- Preview entries are written first; production entries overwrite preview entries for the same SHA (production takes priority)
- Final array is sorted by `createdAt` descending
- Graceful degradation: if one fetch fails, the other's results are still returned; only if both fail does the route return 502

### Task 2: VersionsTab UI — Environment Badges + Correct URLs

- Added `target: 'production' | 'preview'` field to `BranchGroup` interface
- Updated `branches` useMemo: for each branch, if any deployment has `target=production`, that deployment is used as `latestDeployment` (not just the first by time) — ensures the Open button links to the production URL for main
- Added environment badge in Branches section next to the branch name pill:
  - Production: blue badge (`bg-blue-100 text-blue-700`)
  - Preview: amber badge (`bg-amber-100 text-amber-700`)
- Added same environment badge in Deployments section next to each row's branch pill
- All existing behavior preserved: current branch highlight, sort order, feature branch warning

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 406ad9f | feat(260401-oa7): fetch both preview and production deployments in parallel |
| 2 | a85c9fa | feat(260401-oa7): show environment badges for all branches in Versions tab |

## Verification

- `npx tsc --noEmit` — no new errors introduced (2 pre-existing errors in Header.tsx unrelated to this task)
- Files modified: `app/api/admin/deployments/route.ts`, `app/admin/settings/components/VersionsTab.tsx`
- API returns `target` field on all deployments; main branch appears via production fetch
- Branches section shows all branches including main with blue production badge
- Open button on main branch links to production URL via `latestDeployment.url`

## Self-Check: PASSED

- [x] `app/api/admin/deployments/route.ts` — modified and committed (406ad9f)
- [x] `app/admin/settings/components/VersionsTab.tsx` — modified and committed (a85c9fa)
- [x] No new TypeScript errors introduced
