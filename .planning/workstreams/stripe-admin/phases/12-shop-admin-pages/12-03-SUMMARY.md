---
phase: 12-shop-admin-pages
plan: "03"
subsystem: admin-shop-orders
tags: [orders, admin, table, filters, bulk-actions, stripe]
dependency_graph:
  requires: [stripe_orders table, profiles table, stripe_coupons table, lib/supabase/service.ts]
  provides: [/admin/shop/orders page, OrdersTable, OrdersFilters, bulkOrderAction]
  affects: [admin shop navigation]
tech_stack:
  added: []
  patterns: [Server Component data fetch with JS merge, Client Component table with bulk select, useSearchParams filter pattern]
key_files:
  created:
    - app/admin/shop/orders/actions.ts
    - app/admin/shop/orders/page.tsx
    - app/admin/shop/orders/OrdersTable.tsx
    - app/admin/shop/orders/OrdersFilters.tsx
  modified:
    - lib/stripe/handlers/subscription.ts
decisions:
  - "Payment Method column shows dash since payment_method_type column does not exist in stripe_orders schema"
  - "Search across customer name/email done in JS post-merge since stripe_orders has no FK to profiles"
  - "Coupon lookup via metadata.coupon_id or metadata.discount_id fields"
  - "Reuse AdminUsersPagination component for pagination UI"
metrics:
  duration: "~15 min"
  completed_date: "2026-03-24"
  tasks_completed: 1
  files_created: 4
  files_modified: 1
---

# Phase 12 Plan 03: Orders List Page Summary

Orders admin page at /admin/shop/orders with filterable, searchable table and bulk archive/restore actions — all 9 required columns, profile join via stripe_customer_id, and server actions.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create Orders Server Actions and list page with table and filters | 9f55423 | actions.ts, page.tsx, OrdersTable.tsx, OrdersFilters.tsx |

## What Was Built

**actions.ts** — `'use server'` + `server-only` server action file with `bulkOrderAction(orderIds, action)` that updates `stripe_orders.status` to `'archived'` or `'active'` and revalidates the orders path.

**page.tsx** — Server Component that:
- Parses URL search params (search, type, status, dateFrom, dateTo, priceMin, priceMax, sort, page, pageSize)
- Queries `stripe_orders` with all applicable filters and sorting
- Joins profile data by collecting unique `stripe_customer_id` values then querying `profiles` table
- Looks up coupons from order metadata via `stripe_coupons` table
- Does JS-side search filter (cross-table search not possible without FK)
- Renders header with count, OrdersFilters (Suspense-wrapped), OrdersTable, AdminUsersPagination

**OrdersTable.tsx** — Client Component with:
- Checkbox column for per-row and select-all bulk selection
- All 9 required columns: Order #, Customer, Date/Time, Status (pill), Total, Payment Method (–), Recurring Total, Next Payment, Coupon
- Bulk action bar (appears when selection > 0) with Archive and Restore buttons
- `cancelAtPeriodEnd` shown as "Cancels {date}" in Next Payment column
- Status pills with color coding (succeeded=green, active=blue, failed=red, canceled=slate, archived=gray)
- Empty state with icon and "No orders found" message

**OrdersFilters.tsx** — Client Component with:
- Debounced (300ms) search input for customer name/email
- Type dropdown (All / One-time / Subscriptions)
- Status dropdown (All / Active / Succeeded / Failed / Canceled / Archived)
- Date range (From/To date inputs)
- Price range (Min/Max dollar amount inputs)
- Sort dropdown (Newest / Oldest / Amount High / Amount Low)
- Reset button clears all filters

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Stripe SDK breaking change for current_period fields**
- **Found during:** Task 1 — npx next build TypeScript check
- **Issue:** `lib/stripe/handlers/subscription.ts` accessed `sub.current_period_start` and `sub.current_period_end` directly on `Stripe.Subscription`, but newer Stripe SDK moved these fields to `Stripe.SubscriptionItem`
- **Fix:** Changed to read from `firstItem.current_period_start` / `firstItem.current_period_end` (nullable)
- **Files modified:** lib/stripe/handlers/subscription.ts
- **Commit:** 9f55423

## Known Stubs

- **Payment Method column** — always shows "–" (dash). The `payment_method_type` column does not exist on `stripe_orders` per the plan spec. This is intentional per ORD-01 note: "column can be added in a future phase."

## Self-Check: PASSED

Files created:
- [x] app/admin/shop/orders/actions.ts — exists
- [x] app/admin/shop/orders/page.tsx — exists
- [x] app/admin/shop/orders/OrdersTable.tsx — exists
- [x] app/admin/shop/orders/OrdersFilters.tsx — exists

Commit exists:
- [x] 9f55423 — verified

TypeScript compilation: PASSED (✓ Compiled successfully)
Build environment: supabaseUrl error at page data collection is a pre-existing env-var issue in the worktree build context, not caused by this plan.
