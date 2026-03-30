---
phase: 08-db-foundation
plan: 02
subsystem: database
tags: [stripe, postgres, supabase, migrations, webhooks, idempotency, rls]

# Dependency graph
requires:
  - phase: 08-01
    provides: stripe_products, stripe_prices, stripe_orders, stripe_coupons, stripe_coupon_redemptions tables
provides:
  - webhook_events table with UNIQUE stripe_event_id for INSERT ON CONFLICT deduplication
  - products.stripe_product_id nullable text column with lookup index
  - profiles.stripe_customer_id nullable text column with lookup index
affects: [phase-09-webhook-processing, phase-10-initial-sync]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Idempotency via UNIQUE constraint + INSERT ON CONFLICT DO NOTHING (webhook deduplication)"
    - "Bridge column pattern: nullable text columns link GOYA tables to Stripe IDs without FK constraints"
    - "No updated_at on append-only tables (webhook_events rows are write-once/status-update-once)"
    - "UNIQUE constraint provides implicit B-tree index — no redundant CREATE INDEX on UNIQUE columns"

key-files:
  created:
    - supabase/migrations/20260341_webhook_events.sql
    - supabase/migrations/20260342_stripe_bridge_columns.sql
  modified: []

key-decisions:
  - "No CREATE INDEX on stripe_event_id — UNIQUE constraint already creates the B-tree index (avoids double index)"
  - "No updated_at on webhook_events — events are write-once; status changes are the only mutation, not general editing"
  - "Bridge columns are nullable with no DEFAULT — existing 22 products and all profiles have no Stripe IDs yet"
  - "IF NOT EXISTS on both ALTER TABLE and CREATE INDEX for idempotent migration reruns"

patterns-established:
  - "Idempotency pattern: webhook_events.stripe_event_id UNIQUE NOT NULL enables INSERT INTO ... ON CONFLICT (stripe_event_id) DO NOTHING in Phase 9 handler code"
  - "Bridge column pattern: products.stripe_product_id and profiles.stripe_customer_id are nullable text (no FK) — same rationale as 08-01 entity tables"

requirements-completed: [DB-02, DB-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 08 Plan 02: webhook_events Table + Stripe Bridge Columns Summary

**webhook_events idempotency table (UNIQUE stripe_event_id, RLS) and bridge columns (products.stripe_product_id, profiles.stripe_customer_id) applied to live Supabase via two migrations**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-23T14:13:24Z
- **Completed:** 2026-03-23T14:18:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- webhook_events table with stripe_event_id UNIQUE NOT NULL constraint enabling reliable webhook deduplication via INSERT ON CONFLICT DO NOTHING
- status CHECK constraint (`received/processing/processed/failed`) and RLS policy (admin/moderator only)
- products.stripe_product_id nullable text column with lookup index — ready for Phase 10 one-time Stripe provisioning sync
- profiles.stripe_customer_id nullable text column with lookup index — populated on first Stripe interaction

## Task Commits

Each task was committed atomically:

1. **Task 1: Create webhook_events idempotency table migration** - `57f9e7e` (feat)
2. **Task 2: Create bridge columns migration** - `5abadb2` (feat)

**Plan metadata:** (docs commit — added after SUMMARY creation)

## Files Created/Modified

- `supabase/migrations/20260341_webhook_events.sql` — webhook_events table, RLS policy, idempotency UNIQUE constraint
- `supabase/migrations/20260342_stripe_bridge_columns.sql` — stripe_product_id on products, stripe_customer_id on profiles, lookup indexes

## Decisions Made

- No `CREATE INDEX` on `stripe_event_id` — the `UNIQUE` constraint already creates a B-tree index; adding a second is wasteful (plan pitfall #4 from 08-RESEARCH.md)
- No `updated_at` column or trigger on webhook_events — events are write-once records; adding updated_at would imply general editability that does not exist here
- Bridge columns are nullable with no DEFAULT — existing 22 products have no Stripe IDs yet; null is the correct sentinel meaning "not yet synced to Stripe"

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required. Migrations applied directly via `npx supabase db push`.

## Next Phase Readiness

- Phase 9 (webhook processing) can now implement `INSERT INTO webhook_events (stripe_event_id, ...) ON CONFLICT (stripe_event_id) DO NOTHING` for all 12+ event types
- Phase 10 (initial sync) can populate `products.stripe_product_id` for existing 22 products once the provisioning strategy decision (lookup-by-name vs always-create-new) is resolved
- All 7 migration files from Phase 08 are applied and live in Supabase

## Self-Check: PASSED

- supabase/migrations/20260341_webhook_events.sql: FOUND
- supabase/migrations/20260342_stripe_bridge_columns.sql: FOUND
- .planning/workstreams/stripe-admin/phases/08-db-foundation/08-02-SUMMARY.md: FOUND
- Commit 57f9e7e (Task 1): FOUND
- Commit 5abadb2 (Task 2): FOUND

---
*Phase: 08-db-foundation*
*Completed: 2026-03-23*
