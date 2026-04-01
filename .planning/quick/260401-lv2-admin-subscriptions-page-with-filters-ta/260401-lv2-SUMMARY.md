---
phase: quick
plan: 260401-lv2
subsystem: admin-shop
tags: [admin, subscriptions, supabase-migration, rls, stripe]
dependency_graph:
  requires: [profiles table with stripe_customer_id, supabase service client]
  provides: [subscriptions table DDL, GET /api/v1/admin/subscriptions, /admin/shop/subscriptions page]
  affects: [AdminShell sidebar, lib/types.ts]
tech_stack:
  added: []
  patterns: [server-component-with-client-filters, supabase-service-query, rls-policies, url-param-filtering]
key_files:
  created:
    - supabase/migrations/20260401_create_subscriptions.sql
    - app/api/v1/admin/subscriptions/route.ts
    - app/admin/shop/subscriptions/page.tsx
    - app/admin/shop/subscriptions/SubscriptionsFilters.tsx
    - app/admin/shop/subscriptions/SubscriptionsTable.tsx
    - app/admin/shop/subscriptions/SubscriptionsPagination.tsx
    - activity/quick-tasks/quick-task_admin-subscriptions-page_01-04-2026.md
  modified:
    - lib/types.ts
    - app/admin/components/AdminShell.tsx
    - docs/admin/shop.md
    - public/docs/search-index.json
decisions:
  - "Used RawSubscription type cast (as any + typed array) to bypass stale Supabase generated types for new table — same pattern as other new tables pre-type-regen"
  - "API route uses req.nextUrl.searchParams (synchronous) not page-level searchParams prop — no await needed despite validator warnings"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-01"
  tasks_completed: 3
  files_created: 6
  files_modified: 4
---

# Quick Task 260401-lv2: Admin Subscriptions Page Summary

**One-liner:** Filterable, paginated admin subscriptions page under Shop with Supabase migration, RLS policies, and Stripe ID linking, matching the Orders page visual style exactly.

## What Was Built

### Task 1: Migration + Type + Sidebar (commit fec21bc)

- `supabase/migrations/20260401_create_subscriptions.sql` — subscriptions table with UUID PK, stripe_subscription_id unique constraint, status/interval CHECK constraints, 3 indexes, and RLS (admin full access + users read own)
- `lib/types.ts` — added `Subscription` interface
- `app/admin/components/AdminShell.tsx` — Subscriptions inserted as 2nd Shop child (Orders > Subscriptions > Products > Coupons)

### Task 2: API Route (commit 0924b1d)

- `app/api/v1/admin/subscriptions/route.ts` — GET handler with search, status, sort, date range, page, limit params; profiles join for customer names; search filter in JS

### Task 3: Page + Client Components (commit c6e612f)

- `app/admin/shop/subscriptions/page.tsx` — server component with Supabase query pattern matching orders page
- `app/admin/shop/subscriptions/SubscriptionsFilters.tsx` — debounced search, status dropdown (7 values), date range, sort selector; no price/type filters
- `app/admin/shop/subscriptions/SubscriptionsTable.tsx` — 7 columns: customer (name+email), plan+interval badge, status pill, amount, started, next payment (or "Cancels [date]"), Stripe ID link; empty state with descriptive message
- `app/admin/shop/subscriptions/SubscriptionsPagination.tsx` — prev/next, page size selector (25/50/100)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Supabase generated types don't include new subscriptions table**
- **Found during:** Task 2 TS check
- **Issue:** `supabase.from('subscriptions')` gives TS error because generated types haven't been regenerated since the new table migration
- **Fix:** Cast `supabase as any` and type the result explicitly as `RawSubscription[]` — consistent pattern used for other new tables
- **Files modified:** `app/api/v1/admin/subscriptions/route.ts`, `app/admin/shop/subscriptions/page.tsx`
- **Commit:** 0924b1d

**2. [Rule 1 - Bug] Linter reverted lib/types.ts and AdminShell.tsx edits after Task 1 commit**
- **Found during:** Task 2 start
- **Issue:** Post-commit hook (linter/formatter) reverted the Subscription interface and sidebar nav entry
- **Fix:** Re-applied both changes in Task 2 commit alongside the API route
- **Commit:** 0924b1d

## Known Stubs

None — the page queries live Supabase data. Empty state shows when no subscriptions exist, which is the correct behavior for a new table.

## Self-Check: PASSED

Files created:
- supabase/migrations/20260401_create_subscriptions.sql — FOUND
- app/api/v1/admin/subscriptions/route.ts — FOUND
- app/admin/shop/subscriptions/page.tsx — FOUND
- app/admin/shop/subscriptions/SubscriptionsFilters.tsx — FOUND
- app/admin/shop/subscriptions/SubscriptionsTable.tsx — FOUND
- app/admin/shop/subscriptions/SubscriptionsPagination.tsx — FOUND

Commits:
- fec21bc — Task 1: migration, type, sidebar
- 0924b1d — Task 2: API route
- c6e612f — Task 3: page + client components

TypeScript: `npx tsc --noEmit` passes with 0 errors after all tasks.
