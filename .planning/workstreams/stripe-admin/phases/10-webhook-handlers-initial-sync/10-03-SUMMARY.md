---
phase: 10-webhook-handlers-initial-sync
plan: "03"
subsystem: stripe-webhook
tags: [webhook, idempotency, cron, sync, stripe]
dependency_graph:
  requires:
    - 10-01: handler functions (product, price, coupon)
    - 10-02: handler functions (subscription, payment-intent, invoice) + HandlerResult type
    - 08-02: webhook_events table with stripe_event_id UNIQUE constraint
    - 08-01: stripe_products, stripe_prices, stripe_coupons tables
  provides:
    - Full webhook dispatch with idempotency gate (all 15 event types)
    - Vercel Cron handler for pending_cron events
    - Admin-triggered initial sync from Stripe list APIs
  affects:
    - app/api/webhooks/stripe/route.ts
    - app/api/cron/stripe-events/route.ts
    - app/api/admin/stripe-sync/route.ts
    - vercel.json
tech_stack:
  added: []
  patterns:
    - PostgreSQL 23505 unique_violation for idempotency gate
    - Stripe cursor pagination via has_more + starting_after
    - TDD (RED→GREEN) for stripe-sync route
key_files:
  created:
    - app/api/cron/stripe-events/route.ts
    - app/api/admin/stripe-sync/route.ts
    - app/api/admin/stripe-sync/route.test.ts
  modified:
    - app/api/webhooks/stripe/route.ts
    - app/api/webhooks/stripe/route.test.ts
    - vercel.json
decisions:
  - "Duplicate webhook detection uses PostgreSQL 23505 error code (not a SELECT-then-INSERT pattern) for atomicity"
  - "dispatchEvent function defined below POST export for clean separation of routing and dispatch logic"
  - "Simple handlers (product/price/coupon) return void; treated as processed status implicitly"
  - "Admin sync route uses same CRON_SECRET bearer pattern as admin-digest (not session auth) — manual trigger from CLI or admin"
  - "Cron route is a Phase 10 stub — marks pending_cron events processed without side-effects; full email/grant logic in later phases"
metrics:
  duration: "4 min"
  completed: "2026-03-24"
  tasks_completed: 3
  files_created: 3
  files_modified: 3
---

# Phase 10 Plan 03: Webhook Route Dispatch + Cron + Initial Sync Summary

**One-liner:** Idempotency gate with 23505 duplicate detection, 15-event dispatch switch, pending_cron Vercel Cron handler, and paginated Stripe list API sync with cursor pagination.

## What Was Built

### Task 1: Webhook Route Idempotency Gate + Dispatch

Extended `app/api/webhooks/stripe/route.ts` to replace the Phase 9 stub with:

- **Idempotency gate:** Insert into `webhook_events` before dispatch; return 200 on PostgreSQL error code `23505` (unique_violation) without re-processing
- **Error gate:** Return 500 on unexpected insert errors (misconfiguration, not duplicate)
- **Dispatch switch:** `dispatchEvent()` function covering all 15 event types across 6 handlers
- **Status update:** After dispatch, update `webhook_events.status` to `processed`, `pending_cron`, or `failed`
- **Handler error handling:** Catch exceptions from handlers, mark event `failed`, still return 200 to Stripe

Test file extended from 4 to 8 tests — all pass.

### Task 2: Cron Route + vercel.json

Created `app/api/cron/stripe-events/route.ts`:

- CRON_SECRET bearer token auth (matches admin-digest pattern)
- Query `webhook_events` for `status = 'pending_cron'`, ordered by `created_at`, limit 50
- Phase 10 stub: marks each event `processed` (side-effects implemented in later phases)
- Per-event error handling: marks failed events with `status: 'failed'` and `error_message`
- Returns `{ ok: true, processed: N }`

Updated `vercel.json` with third cron entry: `/api/cron/stripe-events` on `*/5 * * * *` schedule.

### Task 3: Admin Initial Sync Route (TDD)

Created `app/api/admin/stripe-sync/route.ts`:

- `import 'server-only'` guard
- CRON_SECRET bearer token auth (fails closed — rejects if CRON_SECRET unset)
- `syncProducts()`, `syncPrices()`, `syncCoupons()` — parallel execution via `Promise.all`
- Cursor pagination: `has_more + starting_after` loop with `limit: 100`
- `onConflict: 'stripe_id'` for products and prices
- `onConflict: 'stripe_coupon_id'` for coupons (critical — column name differs)
- Returns `{ ok: true, synced: { products, prices, coupons } }` with counts

7 tests covering auth rejection, per-entity sync verification, pagination, and count response — all pass.

## Decisions Made

1. **PostgreSQL 23505 for idempotency** — atomic single INSERT + check vs. SELECT-then-INSERT race condition avoidance
2. **dispatchEvent as named function** — keeps POST handler readable; TypeScript can't narrow Stripe.Event union in a switch without the function boundary
3. **Admin sync fails closed on missing CRON_SECRET** — unlike webhook route (which has a separate guard), sync requires the secret to be set
4. **Cron stub pattern** — pending_cron events are cleared immediately in Phase 10; Phase 11+ will add real side-effects (email sends, designation grants)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `app/api/cron/stripe-events/route.ts` lines 30-33: Side-effects for pending_cron events (emails, designation grants) are stubbed with `console.log`. Events are marked `processed` without actual side-effect execution. This is intentional for Phase 10 — resolved in Phase 11+.

## Self-Check: PASSED

Files created/modified:
- FOUND: app/api/webhooks/stripe/route.ts (modified)
- FOUND: app/api/webhooks/stripe/route.test.ts (modified)
- FOUND: app/api/cron/stripe-events/route.ts (created)
- FOUND: app/api/admin/stripe-sync/route.ts (created)
- FOUND: app/api/admin/stripe-sync/route.test.ts (created)
- FOUND: vercel.json (modified)

Commits:
- 595b424: feat(10-03): wire idempotency gate and 15-event dispatch into webhook route
- aef5b5e: feat(10-03): add cron route for pending_cron events and update vercel.json
- 4de522c: test(10-03): add failing tests for admin stripe-sync route (TDD RED)
- 8f679f6: feat(10-03): implement admin stripe-sync route with Stripe list API pagination

Test results: 8/8 webhook tests pass, 7/7 stripe-sync tests pass. Pre-existing `app/page.test.tsx` failures are unrelated to this plan.
