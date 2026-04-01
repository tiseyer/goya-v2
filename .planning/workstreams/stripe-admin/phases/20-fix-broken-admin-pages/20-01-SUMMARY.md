---
phase: 20-fix-broken-admin-pages
plan: "01"
subsystem: admin-pages
tags: [bug-fix, admin, pagination, supabase, analytics]
dependency_graph:
  requires:
    - lib/supabase/service.ts
    - app/admin/audit-log/AuditLogPagination.tsx
    - lib/analytics/metrics.ts
  provides:
    - app/admin/shop/orders/OrdersPagination.tsx
  affects:
    - app/admin/shop/orders/page.tsx
    - app/admin/audit-log/page.tsx
    - app/admin/shop/analytics/page.tsx
tech_stack:
  added: []
  patterns:
    - OrdersPagination follows AuditLogPagination pattern with route /admin/shop/orders
    - Service role client (getSupabaseService) for server-only admin queries bypassing RLS
    - (supabase as any) cast for tables absent from generated types
    - ?? 0 null-coalescing guards on all .toFixed() and .toLocaleString() calls on metric values
key_files:
  created:
    - app/admin/shop/orders/OrdersPagination.tsx
  modified:
    - app/admin/shop/orders/page.tsx
    - app/admin/audit-log/page.tsx
    - app/admin/shop/analytics/page.tsx
decisions:
  - audit_log table not in generated types — use (supabase as any) cast consistent with existing codebase pattern
  - audit-log also needed AuditLogFilters.tsx, AuditLogPagination.tsx, and export/route.ts committed (were untracked in main repo)
metrics:
  duration: 4 min
  completed_date: "2026-03-24"
  tasks_completed: 3
  files_changed: 5
---

# Phase 20 Plan 01: Fix Broken Admin Pages Summary

Fix three crashing admin pages by replacing wrong pagination component, switching to service role client, and adding null-safe arithmetic guards on metrics values.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create OrdersPagination.tsx + update orders/page.tsx | d102d65 |
| 2 | Switch audit-log to getSupabaseService (service role) | ddc2321 |
| 3 | Null-safe arithmetic on analytics page | ac2be9c |

## What Was Done

**Task 1 — Orders page pagination fix:**
Created `app/admin/shop/orders/OrdersPagination.tsx` modeled on `AuditLogPagination.tsx`, with route `/admin/shop/orders` and label "orders". Replaced `AdminUsersPagination` import and usage in `orders/page.tsx` — the old component hardcoded `/admin/users` navigation which was wrong for the orders page.

**Task 2 — Audit log service role fix:**
Replaced `createSupabaseServerClient()` (anon/session, subject to RLS) with `getSupabaseService()` (service role, bypasses RLS) in `app/admin/audit-log/page.tsx`. The `audit_log` table has RLS restricting reads to admins/moderators, so server rendering with the anon client failed when no session cookie was available. Also applied `(supabase as any)` cast since the `audit_log` table is absent from `types/supabase.ts`, and cast query result via `(data as unknown) as AuditRow[]` to resolve TypeScript overload errors — consistent with existing codebase patterns.

**Task 3 — Analytics page null-safety:**
Added `?? 0` null-coalescing guards to all `.toFixed()` and `.toLocaleString()` calls on `funnel.conversionRate` and `revenue.*` values in both the CSV data construction block (lines 144–163) and the JSX metric card rendering (lines 207–269). These calls ran outside the try/catch block, so NaN values from `computeFunnelMetrics`/`computeRevenueMetrics` would throw at render time causing the Vercel server error.

**FIX-05 confirmed:** `/admin/shop/products/page.tsx` already has a `+ Create Product` button at line 212. No change needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] audit_log table missing from generated Supabase types**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `supabase.from('audit_log')` fails TypeScript overload matching because `audit_log` is not in `types/supabase.ts`. Two errors: TS2769 on `.from()` and TS2352 on the result cast.
- **Fix:** Cast client via `(supabase as any)` and cast result via `(data as unknown) as AuditRow[]` — consistent pattern used throughout the codebase for unregistered tables.
- **Files modified:** `app/admin/audit-log/page.tsx`
- **Commit:** ddc2321

**2. [Rule 2 - Missing files] audit-log support files were untracked**
- **Found during:** Task 2 commit staging
- **Issue:** `AuditLogFilters.tsx`, `AuditLogPagination.tsx`, and `export/route.ts` existed on disk in the main repo but were never committed to git. The worktree branch lacked them entirely.
- **Fix:** Copied files from main repo to worktree, committed all four audit-log files together.
- **Files modified:** All files in `app/admin/audit-log/`
- **Commit:** ddc2321

## Known Stubs

None — all metric cards display real computed values. Data source is wired to Supabase queries.

## Self-Check: PASSED

All files verified present on disk. All commits verified in git log.
