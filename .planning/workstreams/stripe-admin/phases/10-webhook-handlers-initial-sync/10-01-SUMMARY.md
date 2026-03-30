---
phase: 10-webhook-handlers-initial-sync
plan: "01"
subsystem: stripe-webhooks
tags: [stripe, webhooks, supabase, handlers, tdd]
dependency_graph:
  requires: [08-01, 08-02, 09-01, 09-02]
  provides: [handleProduct, handlePrice, handleCoupon, pending_cron-status]
  affects: [stripe_products, stripe_prices, stripe_coupons, webhook_events]
tech_stack:
  added: []
  patterns: [TDD-red-green, upsert-idempotency, soft-delete-via-active-flag]
key_files:
  created:
    - supabase/migrations/20260343_webhook_events_pending_cron.sql
    - lib/stripe/handlers/product.ts
    - lib/stripe/handlers/price.ts
    - lib/stripe/handlers/coupon.ts
    - lib/stripe/handlers/product.test.ts
    - lib/stripe/handlers/price.test.ts
    - lib/stripe/handlers/coupon.test.ts
  modified: []
decisions:
  - "Coupon handler uses onConflict: 'stripe_coupon_id' (not 'stripe_id') — column is named stripe_coupon_id per schema"
  - "Deleted events set active=false (products/prices) or valid=false (coupons) rather than removing rows — idempotent soft-delete"
  - "price.type maps Stripe's 'one_time' value straight to DB 'one_time'; 'recurring' maps to 'recurring'"
metrics:
  duration: "3 min"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 7
---

# Phase 10 Plan 01: Product, Price, and Coupon Webhook Handlers Summary

**One-liner:** Three idempotent Stripe webhook handlers (product, price, coupon) upsert to Supabase mirror tables with soft-delete via active/valid flags, plus a migration adding pending_cron status.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Migration: add pending_cron status to webhook_events | de36c79 | supabase/migrations/20260343_webhook_events_pending_cron.sql |
| 2 | Product/Price/Coupon handlers + tests (TDD RED) | 03680d8 | 3 test files |
| 2 | Product/Price/Coupon handlers + tests (TDD GREEN) | 77f76ed | 3 handler files |

## What Was Built

### Migration (Task 1)
`supabase/migrations/20260343_webhook_events_pending_cron.sql` drops and recreates the `webhook_events_status_check` constraint to include `pending_cron` alongside the existing four status values. Applied to remote Supabase via `npx supabase db push`.

### Handler: product.ts
- Exports `handleProduct` accepting ProductCreated/Updated/Deleted events
- Upserts to `stripe_products` on conflict `stripe_id`
- Sets `active: false` for deleted events (soft-delete, not row removal)
- Throws `stripe_products upsert failed` on DB error

### Handler: price.ts
- Exports `handlePrice` accepting PriceCreated/Updated/Deleted events
- Maps `price.recurring?.interval` and `interval_count` for recurring prices; sets both to `null` for one-time prices
- Handles `price.product` as either string ID or expanded object
- Sets `active: false` for deleted events

### Handler: coupon.ts
- Exports `handleCoupon` accepting CouponCreated/Updated/Deleted events
- Uses `onConflict: 'stripe_coupon_id'` (CRITICAL: not `stripe_id` — column is named `stripe_coupon_id`)
- Maps `discount_type`: `percent` when `percent_off` set, `amount` when `amount_off` set
- Converts Unix `redeem_by` timestamp to ISO string
- Sets `valid: false` for deleted events

## Test Results

All 12 tests passing across 3 test files:
- `lib/stripe/handlers/product.test.ts` — 4 tests
- `lib/stripe/handlers/price.test.ts` — 4 tests
- `lib/stripe/handlers/coupon.test.ts` — 4 tests

## Verification

- `npx vitest run lib/stripe/handlers/` — 12/12 tests pass
- `grep "onConflict.*stripe_coupon_id" lib/stripe/handlers/coupon.ts` — confirmed
- `grep "from('stripe_products')" lib/stripe/handlers/product.ts` — confirmed
- `grep "server-only" lib/stripe/handlers/*.ts` — all 3 handlers import server-only
- Migration file contains all 5 status values including pending_cron

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all handlers are fully wired to Supabase via getSupabaseService().

## Self-Check: PASSED

Files exist:
- FOUND: supabase/migrations/20260343_webhook_events_pending_cron.sql
- FOUND: lib/stripe/handlers/product.ts
- FOUND: lib/stripe/handlers/price.ts
- FOUND: lib/stripe/handlers/coupon.ts
- FOUND: lib/stripe/handlers/product.test.ts
- FOUND: lib/stripe/handlers/price.test.ts
- FOUND: lib/stripe/handlers/coupon.test.ts

Commits exist:
- de36c79: feat(10-01): add pending_cron migration for webhook_events status check
- 03680d8: test(10-01): add failing tests for product, price, coupon handlers (TDD RED)
- 77f76ed: feat(10-01): implement product, price, coupon webhook handlers (TDD GREEN)
