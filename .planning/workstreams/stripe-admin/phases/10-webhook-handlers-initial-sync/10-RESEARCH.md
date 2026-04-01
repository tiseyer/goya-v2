# Phase 10: Webhook Handlers + Initial Sync — Research

**Researched:** 2026-03-24
**Domain:** Stripe webhook event handling, idempotent upserts, Supabase service-role writes, Vercel Cron queue processing, Stripe list API pagination
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-06 | All 15 Stripe event types handled: `product.created/updated/deleted`, `price.created/updated/deleted`, `payment_intent.succeeded/failed`, `customer.subscription.created/updated/deleted`, `invoice.paid/failed`, `coupon.created/updated/deleted` | Event-to-table mapping documented; handler file structure defined |
| DB-07 | Webhook handlers use idempotent upserts keyed on `stripe_id`; write-partitioning enforced (GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`) | `ON CONFLICT DO UPDATE SET` with explicit column exclusions; `webhook_events` INSERT ON CONFLICT skip pattern |
| DB-08 | Complex webhook events (subscription updates with side-effects) return 200 immediately after idempotency check; heavy side-effects processed via Vercel Cron polling `webhook_events` | Two-tier dispatch pattern: immediate upsert + deferred processing; cron pattern from existing `app/api/cron/admin-digest/route.ts` |
| DB-09 | Admin-triggered one-time sync seeds `stripe_products`, `stripe_prices`, and `stripe_coupons` from Stripe list API | `stripe.products.list()`, `stripe.prices.list()`, `stripe.coupons.list()` with `has_more` + `starting_after` cursor pagination |
</phase_requirements>

---

## Summary

Phase 10 wires the stub webhook handler from Phase 9 into 15 concrete event handlers and adds an admin-triggered initial sync route. The core pattern is: (1) insert the event ID into `webhook_events` with `ON CONFLICT DO NOTHING` — if the insert touches zero rows, return 200 immediately without processing; (2) for simple entity events (product, price, coupon) do the upsert inline and mark the event `processed`; (3) for complex events (subscription, invoice, payment_intent) complete the DB upsert inline but mark the event `pending_cron` so the Vercel Cron job picks up any email side-effects or downstream business logic.

Write-partitioning is the critical safety constraint: the `ON CONFLICT DO UPDATE SET` clause must enumerate every column Stripe owns and must omit `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`. This can never be `DO UPDATE SET *` or `DO UPDATE SET excluded.*`. The four GOYA-owned columns live on the `public.products` (legacy) table, not on `stripe_products` — the `stripe_products` table only mirrors Stripe fields and is safe to fully overwrite, but `public.products.stripe_product_id` is the bridge column that links them.

The initial sync route calls `stripe.products.list()`, `stripe.prices.list()`, and `stripe.coupons.list()` with cursor pagination (`has_more` + `starting_after`) and upserts each record using the same idempotent upsert pattern as the webhook handlers. This ensures the schema invariants are identical between real-time sync and backfill paths.

**Primary recommendation:** Structure handlers as pure TypeScript functions in `lib/stripe/handlers/` that accept a typed Stripe event object and return `{ ok: boolean; error?: string }`. The route file in `app/api/webhooks/stripe/route.ts` calls these functions after the idempotency check. The initial sync calls the same handler functions, bypassing the idempotency table (since events don't have IDs in list context).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | 20.4.1 (installed) | Stripe SDK — typed event objects, list APIs, pagination | Already installed in Phase 9; `getStripe()` singleton exists |
| `@supabase/supabase-js` | 2.95.2 (installed) | DB writes via service role client | `getSupabaseService()` singleton at `lib/supabase/service.ts` exists |
| `server-only` | 0.0.1 (installed) | Build-time guard for server-only modules | All handler files must import this |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vercel Cron | built-in | Poll `webhook_events` for `status = 'pending_cron'` rows | Complex events needing async side-effects (email, downstream sync) |
| vitest | 2.1.9 (installed) | Unit tests for handler functions | All handler functions have unit tests; existing test infra from Phase 9 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vercel Cron | Inngest / Trigger.dev | Locked decision — STATE.md: "Async webhook processing via Vercel Cron + webhook_events polling (not Inngest/Trigger.dev)" |
| Service role client | Anon key client | Service role bypasses RLS, required for webhook writes which have no authenticated user |

**Installation:** No new packages needed. All required dependencies were installed in Phase 8 and 9.

---

## Architecture Patterns

### Recommended Project Structure
```
lib/stripe/
├── client.ts               # existing — getStripe() singleton (Phase 9)
├── client.test.ts          # existing
├── handlers/
│   ├── product.ts          # handleProduct(event) — product.created/updated/deleted
│   ├── price.ts            # handlePrice(event) — price.created/updated/deleted
│   ├── subscription.ts     # handleSubscription(event) — customer.subscription.*
│   ├── payment-intent.ts   # handlePaymentIntent(event) — payment_intent.*
│   ├── invoice.ts          # handleInvoice(event) — invoice.*
│   ├── coupon.ts           # handleCoupon(event) — coupon.created/updated/deleted
│   ├── product.test.ts
│   ├── price.test.ts
│   ├── subscription.test.ts
│   ├── payment-intent.test.ts
│   ├── invoice.test.ts
│   └── coupon.test.ts
app/api/
├── webhooks/stripe/
│   └── route.ts            # existing Phase 9 stub — extended in Phase 10
├── admin/stripe-sync/
│   └── route.ts            # new — POST triggers one-time initial sync (DB-09)
```

### Pattern 1: Idempotency-First Dispatch

The route handler inserts the event ID before dispatching. This is the canonical Stripe idempotency pattern.

**What:** Insert `webhook_events` row with `ON CONFLICT DO NOTHING`. If `count === 0`, the event was already processed — return 200 immediately. If `count === 1`, dispatch and update status to `processed` or `failed`.

**When to use:** All 15 event types go through this gate. No event skips the idempotency check.

**Example (route.ts extension):**
```typescript
// Source: Stripe best practices — https://docs.stripe.com/webhooks/best-practices
// After constructEvent() succeeds:

const { data, error } = await getSupabaseService()
  .from('webhook_events')
  .insert({
    stripe_event_id: event.id,
    event_type: event.type,
    status: 'received',
    payload: event as unknown as Record<string, unknown>,
  })
  .select('id')

if (error?.code === '23505' || (data && data.length === 0)) {
  // Duplicate — already processed
  return NextResponse.json({ received: true }, { status: 200 })
}

// Dispatch to per-entity handler
await dispatchEvent(event)
```

**Critical detail:** Supabase `.insert()` with a UNIQUE violation returns an error with `code: '23505'` (PostgreSQL unique_violation). Check this code, not just the presence of an error object. Alternatively use `.upsert()` with `onConflict: 'stripe_event_id', ignoreDuplicates: true` and check `count`.

### Pattern 2: Write-Partitioned Upsert (DB-07)

**What:** `ON CONFLICT (stripe_id) DO UPDATE SET` must enumerate only Stripe-owned columns. GOYA-owned columns are never mentioned.

**When to use:** `stripe_products`, `stripe_prices`, `stripe_coupons` upserts. The `stripe_orders` table has no GOYA-owned columns so it can be fully overwritten on conflict.

**Example (product handler):**
```typescript
// Source: derived from stripe_products schema in 20260340_stripe_tables.sql
import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'

export async function handleProduct(
  event: Stripe.ProductCreatedEvent | Stripe.ProductUpdatedEvent | Stripe.ProductDeletedEvent
) {
  const product = event.data.object

  const { error } = await getSupabaseService()
    .from('stripe_products')
    .upsert(
      {
        stripe_id: product.id,
        name: product.name,
        description: product.description ?? null,
        active: product.active,
        images: product.images ?? [],
        metadata: (product.metadata as Record<string, string>) ?? {},
      },
      {
        onConflict: 'stripe_id',
        // No ignoreDuplicates — we want to update on conflict
      }
    )

  if (error) throw new Error(`stripe_products upsert failed: ${error.message}`)
}
```

**IMPORTANT:** `stripe_products` does NOT have GOYA-owned columns — those live on `public.products`. The write-partition constraint applies when a webhook handler would update `public.products` (via the bridge column `stripe_product_id`). When writing to `stripe_products`, all columns are Stripe-owned and safe to overwrite.

**The actual GOYA-owned columns and their table:**
- `public.products.priority` — GOYA owns, webhook never touches
- `public.products.requires_any_of` — GOYA owns, webhook never touches
- `public.products.hidden_if_has_any` — GOYA owns, webhook never touches
- `public.products.is_active` — GOYA owns, webhook never touches

Webhook handlers write to `stripe_products` (Stripe mirror table) only. They do NOT write to `public.products` in Phase 10. The bridge (`public.products.stripe_product_id`) is populated by the initial sync route (DB-09), not webhook handlers.

### Pattern 3: Deferred Processing via webhook_events (DB-08)

**What:** For `customer.subscription.*` and `invoice.paid` events that require side-effects (emails, profile updates, designation grants), the webhook handler completes the DB upsert immediately but sets `status = 'pending_cron'` in `webhook_events`. A Vercel Cron route polls for these rows.

**When to use:** Any event where the immediate upsert is insufficient — subscription renewals triggering email, invoice.paid triggering designation activation.

**Status lifecycle:**
```
received → processing → processed
                      → failed
received → processing → pending_cron  (complex events only)
                      → processed     (after cron picks up)
```

**Cron route pattern (from existing `app/api/cron/admin-digest/route.ts`):**
```typescript
// app/api/cron/stripe-events/route.ts
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Query webhook_events WHERE status = 'pending_cron' LIMIT 50
  // Process side-effects
  // Update status to 'processed' or 'failed'
}
```

**vercel.json addition:**
```json
{
  "path": "/api/cron/stripe-events",
  "schedule": "*/5 * * * *"
}
```

### Pattern 4: Stripe List API Pagination for Initial Sync (DB-09)

**What:** `stripe.products.list()`, `stripe.prices.list()`, `stripe.coupons.list()` all use cursor-based pagination. `has_more: true` means there are more pages; use the last object's `id` as `starting_after` for the next request.

**When to use:** The admin-triggered one-time sync route (`POST /api/admin/stripe-sync`).

**Example:**
```typescript
// Source: https://docs.stripe.com/api/products/list
async function syncProducts() {
  const stripe = getStripe()
  let hasMore = true
  let startingAfter: string | undefined = undefined

  while (hasMore) {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const product of page.data) {
      await getSupabaseService()
        .from('stripe_products')
        .upsert(
          {
            stripe_id: product.id,
            name: product.name,
            description: product.description ?? null,
            active: product.active,
            images: product.images ?? [],
            metadata: (product.metadata as Record<string, string>) ?? {},
          },
          { onConflict: 'stripe_id' }
        )
    }

    hasMore = page.has_more
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id
    }
  }
}
```

**Note:** `stripe.prices.list()` accepts an optional `product` filter to fetch prices for a specific product, but for initial sync call it without a filter to get all prices across all products.

**Idempotency during initial sync:** The initial sync does NOT use `webhook_events` — Stripe list API returns resources, not events. Use `upsert` with `onConflict: 'stripe_id'` directly. This means running initial sync multiple times is safe.

### Anti-Patterns to Avoid

- **`DO UPDATE SET *` or spreading all fields including GOYA-owned columns:** Always enumerate Stripe-owned fields explicitly.
- **Calling `request.json()` in the webhook route:** Already avoided in Phase 9 — `request.text()` is required. Don't break this when extending the route.
- **Using the anon key client for webhook writes:** Webhooks have no authenticated user. Always use `getSupabaseService()` (service role).
- **Inline processing of complex events without returning 200 first:** Subscription + invoice handlers must return 200 to Stripe before any slow side-effects. Use `pending_cron` status for deferral.
- **Forgetting to update `webhook_events.status` after processing:** A row stuck in `received` with no `processed_at` is indistinguishable from a failure. Always update to `processed` or `failed` with `processed_at = now()`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cursor pagination over Stripe list API | Custom offset/page logic | `has_more` + `starting_after` pattern | Stripe uses keyset pagination, not offset; offset would skip/duplicate records under concurrent mutations |
| Event deduplication | In-memory set or Redis cache | `webhook_events` table UNIQUE constraint (already built in Phase 8) | DB-level UNIQUE guarantees atomicity under concurrent retries; in-memory fails across serverless instances |
| Stripe event type checking | Custom string matching | TypeScript discriminated union on `event.type` — `Stripe.ProductCreatedEvent`, etc. | stripe@20.4.1 exports fully typed event objects per event type; use them |
| Subscription status mapping | Custom enum | Use Stripe's `subscription.status` values directly: `active`, `past_due`, `canceled`, etc. | These map 1:1 to `stripe_orders.subscription_status` column |

**Key insight:** All the hard idempotency plumbing was done in Phase 8 (`webhook_events` UNIQUE) and Phase 9 (signature verification). Phase 10 only needs to wire the existing table schemas to the existing SDK — no new infrastructure.

---

## Event-to-Table Mapping (DB-06)

All 15 events and their target tables:

| Event Type | Stripe Object | Target Table | Operation |
|------------|---------------|--------------|-----------|
| `product.created` | `Stripe.Product` | `stripe_products` | UPSERT on `stripe_id` |
| `product.updated` | `Stripe.Product` | `stripe_products` | UPSERT on `stripe_id` |
| `product.deleted` | `Stripe.Product` | `stripe_products` | UPSERT (set `active = false`) |
| `price.created` | `Stripe.Price` | `stripe_prices` | UPSERT on `stripe_id` |
| `price.updated` | `Stripe.Price` | `stripe_prices` | UPSERT on `stripe_id` |
| `price.deleted` | `Stripe.Price` | `stripe_prices` | UPSERT (set `active = false`) |
| `payment_intent.succeeded` | `Stripe.PaymentIntent` | `stripe_orders` | UPSERT on `stripe_id` (type=`one_time`) |
| `payment_intent.payment_failed` | `Stripe.PaymentIntent` | `stripe_orders` | UPSERT on `stripe_id` (update status) |
| `customer.subscription.created` | `Stripe.Subscription` | `stripe_orders` | UPSERT on `stripe_id` (type=`recurring`) |
| `customer.subscription.updated` | `Stripe.Subscription` | `stripe_orders` | UPSERT on `stripe_id`; set `pending_cron` |
| `customer.subscription.deleted` | `Stripe.Subscription` | `stripe_orders` | UPSERT on `stripe_id` (set canceled_at) |
| `invoice.paid` | `Stripe.Invoice` | `stripe_orders` | UPSERT on subscription_id / payment_intent_id; set `pending_cron` |
| `invoice.payment_failed` | `Stripe.Invoice` | `stripe_orders` | UPSERT on `stripe_id` |
| `coupon.created` | `Stripe.Coupon` | `stripe_coupons` | UPSERT on `stripe_coupon_id` |
| `coupon.updated` | `Stripe.Coupon` | `stripe_coupons` | UPSERT on `stripe_coupon_id` |
| `coupon.deleted` | `Stripe.Coupon` | `stripe_coupons` | UPSERT (set `valid = false`) |

**Notes on `stripe_orders`:**
- `payment_intent` events → `stripe_orders.type = 'one_time'`, `stripe_id = payment_intent.id`
- `customer.subscription` events → `stripe_orders.type = 'recurring'`, `stripe_id = subscription.id`
- `invoice` events → Invoices relate to subscriptions; `stripe_id = invoice.id`. The `stripe_orders` row is created/updated from subscription events; invoice events update the same row's payment status.
- `stripe_orders.stripe_id` must store the relevant Stripe entity ID — for subscriptions this is the subscription ID, for one-time payments this is the payment_intent ID.

**`stripe_coupons` note:** The table uses `stripe_coupon_id` (not `stripe_id`) as the unique key. The `upsert` call must use `onConflict: 'stripe_coupon_id'`.

---

## Supabase Upsert Patterns

### Service Role Client (required for webhook writes)
```typescript
import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'

// Upsert pattern — all webhook handlers use this
const { error } = await getSupabaseService()
  .from('stripe_products')
  .upsert(row, { onConflict: 'stripe_id' })

if (error) throw new Error(error.message)
```

### Detecting Duplicate Insert on webhook_events
```typescript
// Insert with ON CONFLICT DO NOTHING behavior:
const { data, error } = await getSupabaseService()
  .from('webhook_events')
  .insert({ stripe_event_id: event.id, event_type: event.type, status: 'received', payload: event })
  .select('id')

// Postgres unique_violation error code
if (error?.code === '23505') {
  return NextResponse.json({ received: true }) // already processed
}
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 })
}
```

### Updating Event Status
```typescript
await getSupabaseService()
  .from('webhook_events')
  .update({ status: 'processed', processed_at: new Date().toISOString() })
  .eq('stripe_event_id', event.id)
```

---

## Common Pitfalls

### Pitfall 1: Writing to `public.products` instead of `stripe_products`
**What goes wrong:** Webhook handler upserts to `public.products` (the GOYA products table) and overwrites `priority`, `requires_any_of`, `hidden_if_has_any`, or `is_active`.
**Why it happens:** Confusion between the two product tables — `stripe_products` is the Stripe mirror, `public.products` is the GOYA business table.
**How to avoid:** Webhook handlers in Phase 10 ONLY write to `stripe_products`, `stripe_prices`, `stripe_coupons`, and `stripe_orders`. They never touch `public.products` directly. The bridge (`public.products.stripe_product_id`) is populated by the admin initial sync route, not webhook handlers.
**Warning signs:** Test verifies that `public.products.priority` is unchanged after firing a `product.updated` webhook.

### Pitfall 2: Idempotency check race condition
**What goes wrong:** Two simultaneous Stripe deliveries of the same event both pass the idempotency check because the first INSERT hasn't committed yet.
**Why it happens:** INSERT + check-then-act pattern is not atomic.
**How to avoid:** The `webhook_events.stripe_event_id` UNIQUE constraint + PostgreSQL's transaction isolation handles this correctly. The second INSERT will block until the first commits, then fail with `23505`. This is why the UNIQUE constraint (built in Phase 8, migration `20260341_webhook_events.sql`) is the idempotency mechanism — not application-level checking.

### Pitfall 3: `stripe_coupons` uses `stripe_coupon_id` not `stripe_id`
**What goes wrong:** `upsert(..., { onConflict: 'stripe_id' })` fails because the column is named `stripe_coupon_id` on this table.
**Why it happens:** All other Stripe mirror tables use `stripe_id` as the unique key; `stripe_coupons` is the exception (confirmed from `20260340_stripe_tables.sql`).
**How to avoid:** Use `onConflict: 'stripe_coupon_id'` for the `stripe_coupons` table only.

### Pitfall 4: Invoice events — which `stripe_id` to use
**What goes wrong:** Invoice handler tries to upsert to `stripe_orders` using `invoice.id`, creating a duplicate row alongside an existing subscription row with `subscription.id`.
**Why it happens:** Invoices have their own Stripe ID but are payment records for a subscription. A subscription can have many invoices.
**How to avoid:** `invoice.paid` and `invoice.payment_failed` should update the existing `stripe_orders` row keyed on the subscription ID (via `invoice.subscription`), not create a new row keyed on the invoice ID. Alternatively, use `invoice.id` as the `stripe_id` for invoice-type order rows and set `stripe_id = invoice.id`. The schema supports either — but the team must pick one and document it. **Recommended:** Store invoice rows with `stripe_id = invoice.id` as supplementary payment records; the primary subscription row uses `stripe_id = subscription.id`.

### Pitfall 5: `stripe.prices.list()` default limit is 10
**What goes wrong:** Initial sync only imports 10 prices, silently ignoring the rest.
**Why it happens:** Stripe defaults to `limit: 10` for list calls.
**How to avoid:** Always set `limit: 100` (maximum) and loop with `has_more` / `starting_after`.

### Pitfall 6: Initial sync route lacks auth
**What goes wrong:** Anyone can trigger a full Stripe list + upsert, causing excessive Stripe API calls and DB load.
**Why it happens:** Forgetting to protect the admin sync endpoint.
**How to avoid:** The `POST /api/admin/stripe-sync` route must verify the caller is an admin using the service role client to check `profiles.role IN ('admin')`, or use Supabase session headers. This route is admin-only per the project's access model.

---

## Code Examples

### Dispatch switch in route.ts
```typescript
// Source: project pattern — extends Phase 9 route.ts stub
import { handleProduct } from '@/lib/stripe/handlers/product'
import { handlePrice } from '@/lib/stripe/handlers/price'
import { handleCoupon } from '@/lib/stripe/handlers/coupon'
import { handleSubscription } from '@/lib/stripe/handlers/subscription'
import { handlePaymentIntent } from '@/lib/stripe/handlers/payment-intent'
import { handleInvoice } from '@/lib/stripe/handlers/invoice'

async function dispatchEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'product.created':
    case 'product.updated':
    case 'product.deleted':
      await handleProduct(event)
      break
    case 'price.created':
    case 'price.updated':
    case 'price.deleted':
      await handlePrice(event)
      break
    case 'coupon.created':
    case 'coupon.updated':
    case 'coupon.deleted':
      await handleCoupon(event)
      break
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscription(event)
      break
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      await handlePaymentIntent(event)
      break
    case 'invoice.paid':
    case 'invoice.payment_failed':
      await handleInvoice(event)
      break
    default:
      // Unknown event type — log and ignore (do not throw)
      console.log(`[webhook] unhandled event type: ${event.type}`)
  }
}
```

### Vitest mock pattern for Supabase service (matches Phase 9 pattern)
```typescript
// Test file for product handler
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

const { handleProduct } = await import('@/lib/stripe/handlers/product')

describe('handleProduct', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts to stripe_products on product.created', async () => {
    const event = {
      type: 'product.created',
      data: { object: { id: 'prod_123', name: 'Test', active: true, images: [], metadata: {} } },
    } as unknown as Stripe.ProductCreatedEvent

    await handleProduct(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_products')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_id: 'prod_123', name: 'Test' }),
      { onConflict: 'stripe_id' }
    )
  })
})
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `stripe` npm package | All handlers, initial sync | Yes | 20.4.1 (installed) | — |
| `@supabase/supabase-js` | All DB writes | Yes | 2.95.2 (installed) | — |
| `vitest` | Tests | Yes | 2.1.9 (installed) | — |
| Stripe CLI | Manual testing of event firing | No | — | Use `stripe.events.retrieve()` on a real event ID from Stripe Dashboard, or write integration tests with mocked constructEvent |
| Vercel Cron | `pending_cron` processing | Yes (built-in to Vercel) | — | n/a — cron is declared in `vercel.json` which already has 2 cron entries |

**Missing dependencies with no fallback:**
- Stripe CLI is not installed locally. Stripe events cannot be replayed via `stripe trigger` in the development workflow. Manual testing must use the Stripe Dashboard test events or pre-constructed event payloads in vitest.

**Missing dependencies with fallback:**
- None blocking implementation — all npm packages installed, all tables exist.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 2.1.9 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run lib/stripe/handlers/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DB-06 | Each of 15 event types dispatched to correct handler | unit | `npx vitest run lib/stripe/handlers/` | No — Wave 0 |
| DB-07 | Upsert excludes GOYA-owned columns; `stripe_coupons` uses `stripe_coupon_id` conflict key | unit | `npx vitest run lib/stripe/handlers/` | No — Wave 0 |
| DB-08 | Duplicate event ID returns 200 without re-processing; `pending_cron` status set for complex events | unit | `npx vitest run app/api/webhooks/stripe/` | No — extend existing |
| DB-09 | Initial sync paginates all pages; upserts products, prices, coupons | unit | `npx vitest run app/api/admin/stripe-sync/` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/stripe/handlers/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/stripe/handlers/product.test.ts` — covers DB-06, DB-07 (product events)
- [ ] `lib/stripe/handlers/price.test.ts` — covers DB-06, DB-07 (price events)
- [ ] `lib/stripe/handlers/coupon.test.ts` — covers DB-06, DB-07 (coupon events; `stripe_coupon_id` conflict key)
- [ ] `lib/stripe/handlers/subscription.test.ts` — covers DB-06, DB-07, DB-08 (subscription + pending_cron)
- [ ] `lib/stripe/handlers/payment-intent.test.ts` — covers DB-06, DB-07 (payment_intent events)
- [ ] `lib/stripe/handlers/invoice.test.ts` — covers DB-06, DB-07, DB-08 (invoice + pending_cron)
- [ ] `app/api/admin/stripe-sync/route.test.ts` — covers DB-09 (pagination, upsert all three entities)
- [ ] `app/api/webhooks/stripe/route.test.ts` — extend existing 4 tests with idempotency cases (DB-07, DB-08)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous webhook processing (blocking response) | Return 200 first, queue heavy work | Stripe best practice (current) | Prevents Stripe retry storms during subscription renewal spikes |
| `webhooks.constructEvent()` with parsed JSON body | `request.text()` for raw body, then constructEvent | Always required — confirmed in Phase 9 | Signature verification requires exact bytes |
| Offset-based Stripe list pagination | Cursor-based `starting_after` + `has_more` | Always in Stripe API | Keyset pagination is correct for Stripe; offset does not exist |

---

## Open Questions

1. **Which `stripe_id` to use for invoice events on `stripe_orders`**
   - What we know: Invoices have their own Stripe ID (`in_xxx`). Subscriptions have their own ID (`sub_xxx`). An invoice relates to a subscription via `invoice.subscription`.
   - What's unclear: Should `stripe_orders` have one row per invoice or one row per subscription (with invoice IDs stored as metadata/separate rows)?
   - Recommendation: Create one `stripe_orders` row per subscription (keyed on subscription ID) and one additional row per invoice (keyed on invoice ID, with `stripe_id = invoice.id`). This gives Phase 12 (Orders admin) the flexibility to show both subscription lifecycle and individual payment records. The planner should make this a locked decision.

2. **Admin sync route authentication mechanism**
   - What we know: The route must be admin-only. The project uses Supabase auth + `profiles.role`.
   - What's unclear: Should it use a session cookie check (requiring `createServerClient` with cookie reading) or a pre-shared secret similar to how cron routes use `CRON_SECRET`?
   - Recommendation: Use `CRON_SECRET` style bearer token for the initial sync route. This avoids needing to set up SSR session parsing in what is essentially a one-shot admin tool. The planner should lock this.

3. **Vercel Cron schedule for `stripe-events` polling**
   - What we know: The Pro plan supports up to once per minute (`*/1 * * * *`). Current `vercel.json` has 2 cron jobs (under the 40-job Pro limit).
   - What's unclear: Is this project on a Pro Vercel plan?
   - Recommendation: Default to `*/5 * * * *` (every 5 minutes) which works on both Hobby and Pro. The planner should note this as a configurable parameter.

---

## Sources

### Primary (HIGH confidence)
- `supabase/migrations/20260340_stripe_tables.sql` — exact column names, unique constraints, GOYA-owned columns confirmed
- `supabase/migrations/20260341_webhook_events.sql` — `webhook_events` schema, status enum, UNIQUE on `stripe_event_id`
- `supabase/migrations/20260342_stripe_bridge_columns.sql` — bridge columns confirmed nullable
- `supabase/migrations/20260332_add_products_table.sql` — GOYA-owned columns (`priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`) confirmed on `public.products`
- `app/api/webhooks/stripe/route.ts` — Phase 9 stub confirmed; extension point is line 41
- `lib/supabase/service.ts` — `getSupabaseService()` singleton pattern confirmed
- `lib/stripe/client.ts` — `getStripe()` singleton confirmed
- `vercel.json` — existing 2 cron jobs confirmed; Pro-plan cron supported
- `.planning/workstreams/stripe-admin/STATE.md` — locked decisions confirmed (Vercel Cron, write-partitioning, no Inngest)

### Secondary (MEDIUM confidence)
- `https://docs.stripe.com/api/events/types` — all 15 event types and object types confirmed
- `https://docs.stripe.com/webhooks/best-practices` — idempotency-first pattern, return 200 before side-effects confirmed
- `https://docs.stripe.com/api/products/list` — `has_more` + `starting_after` cursor pagination confirmed
- `https://docs.stripe.com/api/subscriptions/object` — subscription status values, `current_period_*`, `cancel_at_period_end`, `canceled_at` fields confirmed

### Tertiary (LOW confidence)
- None — all claims backed by official docs or local codebase inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, versions verified via `npm view`
- Architecture: HIGH — schemas confirmed from migration files; patterns from existing cron/webhook routes
- Pitfalls: HIGH — derived from schema inspection (coupon conflict key) and Stripe docs (idempotency, pagination)
- Event mapping: HIGH — event types from official Stripe API docs; table mapping from Phase 8 schemas

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable Stripe API + established project patterns)
