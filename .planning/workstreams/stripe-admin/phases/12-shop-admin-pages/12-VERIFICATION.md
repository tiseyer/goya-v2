---
phase: 12-shop-admin-pages
verified: 2026-03-24T11:15:00Z
status: passed
score: 26/26 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 23/25
  gaps_closed:
    - "Admin can create a new product that appears in Stripe and stores stripe_product_id locally"
    - "All coupon action tests pass (createCoupon, editCoupon)"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Drag-and-drop product reorder"
    expected: "Dragging a product row in the /admin/shop/products table reorders it visually and persists the new order to products.priority"
    why_human: "dnd-kit drag-and-drop requires browser interaction; cannot verify programmatically"
  - test: "Status pill click toggle"
    expected: "Clicking a product's status pill in the table optimistically updates the displayed status and calls toggleProductStatus server action"
    why_human: "Requires browser interaction and live Stripe API"
  - test: "Order detail: billing and shipping address rendering"
    expected: "For an order with a customer who has a billing address in Stripe, the address renders correctly in the Customer card"
    why_human: "Requires real Stripe customer data; getStripe().customers.retrieve() returns actual customer"
  - test: "CouponForm role restrictions UI"
    expected: "Selecting Whitelist mode in role restrictions shows checkboxes for Student/Teacher/Wellness Practitioner/School"
    why_human: "UI conditional rendering requires browser interaction"
---

# Phase 12: Shop Admin Pages Verification Report

**Phase Goal:** Admins can manage all products, orders, and coupons through dedicated Shop admin pages
**Verified:** 2026-03-24T11:15:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure via plan 12-07

## Gap Closure Summary

Two gaps from the initial verification were closed by plan 12-07:

**Gap 1 closed — createProduct stub (was Blocker):** `createLocalProduct` server action added to `app/admin/shop/products/actions.ts`. It INSERTs a new row into the `products` table with all NOT NULL constraints satisfied (slug, name, full_name, category='special', price_display), returns the real Postgres UUID, and `ProductEditForm.tsx` now calls `createLocalProduct` first in `handleCreate` before passing the real UUID to `createProduct`. The `crypto.randomUUID()` client-side stub is removed. The `products.update({ stripe_product_id })` call in `createProduct` now finds a real row and correctly links the Stripe product to the local products row.

**Gap 2 closed — coupon test failure (was Warning):** The `promotionCodes.create` test assertion in `app/admin/shop/coupons/actions.test.ts` was updated from the old signature `expect.objectContaining({ coupon: 'cpn_test123', code: 'SUMMER25' })` to the correct Stripe SDK API signature `{ promotion: { type: 'coupon', coupon: 'cpn_test123' }, code: 'SUMMER25' }`. All 12 coupon tests now pass.

**Behavioral spot-check confirmed:** `npx vitest run app/admin/shop/products/actions.test.ts app/admin/shop/coupons/actions.test.ts` — 21/21 tests pass (9 products + 12 coupons).

## Goal Achievement

### Observable Truths

| #  | Truth                                                                 | Status       | Evidence                                                            |
|----|-----------------------------------------------------------------------|--------------|---------------------------------------------------------------------|
| 1  | Admin sees all products in table with required columns                | VERIFIED     | ProductsTable.tsx: Name, Price, Type pill, Status pill, Sales count columns present |
| 2  | Admin can toggle product status inline via Status pill                | VERIFIED     | ProductsTable.tsx: toggleProductStatus called on pill click with optimistic update |
| 3  | Admin can bulk select + bulk change status or delete products         | VERIFIED     | ProductsTable.tsx: bulkProductAction wired to "Publish/Draft/Delete" buttons; bulk bar shows when selected.size > 0 |
| 4  | Admin can drag-and-drop reorder products persisting to products.priority | VERIFIED  | DndContext + SortableContext + useSortable + arrayMove all present and wired to reorderProducts action |
| 5  | Admin can soft-delete a product (remains visible with Deleted pill)   | VERIFIED     | softDeleteProduct in actions.ts; ProductsTable has per-row trash icon |
| 6  | Admin can create a new product with Stripe link                       | VERIFIED     | createLocalProduct INSERTs real products row; createProduct links stripe_product_id; crypto.randomUUID() stub removed from ProductEditForm |
| 7  | Admin can edit product name/description/images with Stripe sync       | VERIFIED     | ProductEditForm.tsx: editProduct called from BasicInfoSection with name/description/images |
| 8  | Admin can configure More Options (descriptor, metadata, features)     | VERIFIED     | ProductEditForm.tsx: MoreOptionsSection calls editProduct with statementDescriptor/unitLabel/metadata/marketingFeatures |
| 9  | Price change creates new Stripe Price and archives old                | VERIFIED     | updateProductPrice in actions.ts: stripe.prices.create + stripe.prices.update(old, {active:false}); no direct amount mutation |
| 10 | Admin can configure Show-to / Don't-show-to visibility lists          | VERIFIED     | ProductEditForm.tsx: VisibilitySection wired to updateProductVisibility; requires_any_of / hidden_if_has_any present |
| 11 | Product detail shows Stripe sync status indicator                     | VERIFIED     | ProductEditForm.tsx: sync status badge rendered based on stripe_products.updated_at vs products.updated_at comparison |
| 12 | Admin sees all orders in table with 9 required columns                | VERIFIED     | OrdersTable.tsx: all 9 columns present (Payment Method shows "–" per spec — payment_method_type not in schema) |
| 13 | Admin can filter orders by type, date, status, price, search          | VERIFIED     | OrdersFilters.tsx: all filter types wired with useSearchParams; page.tsx applies filters server-side |
| 14 | Admin can bulk select orders and archive/restore                      | VERIFIED     | OrdersTable.tsx: bulkOrderAction imported and wired to Archive/Restore buttons |
| 15 | Admin can manually create an order (product + user selector)          | VERIFIED     | ManualOrderForm.tsx at /admin/shop/orders/new; createManualOrder action in orders/[id]/actions.ts |
| 16 | Admin can issue full or partial refund from order detail              | VERIFIED     | refundOrder in orders/[id]/actions.ts; OrderActions.tsx with full refund button + partial amount input |
| 17 | Admin can cancel subscription (schedule or immediate)                 | VERIFIED     | cancelSubscription in orders/[id]/actions.ts: schedule mode uses cancel_at_period_end:true, immediate calls subscriptions.cancel |
| 18 | Order detail shows chronological Stripe event timeline                | VERIFIED     | OrderTimeline.tsx: 10-entry event→label mapping, dot/line connector; webhook_events queried and filtered by stripe_id |
| 19 | Order detail shows customer info (email, billing/shipping from Stripe) | VERIFIED    | orders/[id]/page.tsx: customers.retrieve() call; billingAddress/shippingAddress rendered in Customer card |
| 20 | Order detail shows quick links to Product/User pages and customer journey | VERIFIED  | /admin/users?search={email} and /admin/shop/products/{id} links confirmed; customer journey last-10 orders rendered |
| 21 | Admin can resend invoice email and download invoice PDF               | VERIFIED     | resendInvoice + getInvoicePdfUrl in orders/[id]/actions.ts; OrderActions.tsx wires both buttons |
| 22 | Admin sees all coupons in table with required columns                 | VERIFIED     | CouponsTable.tsx: Name, Code, Type pill, Discount, Usage, Expiry, Status columns present |
| 23 | Admin can create coupon with all options including role/product restrictions | VERIFIED | createCoupon in actions.ts: percent_off:100 for free_product; promotionCodes.create when publicCode provided; role_restrictions + product_restrictions stored as GOYA-local jsonb |
| 24 | Admin can edit coupon with Stripe sync                                | VERIFIED     | editCoupon: stripe.coupons.update with name+metadata only; local update with GOYA fields unrestricted |
| 25 | Admin can manually assign a coupon to a user                         | VERIFIED     | assignCoupon in coupons/[id]/actions.ts: INSERT into stripe_coupon_redemptions (append-only) + times_redeemed increment |
| 26 | Coupon detail shows usage history with user names, dates, order refs  | VERIFIED     | coupons/[id]/page.tsx: stripe_coupon_redemptions queried; profiles joined for names; orders joined for refs |
| 27 | All coupon action tests pass (12/12)                                  | VERIFIED     | npx vitest run app/admin/shop/coupons/actions.test.ts — 12/12 pass (was 11/12 pre-gap-closure) |
| 28 | All product action tests pass including createLocalProduct (9/9)      | VERIFIED     | npx vitest run app/admin/shop/products/actions.test.ts — 9/9 pass (8 existing + 1 new createLocalProduct test) |

**Score:** 26/26 truths verified

### Required Artifacts

| Artifact                                             | Expected                                              | Status     | Details                                     |
|------------------------------------------------------|-------------------------------------------------------|------------|---------------------------------------------|
| `app/admin/shop/products/actions.ts`                 | 9 Server Actions (toggle, bulk, reorder, softDelete, createLocal, create, edit, price, visibility) | VERIFIED | All 9 exports confirmed; createLocalProduct added at line 102 |
| `app/admin/shop/products/actions.test.ts`            | Unit tests including createLocalProduct test (9 total) | VERIFIED | 9 tests, all passing; describe('createLocalProduct') at line 227 |
| `app/admin/shop/products/page.tsx`                   | Server Component with products query                  | VERIFIED   | createSupabaseServerClient + .from('products') confirmed |
| `app/admin/shop/products/ProductsTable.tsx`          | Client Component with dnd-kit sortable table          | VERIFIED   | DndContext, SortableContext, useSortable, arrayMove all present |
| `app/admin/shop/products/ProductsFilters.tsx`        | Client Component filter bar                           | VERIFIED   | 'use client', useSearchParams confirmed |
| `app/admin/shop/products/[id]/page.tsx`              | Server Component product detail                       | VERIFIED   | export default async function, await params confirmed |
| `app/admin/shop/products/[id]/ProductEditForm.tsx`   | Client Component with createLocalProduct-first flow   | VERIFIED   | createLocalProduct imported (line 6) and called in handleCreate (line 759); no crypto.randomUUID |
| `app/admin/shop/orders/actions.ts`                   | bulkOrderAction Server Action                         | VERIFIED   | 'use server', bulkOrderAction confirmed |
| `app/admin/shop/orders/actions.test.ts`              | Tests for orders bulk actions + detail actions        | VERIFIED   | 12 tests, all passing |
| `app/admin/shop/orders/page.tsx`                     | Server Component orders list                          | VERIFIED   | stripe_orders + profiles join via stripe_customer_id |
| `app/admin/shop/orders/OrdersTable.tsx`              | Client Component orders table with bulk select        | VERIFIED   | 'use client', bulkOrderAction wired |
| `app/admin/shop/orders/OrdersFilters.tsx`            | Client Component with 6 filter types                  | VERIFIED   | 'use client', useSearchParams, all filters present |
| `app/admin/shop/orders/[id]/actions.ts`              | 5 Server Actions (refund, cancel, resend, pdf, createManual) | VERIFIED | All 5 exports confirmed |
| `app/admin/shop/orders/[id]/page.tsx`                | Server Component order detail with billing/shipping from Stripe | VERIFIED | customers.retrieve, billingAddress, shippingAddress, webhook_events, profiles all queried |
| `app/admin/shop/orders/[id]/OrderTimeline.tsx`       | Client Component chronological event timeline         | VERIFIED   | 'use client', payment_intent event mapping confirmed |
| `app/admin/shop/orders/[id]/OrderActions.tsx`        | Client Component action buttons                       | VERIFIED   | Extracted from page; refundOrder/cancelSubscription wired |
| `app/admin/shop/orders/[id]/ManualOrderForm.tsx`     | Client Component manual order creation                | VERIFIED   | createManualOrder wired; product + user selectors present |
| `app/admin/shop/coupons/actions.ts`                  | createCoupon + editCoupon Server Actions              | VERIFIED   | percent_off:100 for free_product; role_restrictions + product_restrictions present |
| `app/admin/shop/coupons/actions.test.ts`             | 12/12 unit tests passing with correct API signatures  | VERIFIED   | 12/12 pass; promotionCodes.create uses { promotion: { type: 'coupon', coupon }, code } |
| `app/admin/shop/coupons/page.tsx`                    | Server Component coupons list                         | VERIFIED   | createSupabaseServerClient + .from('stripe_coupons') confirmed |
| `app/admin/shop/coupons/CouponsTable.tsx`            | Client Component coupons table                        | VERIFIED   | 'use client', all required columns present |
| `app/admin/shop/coupons/[id]/actions.ts`             | assignCoupon Server Action                            | VERIFIED   | INSERT into stripe_coupon_redemptions (append-only) |
| `app/admin/shop/coupons/[id]/page.tsx`               | Server Component coupon detail with history           | VERIFIED   | stripe_coupon_redemptions + profiles + products queried; await params |
| `app/admin/shop/coupons/[id]/CouponForm.tsx`         | Client Component with role/product restrictions       | VERIFIED   | 'use client', roleRestrictions, productRestrictions, whitelist/blacklist modes, useTransition |
| `app/admin/shop/coupons/[id]/CouponAssignment.tsx`   | Client Component user assignment                      | VERIFIED   | assignCoupon wired; user search dropdown |
| `supabase/migrations/20260341_coupon_restrictions.sql` | Migration adding role_restrictions + product_restrictions | VERIFIED | ALTER TABLE stripe_coupons with both columns confirmed |

### Key Link Verification

| From                                    | To                        | Via                                              | Status      | Details                                                  |
|-----------------------------------------|---------------------------|--------------------------------------------------|-------------|----------------------------------------------------------|
| products/[id]/ProductEditForm.tsx       | products/actions.ts       | import createLocalProduct (line 6)               | WIRED       | createLocalProduct imported and called in handleCreate at line 759 |
| products/actions.ts createLocalProduct  | supabase products table   | .from('products').insert()                       | WIRED       | Lines 122–136: insert with all NOT NULL columns, .select('id').single() returns real UUID |
| products/page.tsx                       | supabase                  | .from('products') with priority sort             | WIRED       | Confirmed                                                |
| ProductsTable.tsx                       | products/actions.ts       | import + toggleProductStatus/bulkProductAction/reorderProducts | WIRED | All three confirmed imported and called |
| ProductsTable.tsx                       | @dnd-kit/sortable         | DndContext + SortableContext + useSortable        | WIRED       | All confirmed imported and rendered                      |
| products/[id]/ProductEditForm.tsx       | products/actions.ts       | createProduct/editProduct/updateProductPrice/updateProductVisibility | WIRED | All 4 confirmed |
| orders/page.tsx                         | supabase                  | .from('stripe_orders') + profiles join           | WIRED       | stripe_customer_id join confirmed                        |
| OrdersTable.tsx                         | orders/actions.ts         | import bulkOrderAction                           | WIRED       | Confirmed                                                |
| orders/[id]/page.tsx                    | lib/stripe/client.ts      | customers.retrieve for billing/shipping          | WIRED       | Confirmed                                                |
| orders/[id]/page.tsx                    | supabase webhook_events   | timeline query filtered by stripe_id             | WIRED       | Confirmed                                                |
| orders/[id]/actions.ts                  | lib/stripe/client.ts      | refunds.create + subscriptions.cancel + invoices | WIRED       | All three Stripe API calls confirmed                     |
| coupons/actions.ts                      | lib/stripe/client.ts      | stripe.coupons.create + promotionCodes.create    | WIRED       | promotionCodes.create uses correct { promotion: { type: 'coupon', coupon }, code } signature |
| coupons/actions.ts                      | lib/supabase/service.ts   | upsert with role_restrictions + product_restrictions | WIRED   | Confirmed                                                |
| coupons/[id]/CouponForm.tsx             | coupons/actions.ts        | createCoupon + editCoupon                        | WIRED       | Confirmed                                                |
| coupons/[id]/actions.ts                 | lib/supabase/service.ts   | INSERT into stripe_coupon_redemptions             | WIRED       | Confirmed                                                |

### Data-Flow Trace (Level 4)

| Artifact                  | Data Variable     | Source                                         | Produces Real Data | Status    |
|---------------------------|-------------------|------------------------------------------------|--------------------|-----------|
| products/page.tsx         | products rows     | .from('products') ordered by priority          | Yes — DB query     | FLOWING   |
| products/page.tsx         | salesCounts map   | .from('stripe_orders').select('stripe_product_id') | Yes — DB query | FLOWING  |
| orders/page.tsx           | orders rows       | .from('stripe_orders') with filters + range    | Yes — DB query     | FLOWING   |
| orders/page.tsx           | customer names    | .from('profiles') IN stripe_customer_id list   | Yes — DB query     | FLOWING   |
| orders/[id]/page.tsx      | billingAddress    | getStripe().customers.retrieve()               | Yes — Stripe API   | FLOWING   |
| orders/[id]/page.tsx      | timelineEvents    | .from('webhook_events') filtered by stripe_id  | Yes — DB query     | FLOWING   |
| coupons/page.tsx          | coupon rows       | .from('stripe_coupons') with search/status/sort | Yes — DB query    | FLOWING   |
| coupons/[id]/page.tsx     | redemptionHistory | .from('stripe_coupon_redemptions')             | Yes — DB query     | FLOWING   |
| products/actions.ts       | createLocalProduct result | .from('products').insert().select('id').single() | Yes — real Postgres UUID | FLOWING |

### Behavioral Spot-Checks

| Behavior                              | Command                                                                | Result       | Status |
|---------------------------------------|------------------------------------------------------------------------|--------------|--------|
| Products actions: 9 tests             | npx vitest run app/admin/shop/products/actions.test.ts                 | 9/9 pass     | PASS   |
| Orders actions: 12 tests              | npx vitest run app/admin/shop/orders/actions.test.ts                   | 12/12 pass   | PASS   |
| Coupons actions: 12 tests             | npx vitest run app/admin/shop/coupons/actions.test.ts                  | 12/12 pass   | PASS   |
| createLocalProduct removes stub       | grep -c "crypto.randomUUID" ProductEditForm.tsx                        | 0 matches    | PASS   |
| createLocalProduct exported           | grep "export async function createLocalProduct" actions.ts             | 1 match      | PASS   |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                     | Status      | Evidence                                                         |
|-------------|------------|---------------------------------------------------------------------------------|-------------|------------------------------------------------------------------|
| PROD-01     | 12-01      | Products table with Checkbox, Name, Price, Type, Status, Sales count            | SATISFIED   | ProductsTable.tsx all columns present                            |
| PROD-02     | 12-01      | Inline status pill click toggles Published/Draft                                | SATISFIED   | toggleProductStatus wired to pill onClick with optimistic update |
| PROD-03     | 12-01      | Bulk select + bulk change status or delete                                      | SATISFIED   | bulkProductAction wired to bulk action bar                       |
| PROD-04     | 12-01      | Drag-and-drop reorder persists to products.priority                             | SATISFIED   | dnd-kit arrayMove + reorderProducts confirmed                    |
| PROD-05     | 12-07      | New product created in Stripe with stripe_product_id stored locally             | SATISFIED   | createLocalProduct inserts real row; createProduct links stripe_product_id; stub removed |
| PROD-06     | 12-02      | Edit name/description/images with Stripe sync                                   | SATISFIED   | editProduct wired in BasicInfoSection                            |
| PROD-07     | 12-02      | More Options: descriptor, unit label, metadata, marketing features              | SATISFIED   | MoreOptionsSection calls editProduct with all fields             |
| PROD-08     | 12-02      | Price change creates new Price, archives old (never direct amount mutation)     | SATISFIED   | updateProductPrice: prices.create + prices.update(old, {active:false}) |
| PROD-09     | 12-02      | Visibility Show-to / Don't-show-to persists to GOYA columns                    | SATISFIED   | updateProductVisibility writes requires_any_of + hidden_if_has_any |
| PROD-10     | 12-02      | Sync status indicator on product detail                                         | SATISFIED   | Sync badge comparing updated_at timestamps confirmed              |
| PROD-11     | 12-01      | Soft-delete sets Deleted status; row remains visible                            | SATISFIED   | softDeleteProduct + Deleted status derivation confirmed          |
| ORD-01      | 12-03      | Orders table with 9 columns (Payment Method shows "–" per schema limitation)   | SATISFIED   | OrdersTable.tsx all 9 columns; "–" for Payment Method is per-spec |
| ORD-02      | 12-03      | Filter by type, date range, status, price range; search by name/email           | SATISFIED   | OrdersFilters.tsx all filter types; JS-side search post-merge    |
| ORD-03      | 12-03      | Bulk select + archive/restore                                                   | SATISFIED   | bulkOrderAction wired to Archive/Restore buttons                 |
| ORD-04      | 12-04      | Manual order creation with product + user selector                              | SATISFIED   | ManualOrderForm.tsx + createManualOrder action confirmed         |
| ORD-05      | 12-04      | Full and partial refund from order detail                                       | SATISFIED   | refundOrder: full (no amount) + partial (with amount) wired      |
| ORD-06      | 12-04      | Cancel subscription: schedule (period end) or immediate                         | SATISFIED   | cancelSubscription: schedule=cancel_at_period_end, immediate=subscriptions.cancel |
| ORD-07      | 12-04      | Chronological Stripe event timeline                                             | SATISFIED   | OrderTimeline.tsx: 10-entry mapping, webhook_events data source  |
| ORD-08      | 12-04      | Customer info: email, billing address, shipping address, quick links, journey  | SATISFIED   | customers.retrieve confirmed; billingAddress/shippingAddress rendered; both quick links present |
| ORD-09      | 12-04      | Resend invoice email + download invoice PDF                                     | SATISFIED   | resendInvoice + getInvoicePdfUrl actions + OrderActions.tsx wired |
| CPN-01      | 12-05      | Coupons table with Name, Code, Type, Discount, Usage, Expiry, Status columns   | SATISFIED   | CouponsTable.tsx all columns confirmed                           |
| CPN-02      | 12-05/06   | Create coupon with all options including role/product restrictions              | SATISFIED   | createCoupon: free_product→100%, promoCode when publicCode; role_restrictions + product_restrictions stored |
| CPN-03      | 12-05      | Edit coupon syncs to Stripe; both IDs stored                                    | SATISFIED   | editCoupon: stripe.coupons.update + local GOYA field update; both IDs in upsert |
| CPN-04      | 12-06      | Manual coupon assignment to user without code                                   | SATISFIED   | assignCoupon: append-only INSERT into stripe_coupon_redemptions  |
| CPN-05      | 12-06      | Redemption history with user names, dates, order references                    | SATISFIED   | coupons/[id]/page.tsx: stripe_coupon_redemptions + profiles + orders joined |

**Note on ORD requirements traceability:** ORD-01 through ORD-09 are marked as `[ ] Pending` in `.planning/workstreams/stripe-admin/REQUIREMENTS.md` traceability table. This is a documentation-only gap — the implementations were completed in plans 12-03 and 12-04 and are fully verified in the codebase. The checkboxes and traceability table were not updated after those plans completed. The code satisfies all ORD requirements.

### Anti-Patterns Found

| File                                          | Line  | Pattern                                    | Severity  | Impact                                                        |
|-----------------------------------------------|-------|--------------------------------------------|-----------|---------------------------------------------------------------|
| app/admin/shop/coupons/actions.ts             | ~70–72 | `(getSupabaseService() as any)` cast for upsert | Info   | Necessary workaround because migration-added columns not in generated Supabase types; low risk, not a stub |

No blocker or warning anti-patterns remain. The `crypto.randomUUID()` blocker from the initial verification is resolved.

### Human Verification Required

### 1. Drag-and-Drop Product Reorder

**Test:** Navigate to /admin/shop/products, drag a product row to a new position using the grip icon
**Expected:** Row reorders visually; on drag end, products.priority values update in DB; page refresh preserves the new order
**Why human:** dnd-kit drag-and-drop requires browser interaction

### 2. Status Pill Inline Toggle

**Test:** Click a product's Published status pill in the products table
**Expected:** Status optimistically updates to Draft in UI; Stripe product.active and products.is_active both update; clicking again publishes
**Why human:** Requires browser + live Stripe API interaction

### 3. Order Detail: Billing/Shipping Address Display

**Test:** Navigate to an order detail page for a customer with a Stripe billing address
**Expected:** The Customer card displays billing address fields (line1, city, state, zip) and shipping address if present
**Why human:** Requires real Stripe customer data

### 4. CouponForm Role/Product Restriction UI

**Test:** Navigate to /admin/shop/coupons/new, select Whitelist under Role Restrictions
**Expected:** Checkboxes appear for Student, Teacher, Wellness Practitioner, School roles; selecting and saving calls createCoupon with roleRestrictions
**Why human:** Conditional UI rendering requires browser interaction

### Gaps Summary

No gaps remain. Both blockers from the initial verification are closed:

- PROD-05 is now fully satisfied: `createLocalProduct` inserts a real products row before `createProduct` links the Stripe product ID. The `crypto.randomUUID()` stub is removed from `ProductEditForm.tsx`. The insert-then-link pattern is tested (1 dedicated test passing).
- All 12 coupon action tests pass. The `promotionCodes.create` test assertion matches the correct Stripe SDK API signature `{ promotion: { type: 'coupon', coupon }, code }`.

All 25 phase requirements (PROD-01 through PROD-11, ORD-01 through ORD-09, CPN-01 through CPN-05) are satisfied by verified implementations in the codebase.

The 4 human verification items remain — these require browser interaction or live Stripe API and cannot be verified programmatically. They are not blockers; the underlying server actions and data wiring are all verified.

---

_Verified: 2026-03-24T11:15:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification: Yes — after gap closure plan 12-07_
