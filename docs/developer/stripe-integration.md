---
title: Stripe Integration
audience: ["developer"]
section: developer
order: 8
last_updated: "2026-03-31"
---

# Stripe Integration

GOYA v2 uses Stripe for membership subscriptions, one-time purchases, and coupon management. The integration follows a write-partitioning pattern: Stripe is the source of truth, and a set of mirror tables in Supabase act as a local cache for fast querying.

## Table of Contents

- [Stripe SDK Singleton](#stripe-sdk-singleton)
- [Webhook Endpoint](#webhook-endpoint)
  - [HMAC Verification](#hmac-verification)
  - [Idempotency Gate](#idempotency-gate)
  - [Event Dispatch](#event-dispatch)
- [Event Handlers](#event-handlers)
- [Mirror Tables](#mirror-tables)
- [Write-Partitioning Pattern](#write-partitioning-pattern)
- [Cron: Pending Events](#cron-pending-events)
- [Admin Stripe Sync](#admin-stripe-sync)

---

## Stripe SDK Singleton

`lib/stripe/client.ts` exports a lazy `getStripe()` function. It imports `server-only` to prevent the Stripe SDK (and secret key) from ever reaching the browser bundle.

```ts
import 'server-only'
import Stripe from 'stripe'

export function getStripe(): Stripe {
  // initialised once, reused across requests in the same server instance
}
```

Configuration: `maxNetworkRetries: 3`, `timeout: 10000ms`.

**Never import `getStripe()` from a Client Component.** TypeScript will catch this via the `server-only` import.

---

## Webhook Endpoint

**Route:** `POST /api/webhooks/stripe`

This is the single entry point for all Stripe events. It is intentionally not under `/api/v1/` — it uses Stripe's own HMAC signature for authentication, not the GOYA API key system.

### HMAC Verification

The raw request body (as text) and the `stripe-signature` header are passed to:

```ts
event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
```

If signature verification fails, the handler returns `400` immediately. Never read `request.json()` before calling `constructEvent` — it must receive the raw body string.

### Idempotency Gate

Before processing, the handler inserts a row into `webhook_events` with `status: 'processing'`:

```ts
await supabase.from('webhook_events').insert({
  stripe_event_id: event.id,
  event_type: event.type,
  status: 'processing',
  payload: event,
})
```

If the insert returns a unique constraint violation (`code: '23505'`), the event is a duplicate — return `200` immediately without processing. This handles Stripe's at-least-once delivery guarantee.

### Event Dispatch

After the idempotency insert, the event is dispatched to the appropriate handler via a `switch` on `event.type`. The handler's return value determines the final `webhook_events.status`:

| Return | Final Status | Meaning |
|---|---|---|
| Returns normally | `processed` | Handler completed successfully |
| Returns `{ status: 'pending_cron' }` | `pending_cron` | Deferred to cron for retry |
| Throws | `failed` | Error message saved, `200` still returned to Stripe |

Stripe requires a `200` response even for events that fail processing — otherwise Stripe retries endlessly. Failures are handled asynchronously via the admin panel and cron.

---

## Event Handlers

One file per Stripe object type in `lib/stripe/handlers/`:

| File | Events Handled |
|---|---|
| `product.ts` | `product.created`, `product.updated`, `product.deleted` |
| `price.ts` | `price.created`, `price.updated`, `price.deleted` |
| `coupon.ts` | `coupon.created`, `coupon.updated`, `coupon.deleted` |
| `subscription.ts` | `customer.subscription.created`, `.updated`, `.deleted` |
| `payment-intent.ts` | `payment_intent.succeeded`, `.payment_failed` |
| `invoice.ts` | `invoice.paid`, `.payment_failed` |
| `checkout-session.ts` | `checkout.session.completed` |

Each handler receives the typed Stripe event object and performs upserts into the corresponding mirror table(s).

---

## Mirror Tables

Five tables mirror the Stripe data model:

| Table | Source | Key Column |
|---|---|---|
| `stripe_products` | `product.*` events | `stripe_id` (Stripe `prod_...`) |
| `stripe_prices` | `price.*` events | `stripe_id` (Stripe `price_...`) |
| `stripe_orders` | `payment_intent.*`, `subscription.*`, `invoice.*` | `stripe_id` |
| `stripe_coupons` | `coupon.*` events | `stripe_coupon_id` |
| `stripe_coupon_redemptions` | Checkout session events | Append-only |

**No explicit FK constraints between mirror tables.** Stripe webhooks can arrive out of order (e.g. a price event before its product event). FKs on text `stripe_id` columns would cause constraint violations for legitimate out-of-order delivery.

All mirror tables have an `updated_at` column maintained by a `BEFORE UPDATE` trigger, except `stripe_coupon_redemptions` which is append-only.

---

## Write-Partitioning Pattern

**Stripe = source of truth. Supabase = read cache.**

- **Never write prices or subscription status directly** to the Supabase mirror tables from application code.
- **Always mutate via Stripe API** (cancel subscription, apply coupon, etc.).
- The webhook will fire and update the mirror tables automatically.

This ensures the mirror is always consistent with Stripe and avoids race conditions from direct DB writes.

**Reading for UI:** Query `stripe_orders` and `stripe_products` directly for fast display. No Stripe API call needed for display.

**Example: checking a user's active subscription:**

```ts
const { data: order } = await supabase
  .from('stripe_orders')
  .select('subscription_status, current_period_end, cancel_at_period_end')
  .eq('user_id', userId)
  .eq('type', 'recurring')
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

---

## Cron: Pending Events

**Route:** `GET /api/cron/stripe-events` (runs every 5 minutes via Vercel cron)

Some events are set to `pending_cron` status when the handler cannot complete synchronously (e.g. a dependency hasn't been mirrored yet due to out-of-order delivery). The cron job retries these events.

The cron is protected by `CRON_SECRET` header validation.

---

## Admin Stripe Sync

**Route:** `POST /api/admin/stripe-sync`

A manual full-sync endpoint that pulls the current state of products, prices, and active subscriptions from the Stripe API and upserts them into the mirror tables. Used after initial setup or to recover from extended webhook downtime.

Only accessible to admins. Not exposed in the public API.

---

## See Also

- [database-schema.md](./database-schema.md) — Mirror table schemas and `webhook_events`
- [deployment.md](./deployment.md) — `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` env vars
- [api-reference.md](./api-reference.md) — The `/api/v1/webhooks/payment` external webhook endpoint (separate from the Stripe webhook)
