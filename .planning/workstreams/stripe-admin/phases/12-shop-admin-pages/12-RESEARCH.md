# Phase 12: Shop Admin Pages — Research

**Researched:** 2026-03-24
**Domain:** Next.js 16 App Router admin UI — Stripe Products/Orders/Coupons management with dnd-kit drag-and-drop, Stripe Price immutability, Server Action pattern
**Confidence:** HIGH

---

## Summary

Phase 12 builds three full admin sections under `/admin/shop/`: Products, Orders, and Coupons. All three follow the established admin page pattern (Server Component page → Client Component table/filters), reading from Supabase Stripe-mirror tables and writing back to Stripe via Server Actions or Route Handlers.

The most architecturally complex requirements are (1) drag-and-drop product reordering using `@dnd-kit/sortable`, which is already declared as the project decision; (2) Stripe Price immutability — changing a price requires `stripe.prices.create()` + `stripe.prices.update({ active: false })` and then a local Supabase upsert; and (3) the order detail timeline, which must be assembled from `stripe_orders` + `webhook_events` rows since no separate timeline table exists.

The existing codebase already has all required infrastructure: Stripe mirror tables, the `products` table with GOYA-owned columns, the `stripe` SDK singleton, `getSupabaseService()`, and the `AdminShell` with Shop nav links. Phase 12 only adds page files and Server Actions — no new migrations needed for the base feature, though a `status` column gap in `stripe_coupons` needs resolving.

**Primary recommendation:** Build in three waves — Wave 1: Products (most complex: dnd-kit + price flow + visibility), Wave 2: Orders (read-heavy + refund/cancel actions), Wave 3: Coupons (Stripe create/edit + manual assignment). Each wave includes its list page, detail/edit page, and Server Actions.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROD-01 | Products table: Checkbox, Name, Price, Type, Status pill, Sales count | `stripe_products` + `stripe_prices` join; sales count from `stripe_orders` count |
| PROD-02 | Inline Status pill toggle (Published ↔ Draft; Deleted = soft-delete only) | `stripe_products.active` + GOYA `products.is_active`; Server Action for toggle |
| PROD-03 | Bulk status change + bulk delete | Checkbox state in Client Component; Server Action accepting array of IDs |
| PROD-04 | Drag-and-drop reorder → persists to `products.priority` | `@dnd-kit/sortable` — already project decision; optimistic update pattern |
| PROD-05 | Create product in Stripe → store `stripe_product_id` on `products` row | `stripe.products.create()` → upsert `stripe_products` → update `products.stripe_product_id` |
| PROD-06 | Edit Name, Description, Featured Image (pushed to Stripe), up to 5 images | `stripe.products.update()` for name/description/images; GOYA DB for extra images |
| PROD-07 | More Options: Statement Descriptor, Unit Label, Metadata k/v, Marketing Features | `stripe.products.update({ statement_descriptor, unit_label, metadata, marketing_features })` |
| PROD-08 | Price change = new Stripe Price + archive old | `stripe.prices.create()` + `stripe.prices.update(oldId, { active: false })`; never `update amount` |
| PROD-09 | Visibility config: "Show to" / "Don't show to" searchable lists → `requires_any_of` / `hidden_if_has_any` | Existing `productVisibility.ts` logic; Server Action to `UPDATE products SET requires_any_of, hidden_if_has_any` |
| PROD-10 | Stripe sync status indicator (last synced / "Out of sync") | `stripe_products.updated_at` vs `products.updated_at`; simple timestamp comparison |
| PROD-11 | Soft-delete: sets status = Deleted; row remains visible | `stripe_products.active = false` + custom `status` tracking; see schema gap note below |
| ORD-01 | Orders table: Checkbox, Order #, Customer Name, Date/Time, Status, Total, Payment Method, Recurring Total, Next Payment, Coupon | Join `stripe_orders` + `profiles` on `stripe_customer_id` + `stripe_customer_id` on `profiles.stripe_customer_id` |
| ORD-02 | Filter by type / date range / status / price range; search by name or email | URL searchParam pattern (same as Users page); debounced search Client Component |
| ORD-03 | Bulk status change / bulk move to trash | Same bulk pattern as Products |
| ORD-04 | Manually create order: select product + existing GOYA user | `stripe.paymentIntents.create()` or `stripe.subscriptions.create()`; write to `stripe_orders` |
| ORD-05 | Full or partial refund from order detail | `stripe.refunds.create({ payment_intent, amount? })`; webhook will update `stripe_orders` |
| ORD-06 | Cancel subscription: schedule (period end) or immediate | `stripe.subscriptions.update(id, { cancel_at_period_end: true })` vs `stripe.subscriptions.cancel(id)` |
| ORD-07 | Chronological Stripe event timeline on order detail | Query `webhook_events` WHERE `stripe_event_id` contains order's stripe_id in payload; order by `created_at` |
| ORD-08 | Customer info, product/user quick links, customer journey (all orders from same customer) | Join `profiles` + `stripe_orders` by `stripe_customer_id`; link to `/admin/users/[id]` and `/admin/shop/products/[id]` |
| ORD-09 | Resend invoice email + download invoice PDF | `stripe.invoices.sendInvoice(invoiceId)` + `stripe.invoices.retrieve(id)` → `invoice_pdf` URL |
| CPN-01 | Coupons table: Name, Code, Type, Discount, Usage count, Expiry, Status | `stripe_coupons` table; `times_redeemed` already synced by webhook |
| CPN-02 | Create coupon with all options | `stripe.coupons.create()` → if code provided: `stripe.promotionCodes.create({ coupon })` → upsert both IDs |
| CPN-03 | Edit coupon → sync to Stripe; store both `stripe_coupon_id` and `stripe_promotion_code_id` | `stripe.coupons.update()` (limited fields); `stripe_promotion_code_id` column already in schema |
| CPN-04 | Manually assign coupon to specific user | Insert into `stripe_coupon_redemptions` with user_id + stripe_coupon_id; optionally apply via `stripe.customers.createSource` or invoice item with coupon |
| CPN-05 | Coupon detail: redemption history list | Query `stripe_coupon_redemptions` JOIN `profiles` on `user_id`; JOIN `stripe_orders` on `stripe_order_id` |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | 6.3.1 | Drag context, sensors, collision detection | Project decision (react-beautiful-dnd archived) |
| `@dnd-kit/sortable` | 10.0.0 | Sortable list abstraction over dnd-kit/core | Simplest API for vertical list reorder |
| `@dnd-kit/utilities` | 3.2.2 | CSS transform helpers (`CSS.Transform.toString`) | Required companion for sortable |
| `stripe` | 20.4.1 | Stripe API calls (already installed) | Already in use; server-only singleton at `lib/stripe/client.ts` |
| `@supabase/supabase-js` | 2.95.2 | DB reads/writes (already installed) | Project standard |
| `server-only` | 0.0.1 | Guard for server modules (already installed) | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/cache` → `revalidatePath` | built-in | Bust Server Component cache after mutations | After every Server Action that writes |
| `date-fns` | 4.1.0 | Format timestamps in timeline + tables | Already installed; use `format`, `formatDistanceToNow` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@dnd-kit/sortable` | `react-beautiful-dnd` | react-beautiful-dnd is archived; dnd-kit is the successor |
| Server Actions | Route Handlers for mutations | Server Actions integrate with `useTransition` for pending states; Route Handlers are fine too — use whichever is consistent with existing code (existing code uses Route Handlers like `api/admin/stripe-sync`) |

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Version verification:** Confirmed against npm registry 2026-03-24.
- `@dnd-kit/core` latest: 6.3.1
- `@dnd-kit/sortable` latest: 10.0.0
- `@dnd-kit/utilities` latest: 3.2.2

---

## Architecture Patterns

### Recommended Project Structure

```
app/admin/shop/
├── products/
│   ├── page.tsx                    # Server Component: list page with Supabase query
│   ├── ProductsTable.tsx           # Client Component: dnd-kit table + inline toggles
│   ├── ProductsFilters.tsx         # Client Component: filter bar (URL searchParams)
│   ├── [id]/
│   │   ├── page.tsx                # Server Component: product detail / edit form
│   │   └── ProductEditForm.tsx     # Client Component: form with Stripe sync status
│   └── actions.ts                  # Server Actions: toggleStatus, bulkDelete, reorder, createProduct, editProduct, archivePrice
├── orders/
│   ├── page.tsx                    # Server Component: orders list
│   ├── OrdersTable.tsx             # Client Component: table
│   ├── OrdersFilters.tsx           # Client Component: filter bar
│   └── [id]/
│       ├── page.tsx                # Server Component: order detail
│       ├── OrderTimeline.tsx       # Client Component: Stripe event timeline
│       └── actions.ts             # Server Actions: refund, cancelSubscription, resendInvoice
└── coupons/
    ├── page.tsx                    # Server Component: coupons list
    ├── CouponsTable.tsx            # Client Component: table
    └── [id]/
        ├── page.tsx               # Server Component: coupon detail + redemption history
        ├── CouponForm.tsx         # Client Component: create/edit form
        └── actions.ts            # Server Actions: createCoupon, editCoupon, assignCoupon
```

### Pattern 1: Server Component → Client Component Split (established project pattern)

**What:** Page is a Server Component that fetches data and passes `initialData` to a Client Component for interactive UI.
**When to use:** All three list pages and all detail pages.
**Example (from `app/admin/users/page.tsx` pattern):**
```typescript
// app/admin/shop/products/page.tsx (Server Component)
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import ProductsTable from './ProductsTable'

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: products } = await supabase
    .from('stripe_products')
    .select(`
      *,
      stripe_prices(*)
    `)
    .order('active', { ascending: false })

  return <ProductsTable initialProducts={products ?? []} />
}
```

### Pattern 2: URL SearchParams for Filters (established project pattern)

**What:** Filters stored as URL search params; Client Component reads `useSearchParams()`, updates via `router.replace()`.
**When to use:** Orders filter bar (type, date range, status, price range, search).
**Example (from `app/admin/users/AdminUsersFilters.tsx`):**
```typescript
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

function updateParam(key: string, value: string) {
  const params = new URLSearchParams(searchParams.toString())
  value ? params.set(key, value) : params.delete(key)
  params.set('page', '1')
  startTransition(() => router.replace(`/admin/shop/orders?${params.toString()}`))
}
```

### Pattern 3: dnd-kit Sortable List

**What:** Wrap list in `<DndContext>`, wrap each row in `<SortableContext>`, use `useSortable` hook per item.
**When to use:** PROD-04 — drag-and-drop product reorder.

```typescript
// Source: @dnd-kit/sortable documentation
'use client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// In the table row component:
function SortableProductRow({ product }: { product: StripeProduct }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: product.id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <button {...attributes} {...listeners} className="cursor-grab">
          {/* drag handle icon */}
        </button>
      </td>
      {/* ... rest of row */}
    </tr>
  )
}

// In the parent table:
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (active.id !== over?.id) {
    setProducts(items => {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over!.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }
}
```

**Persistence:** After drag end, call a Server Action that does individual Supabase updates for each `products` row setting `priority` = index + 1. Update the GOYA `products` table (not `stripe_products`) since `priority` is a GOYA-owned column.

### Pattern 4: Stripe Price Immutability (PROD-08)

**What:** Stripe Prices cannot have their amount changed. The correct flow is: create new Price → archive old Price.
**When to use:** Any product price edit.

```typescript
// app/admin/shop/products/actions.ts (Server Action)
'use server'
import 'server-only'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function updateProductPrice(
  stripeProductId: string,
  oldPriceId: string,
  newAmountCents: number,
  currency: string,
  type: 'one_time' | 'recurring',
  interval?: 'month' | 'year'
) {
  const stripe = getStripe()

  // 1. Create new price
  const newPrice = await stripe.prices.create({
    product: stripeProductId,
    unit_amount: newAmountCents,
    currency,
    ...(type === 'recurring' ? { recurring: { interval: interval! } } : {}),
  })

  // 2. Archive old price
  await stripe.prices.update(oldPriceId, { active: false })

  // 3. Upsert new price into Supabase (webhook will also arrive but idempotency handles it)
  await getSupabaseService().from('stripe_prices').upsert(
    {
      stripe_id: newPrice.id,
      stripe_product_id: stripeProductId,
      currency: newPrice.currency,
      unit_amount: newPrice.unit_amount,
      type: newPrice.type === 'recurring' ? 'recurring' : 'one_time',
      interval: newPrice.recurring?.interval ?? null,
      active: true,
    },
    { onConflict: 'stripe_id' }
  )

  // 4. Mark old price inactive in Supabase
  await getSupabaseService()
    .from('stripe_prices')
    .update({ active: false })
    .eq('stripe_id', oldPriceId)

  revalidatePath('/admin/shop/products')
}
```

### Pattern 5: Stripe Coupon + Promotion Code Create (CPN-02/CPN-03)

**What:** Coupons and promotion codes are separate Stripe objects. When the admin provides a public code, create both.
**When to use:** CPN-02 (create) and CPN-03 (edit).

```typescript
// Creating a coupon with an optional public code
const coupon = await stripe.coupons.create({
  name: internalName,
  percent_off: percentOff ?? undefined,
  amount_off: amountOff ?? undefined,
  currency: amountOff ? 'usd' : undefined,
  duration: 'once' | 'forever' | 'repeating',
  max_redemptions: maxRedemptions || undefined,
  redeem_by: expiryDate ? Math.floor(new Date(expiryDate).getTime() / 1000) : undefined,
})

let promotionCodeId: string | null = null
if (publicCode) {
  const promoCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: publicCode,
  })
  promotionCodeId = promoCode.id
}

// Store both IDs in stripe_coupons
await getSupabaseService().from('stripe_coupons').upsert({
  stripe_coupon_id: coupon.id,
  stripe_promotion_code_id: promotionCodeId,
  // ... other fields
}, { onConflict: 'stripe_coupon_id' })
```

### Pattern 6: Subscription Cancel (ORD-06)

```typescript
// Schedule cancellation (cancel at period end)
await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })

// Immediate cancellation
await stripe.subscriptions.cancel(subscriptionId)
```

### Pattern 7: Refund (ORD-05)

```typescript
// Full refund
await stripe.refunds.create({ payment_intent: paymentIntentId })

// Partial refund
await stripe.refunds.create({ payment_intent: paymentIntentId, amount: amountCents })
```

### Pattern 8: Order Timeline Assembly (ORD-07)

The `webhook_events` table stores each Stripe event with its `stripe_event_id` and raw payload. For a given order, query events whose payload references the order's `stripe_id`:

```typescript
// From Supabase: fetch webhook events where payload contains the order's stripe_id
const { data: events } = await supabase
  .from('webhook_events')
  .select('event_type, created_at, payload')
  .contains('payload', { id: stripeOrderId })  // JSONB contains
  .order('created_at', { ascending: true })
```

Alternatively, filter by `event_type` patterns known to relate to the order type. For subscriptions, the subscription ID appears in most event payloads.

### Anti-Patterns to Avoid

- **Calling `stripe.prices.update()` with a new `unit_amount`**: Not supported by Stripe API — amounts are immutable on prices. The edit form must prevent this at the UI level (disable the amount field on existing prices).
- **Writing to Stripe-owned columns in GOYA mutations**: Write-partitioning is a locked decision. Server Actions that update `products.priority`, `products.requires_any_of`, `products.hidden_if_has_any`, `products.is_active` must write to the GOYA `products` table, not `stripe_products`.
- **Importing `getStripe()` in Client Components**: Throws a build error (server-only guard). All Stripe API calls must be in Server Actions or Route Handlers.
- **Mutating `stripe_coupon_redemptions`**: This table is append-only. Never UPDATE rows — only INSERT.
- **Hardcoding `shopOpen` toggle state**: Already noted in STATE.md decisions — this is acceptable for Phase 12 (generic group state map deferred).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder | Custom `mousedown`/`mousemove` handlers | `@dnd-kit/sortable` | Handles accessibility, keyboard nav, scroll containers, touch events |
| Array reorder after drag | Manual splice logic | `arrayMove` from `@dnd-kit/sortable` | Correct index math already handled |
| Price immutability | In-place amount edit field | New Price + archive old | Stripe rejects `prices.update` with `unit_amount` |
| Promotion code ↔ coupon link | Custom join table | `stripe_promotion_code_id` column already on `stripe_coupons` | Already in schema from Phase 8 |
| Subscription cancel-at-period-end | Custom scheduling cron | `stripe.subscriptions.update({ cancel_at_period_end: true })` | Stripe handles the timing |

**Key insight:** Stripe handles all billing lifecycle — the GOYA admin is a thin UI that dispatches the right Stripe API call and waits for the webhook to confirm the state change.

---

## Common Pitfalls

### Pitfall 1: Price Amount Edit Field Not Guarded

**What goes wrong:** Admin edits price amount in the same field as existing prices. The Server Action calls `stripe.prices.update()` with `unit_amount`, which Stripe rejects with a 400.
**Why it happens:** The edit form naively uses one `<input>` for both create and edit scenarios.
**How to avoid:** On the edit form, render the amount field as read-only when editing an existing price. Add a separate "Change Price" workflow that explicitly creates a new price.
**Warning signs:** `Stripe error: You cannot change the price of a subscription to a product with a different price.` or `400 Bad Request` from Stripe prices endpoint.

### Pitfall 2: dnd-kit `@dnd-kit/sortable` v10 API Changes

**What goes wrong:** Code written for older dnd-kit versions may not compile against v10.
**Why it happens:** `@dnd-kit/sortable` 10.0.0 was released in 2024 with breaking changes from v9.
**How to avoid:** Install the exact versions verified above. Confirm `useSortable` returns `setNodeRef`, `attributes`, `listeners`, `transform`, `transition` — these are stable across v6-10. Do not use deprecated `DragOverlay` imperative APIs.
**Warning signs:** TypeScript errors on `useSortable` return type.

### Pitfall 3: Write-Partitioning Violation

**What goes wrong:** A Server Action that "saves product edits" accidentally overwrites `priority`, `requires_any_of`, or `hidden_if_has_any` with empty values because it does a blanket `stripe_products` update.
**Why it happens:** Forgetting that GOYA-owned columns live on the GOYA `products` table, not `stripe_products`.
**How to avoid:** Always update GOYA-owned columns via `supabase.from('products').update({...}).eq('stripe_product_id', stripeId)`. Update Stripe-owned data via `stripe.products.update()` and let the webhook sync it to `stripe_products`.
**Warning signs:** Visibility rules stop working after a product edit.

### Pitfall 4: `stripe_customer_id` Join Missing for Orders Table

**What goes wrong:** Orders table can't show Customer Name because `stripe_orders` has `stripe_customer_id` (Stripe string) but not `user_id` for all rows.
**Why it happens:** `user_id` is populated by the subscription handler when `customer` is a string, but payment intent events may not include `user_id`. The join must go through `profiles.stripe_customer_id`.
**How to avoid:** Join `stripe_orders` to `profiles` via `stripe_customer_id = profiles.stripe_customer_id`. This requires the `profiles.stripe_customer_id` bridge column (DB-03 migration) to be populated. For orders with no matching profile, show "Unknown Customer".
**Warning signs:** Empty customer names across all orders.

### Pitfall 5: `webhook_events` Timeline Query Performance

**What goes wrong:** Querying `webhook_events` with a JSONB `@>` (contains) filter is slow on large tables without a GIN index.
**Why it happens:** Phase 8 did not add a GIN index on `webhook_events.payload`.
**How to avoid:** For Phase 12, the timeline approach should filter by `event_type` IN list + `created_at` window rather than scanning full payload. This is faster and sufficient for displaying the 5–10 most relevant events. Alternatively, the planner may include a migration to add `GIN index on payload`.
**Warning signs:** Order detail page loads slowly when `webhook_events` table grows.

### Pitfall 6: Coupon `discount_type: 'free_product'` Has No Stripe Equivalent

**What goes wrong:** The `stripe_coupons` schema has `discount_type` CHECK `('percent', 'amount', 'free_product')` but Stripe's Coupon API only supports `percent_off` and `amount_off`.
**Why it happens:** `free_product` is a GOYA-level concept not directly representable in Stripe's coupon model.
**How to avoid:** For CPN-02 create form, `Free Product` type means a 100% off coupon in Stripe. The Server Action translates: `percent_off: 100`. Store `discount_type: 'free_product'` in Supabase for display purposes.
**Warning signs:** Stripe 400 error when creating coupon with unsupported field.

---

## Schema Reference

### GOYA `products` table (GOYA-owned columns)

```
id                uuid PK
slug              text UNIQUE
name              text
full_name         text
category          text CHECK (teacher_designation | experienced_teacher | school_designation | special)
price_display     text
price_cents       integer
image_path        text
description       text
features          jsonb
requires_any_of   text[]   ← PROD-09 "Show to"
hidden_if_has_any text[]   ← PROD-09 "Don't show to"
has_variants      boolean
variants          jsonb
priority          integer  ← PROD-04 drag-and-drop
is_active         boolean  ← PROD-02 Published/Draft toggle
stripe_product_id text     ← bridge column (from migration 20260342)
created_at        timestamptz
updated_at        timestamptz
```

### `stripe_products` table (Stripe-owned, webhook-written)

```
id          uuid PK
stripe_id   text UNIQUE
name        text
description text
active      boolean  ← reflects Stripe active state
images      text[]
metadata    jsonb
created_at  timestamptz
updated_at  timestamptz
```

Note: `stripe_products` has no `status` column distinguishing Published/Draft/Deleted. Status must be derived: `active=true AND products.is_active=true` → Published; `active=true AND products.is_active=false` → Draft; `active=false` → Deleted (soft). The planner must account for this derived status logic in PROD-01/PROD-02/PROD-11.

### `stripe_orders` table

```
id                    uuid PK
stripe_id             text UNIQUE        ← payment_intent ID or subscription ID
stripe_customer_id    text               ← join key to profiles.stripe_customer_id
stripe_price_id       text
stripe_product_id     text
user_id               uuid (nullable)
amount_total          integer            ← cents
currency              text
status                text               ← Stripe status string
type                  text CHECK (one_time | recurring)
subscription_status   text
cancel_at_period_end  boolean
current_period_start  timestamptz
current_period_end    timestamptz
canceled_at           timestamptz
metadata              jsonb
stripe_event_id       text
created_at            timestamptz
updated_at            timestamptz
```

Note: `payment_method` is NOT in the schema — ORD-01 requires "Payment Method" column. The planner must decide: (a) add a `payment_method_type` column via migration + populate from webhook, or (b) omit it in Phase 12 and show "–". This is a **gap that needs a plan decision**.

### `stripe_coupons` table

```
id                        uuid PK
stripe_coupon_id          text UNIQUE
stripe_promotion_code_id  text UNIQUE (nullable)
name                      text
code                      text (nullable)         ← the public promo code string
discount_type             text CHECK (percent | amount | free_product)
percent_off               numeric(5,2)
amount_off                integer
currency                  text
duration                  text CHECK (forever | once | repeating)
duration_in_months        integer
max_redemptions           integer
times_redeemed            integer
redeem_by                 timestamptz
valid                     boolean
metadata                  jsonb
created_at                timestamptz
updated_at                timestamptz
```

Note: CPN-01 requires a "Status" column. `valid` boolean serves as status (true=active, false=expired/deleted). The planner should use `valid` as the status display source.

### `stripe_coupon_redemptions` table (append-only)

```
id               uuid PK
stripe_coupon_id text
stripe_order_id  text
user_id          uuid (nullable)
redeemed_at      timestamptz
```

---

## Code Examples

### Drag-and-drop persistence to `products.priority`

```typescript
// Server Action — called after drag end
'use server'
import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function reorderProducts(orderedIds: string[]) {
  // orderedIds is the new order of stripe_products.id values
  // Must look up stripe_product_id → products.id mapping
  const supabase = getSupabaseService()

  await Promise.all(
    orderedIds.map((stripeProductId, index) =>
      supabase
        .from('products')
        .update({ priority: index + 1 })
        .eq('stripe_product_id', stripeProductId)
    )
  )

  revalidatePath('/admin/shop/products')
}
```

### Inline status toggle (PROD-02)

```typescript
'use server'
export async function toggleProductStatus(
  productId: string,         // GOYA products.id
  stripeProductId: string,   // stripe_products.stripe_id
  newIsActive: boolean
) {
  // Update GOYA-owned column
  await getSupabaseService()
    .from('products')
    .update({ is_active: newIsActive })
    .eq('id', productId)

  // Sync to Stripe
  await getStripe().products.update(stripeProductId, { active: newIsActive })

  revalidatePath('/admin/shop/products')
}
```

### Order list query (ORD-01/ORD-02)

```typescript
// In Server Component, with filters from searchParams
const { data: orders } = await supabase
  .from('stripe_orders')
  .select(`
    id,
    stripe_id,
    amount_total,
    currency,
    status,
    type,
    subscription_status,
    cancel_at_period_end,
    current_period_end,
    created_at,
    stripe_customer_id,
    stripe_product_id,
    metadata
  `)
  .order('created_at', { ascending: false })
  .range(from, to)

// Join with profiles separately (no FK, must do manual join or use RPC)
const customerIds = orders?.map(o => o.stripe_customer_id).filter(Boolean) ?? []
const { data: profiles } = await supabase
  .from('profiles')
  .select('stripe_customer_id, full_name, email')
  .in('stripe_customer_id', customerIds)
```

---

## Open Questions

1. **`payment_method` column for ORD-01**
   - What we know: `stripe_orders` has no `payment_method_type` column; Stripe sends it on `payment_intent.succeeded` events
   - What's unclear: Whether to add a migration now or show "–" in Phase 12
   - Recommendation: Planner should add a migration adding `payment_method_type text` to `stripe_orders` and populate it from the payment intent handler's metadata, OR defer and show "–" — explicit decision needed before Task 1 of the Orders wave

2. **Manual order creation (ORD-04) via Stripe**
   - What we know: `stripe.paymentIntents.create()` works for one-time; `stripe.subscriptions.create()` works for recurring; both require a valid Stripe `customer` ID on the user
   - What's unclear: If the user has no `stripe_customer_id` yet, must we create a Stripe customer first
   - Recommendation: Create a Stripe customer if missing (`stripe.customers.create({ email })` → update `profiles.stripe_customer_id`), then create the payment intent or subscription

3. **Product → `products` table join for Products list (PROD-01)**
   - What we know: `stripe_products` and `products` are linked via `products.stripe_product_id`. Some products may have no `stripe_product_id` yet (the 22 existing products before Phase 9 provisioning script).
   - What's unclear: Should the products list show ONLY Stripe-synced products (from `stripe_products`) or ALL products (from `products`)?
   - Recommendation: Show ALL products from the `products` table and LEFT JOIN `stripe_products` on `stripe_product_id`. Products without a Stripe link show a "Not synced" indicator (satisfies PROD-10).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| `@dnd-kit/core` | PROD-04 drag-and-drop | NOT INSTALLED | — | Must install |
| `@dnd-kit/sortable` | PROD-04 drag-and-drop | NOT INSTALLED | — | Must install |
| `@dnd-kit/utilities` | PROD-04 drag-and-drop | NOT INSTALLED | — | Must install |
| `stripe` SDK | All Stripe API calls | ✓ | 20.4.1 | — |
| `STRIPE_SECRET_KEY` | Stripe API calls | ✓ (Phase 9 verified) | — | — |
| Supabase tables | All pages | ✓ | Phases 8-10 | — |

**Missing dependencies with no fallback:**
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — must be installed before PROD-04 implementation. Wave 0 should include `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PROD-08 | New Stripe Price created on amount change; old price archived | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "archivePrice"` | ❌ Wave 0 |
| PROD-09 | Visibility arrays saved to `products` table only (not `stripe_products`) | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "visibility"` | ❌ Wave 0 |
| ORD-05 | Refund calls `stripe.refunds.create` with correct amount | unit | `npx vitest run app/admin/shop/orders/actions.test.ts -t "refund"` | ❌ Wave 0 |
| ORD-06 | Schedule cancel sets `cancel_at_period_end: true`; immediate cancel calls `subscriptions.cancel` | unit | `npx vitest run app/admin/shop/orders/actions.test.ts -t "cancel"` | ❌ Wave 0 |
| CPN-02 | Coupon create stores both `stripe_coupon_id` and `stripe_promotion_code_id` | unit | `npx vitest run app/admin/shop/coupons/actions.test.ts -t "createCoupon"` | ❌ Wave 0 |
| PROD-04 | `reorderProducts` writes `priority` to GOYA `products` table | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "reorder"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run app/admin/shop`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `app/admin/shop/products/actions.test.ts` — covers PROD-08, PROD-09, PROD-04
- [ ] `app/admin/shop/orders/actions.test.ts` — covers ORD-05, ORD-06
- [ ] `app/admin/shop/coupons/actions.test.ts` — covers CPN-02
- [ ] `test/__mocks__/stripe.ts` — Stripe SDK mock (all tests need this)

Existing test infrastructure (Vitest + jsdom + `test/__mocks__/server-only.ts`) is sufficient — no new framework setup needed.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md was not found in the working directory. Constraints are sourced from `STATE.md` decisions and `PROJECT.md`.

**Enforced constraints from STATE.md (locked decisions):**

1. **Write-partitioning**: Stripe owns payment/billing fields; GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`
2. **`@dnd-kit` for drag-and-drop** (react-beautiful-dnd is archived)
3. **USD only** for v1.2
4. **No `stripe.prices.update()` with a new amount** — create new Price + archive old
5. **No `@stripe/stripe-js` or `@stripe/react-stripe-js`** in scope
6. **Admin + Moderator only** for Shop admin
7. **Server-only guard** on all Stripe imports

**Tech stack constraints from PROJECT.md:**

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase SSR — no new frameworks
- Follow existing design tokens from `globals.css` and components from `app/components/ui/`
- Match existing Admin page layout exactly (table in white card, `rounded-2xl border border-[#E5E7EB]`, header pattern)

---

## Sources

### Primary (HIGH confidence)

- Codebase direct inspection — `supabase/migrations/20260340_stripe_tables.sql`, `20260332_add_products_table.sql`, `20260342_stripe_bridge_columns.sql`
- Codebase direct inspection — `lib/stripe/handlers/` (product.ts, coupon.ts, subscription.ts, payment-intent.ts)
- Codebase direct inspection — `app/admin/products/AdminProductsClient.tsx`, `app/admin/users/` pattern
- npm registry — `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2 (verified 2026-03-24)
- `stripe` 20.4.1 installed and verified in `node_modules`
- STATE.md decisions — locked architectural decisions

### Secondary (MEDIUM confidence)

- `@dnd-kit/sortable` API pattern — based on published documentation; `useSortable`, `arrayMove`, `DndContext`, `SortableContext` are stable public APIs confirmed in v6-10
- Stripe Price immutability — confirmed by Stripe's documented API contract (prices have immutable `unit_amount`)

### Tertiary (LOW confidence)

- `webhook_events` JSONB query approach for timeline (ORD-07) — the exact JSONB containment query syntax against `webhook_events.payload` needs runtime verification; fallback is event_type filtering

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages verified against npm registry; Stripe SDK already installed
- Architecture: HIGH — based on direct codebase inspection of established patterns
- Pitfalls: HIGH — derived from schema inspection and Stripe API constraints

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days; dnd-kit and Stripe SDK are stable)
