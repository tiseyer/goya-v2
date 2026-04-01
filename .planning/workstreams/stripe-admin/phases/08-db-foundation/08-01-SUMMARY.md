---
phase: 08-db-foundation
plan: 01
subsystem: database
tags: [stripe, postgres, supabase, migrations, rls, row-level-security]

# Dependency graph
requires: []
provides:
  - stripe_products table with RLS and updated_at trigger
  - stripe_prices table with RLS and updated_at trigger
  - stripe_orders table with RLS, updated_at trigger, and lookup indices
  - stripe_coupons table with RLS and updated_at trigger
  - stripe_coupon_redemptions table with RLS and lookup indices
affects: [09-webhook-processing, 10-initial-sync, 11-shop-products, 12-shop-orders, 13-shop-coupons, 14-shop-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Admin RLS sub-select: EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))"
    - "updated_at trigger reuse: EXECUTE FUNCTION update_updated_at_column()"
    - "IF NOT EXISTS guards on all CREATE TABLE statements"
    - "No cross-table FKs on stripe_id text columns — plain text columns for out-of-order webhook safety"

key-files:
  created:
    - supabase/migrations/20260340_stripe_tables.sql
  modified: []

key-decisions:
  - "Omit explicit FKs on stripe_product_id/stripe_price_id/stripe_customer_id text columns — out-of-order webhook delivery would cause FK violations during initial sync"
  - "stripe_coupon_redemptions has no updated_at column (append-only log) — trigger intentionally omitted"
  - "RLS policy and trigger defined immediately after each table — never enable RLS in one migration and add policy in another (Pitfall 2)"

patterns-established:
  - "Table block order: CREATE TABLE → ENABLE ROW LEVEL SECURITY → CREATE POLICY → CREATE TRIGGER"
  - "Admin-only RLS policy uses profiles sub-select, not is_admin() function (safe on non-profiles tables)"
  - "Lookup indices added after all table definitions at bottom of migration file"

requirements-completed: [DB-01]

# Metrics
duration: 4min
completed: 2026-03-23
---

# Phase 08 Plan 01: Stripe Entity Tables Summary

**5 Stripe mirror tables (stripe_products, stripe_prices, stripe_orders, stripe_coupons, stripe_coupon_redemptions) created in Supabase with admin/moderator RLS, updated_at triggers on 4 tables, and lookup indices — applied via npx supabase db push**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-23T14:28:26Z
- **Completed:** 2026-03-23T14:30:04Z
- **Tasks:** 1 of 1
- **Files modified:** 1

## Accomplishments

- Created migration `20260340_stripe_tables.sql` with all 5 Stripe entity tables matching exact schemas from research
- Applied RLS and admin/moderator-only policies on every table; enabled RLS and policy added in same migration (Pitfall 2 avoided)
- Added updated_at triggers on 4 tables (stripe_coupon_redemptions is append-only with no updated_at column)
- Added lookup indices on stripe_orders (customer_id, user_id, price_id) and stripe_coupon_redemptions (coupon_id, user_id)
- Migration applied successfully to live Supabase database via `npx supabase db push`

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Stripe entity tables migration** - `b240b29` (feat)

## Files Created/Modified

- `supabase/migrations/20260340_stripe_tables.sql` — 5 Stripe entity tables with RLS policies, updated_at triggers, and lookup indices; applied to live DB

## Decisions Made

- Omitted explicit FKs on stripe_product_id, stripe_price_id, stripe_customer_id text columns — Stripe webhook delivery order is not guaranteed; plain text columns avoid FK violations during out-of-order event delivery and initial sync
- stripe_coupon_redemptions intentionally has no updated_at column or trigger — it is an append-only redemption log, rows are never updated
- RLS policy added immediately after ENABLE ROW LEVEL SECURITY in the same migration — never separated across files to avoid default-deny lockout

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — migration applied cleanly on first run.

## User Setup Required

None — no external service configuration required. Migration was applied to live Supabase DB by the executor.

## Next Phase Readiness

- All 5 Stripe entity tables are live in Supabase and ready for webhook handlers (Phase 09)
- stripe_orders.user_id FK references auth.users(id) — webhook handlers can link orders to GOYA users by matching stripe_customer_id on profiles
- Existing 22 products have no stripe_product_id on public.products (bridge column added in Plan 02) — Phase 10 initial sync will populate it
- Plan 02 (08-02) covers webhook_events idempotency table and bridge columns (stripe_product_id on products, stripe_customer_id on profiles)

---
*Phase: 08-db-foundation*
*Completed: 2026-03-23*
