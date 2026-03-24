# Requirements: GOYA v2 — v1.2 Stripe Admin & Shop

**Defined:** 2026-03-23
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.2 Requirements

### DB — Database & Sync Infrastructure

- [ ] **DB-01**: Admin migration creates `stripe_products`, `stripe_prices`, `stripe_orders`, `stripe_coupons`, `stripe_coupon_redemptions` tables with correct columns and RLS policies for admin/moderator roles
- [ ] **DB-02**: `webhook_events` idempotency table prevents duplicate webhook processing on Stripe retries (INSERT event ID before processing; skip on conflict)
- [ ] **DB-03**: `stripe_product_id` bridge column added to existing `products` table; `stripe_customer_id` column added to `profiles` table
- [x] **DB-04**: Stripe SDK singleton exists at `lib/stripe/client.ts` with a server-only guard (never imported in Client Components)
- [x] **DB-05**: Webhook endpoint at `/api/webhooks/stripe` verifies Stripe signature using raw request body (`request.text()`, not `request.json()`) and dispatches to per-entity event handlers
- [x] **DB-06**: All 15 Stripe event types are handled: `product.created/updated/deleted`, `price.created/updated/deleted`, `payment_intent.succeeded/failed`, `customer.subscription.created/updated/deleted`, `invoice.paid/failed`, `coupon.created/updated/deleted`
- [x] **DB-07**: Webhook handlers use idempotent upserts keyed on `stripe_id` with write-partitioning enforced (GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`; Stripe owns payment/billing fields)
- [x] **DB-08**: Complex webhook events (checkout, subscription updates with email side-effects) return 200 immediately after idempotency check; heavy side-effects are processed via Vercel cron polling the `webhook_events` table
- [ ] **DB-09**: Admin can trigger a one-time initial sync that seeds `stripe_products`, `stripe_prices`, and `stripe_coupons` from the existing Stripe account via the Stripe list API

### NAV — AdminShell Navigation

- [ ] **NAV-01**: AdminShell sidebar has a "Shop" collapsible dropdown group with four child links: Orders (top), Products, Coupons, Analytics
- [ ] **NAV-02**: The old "Products" admin nav item is removed; Shop > Products replaces it as the single products management page
- [ ] **NAV-03**: All Shop sections are accessible to Admin and Moderator roles only; other roles see no Shop nav items

### PROD — Products Admin

- [ ] **PROD-01**: Admin can view all products in a table with columns: Checkbox, Name, Price, Type (recurring/one-off), Status pill (Published/Draft/Deleted), Sales count
- [ ] **PROD-02**: Admin can toggle a product's status inline by clicking the Status pill (Published ↔ Draft; Deleted is soft-delete only)
- [ ] **PROD-03**: Admin can select multiple products and bulk change status or bulk delete
- [ ] **PROD-04**: Admin can drag-and-drop reorder products; the new order persists to `products.priority` and determines storefront display order
- [ ] **PROD-05**: Admin can add a new product; the product is created in Stripe and the `stripe_product_id` is stored on the local `products` row
- [ ] **PROD-06**: Admin can edit a product's Name, Description, Featured Image (pushed to Stripe), and up to 5 product images (GOYA-only for images beyond the featured one)
- [ ] **PROD-07**: Admin can edit More Options via a dropdown: Statement Descriptor, Unit Label, Metadata (key/value pairs with add/remove), Marketing Feature List (with add/remove)
- [ ] **PROD-08**: Changing a product price creates a new Stripe Price and archives the old one (never calls `stripe.prices.update()` with a new amount)
- [ ] **PROD-09**: Admin can configure product Visibility: "Show to" searchable list (shown if user owns any product in list) and "Don't show to" searchable list (hidden if user owns any — veto overrides positive condition)
- [ ] **PROD-10**: Product detail page shows a Stripe sync status indicator (last synced timestamp or "Out of sync" warning)
- [ ] **PROD-11**: Admin can soft-delete a product (sets status = Deleted); deleted products remain visible in the table with a Deleted status pill

### ORD — Orders Admin

- [ ] **ORD-01**: Admin can view all orders in a table with columns: Checkbox, Order #, Customer Name, Date+Time, Status, Total, Payment Method, Recurring Total, Next Payment Date, Coupon (empty if none)
- [ ] **ORD-02**: Admin can filter orders by type (All / One-time / Subscriptions), date range, status, and price range; admin can search by customer name or email
- [ ] **ORD-03**: Admin can select multiple orders and bulk change status or move to trash
- [ ] **ORD-04**: Admin can manually create an order by selecting a product and an existing GOYA user
- [ ] **ORD-05**: Admin can view an order detail page and issue a full or partial refund
- [ ] **ORD-06**: Admin can cancel a subscription via two explicit modes: "Schedule Cancellation" (cancel at period end, subscription stays active until billing period ends) or "Suspend Immediately" (immediate cancellation)
- [ ] **ORD-07**: Order detail page shows a chronological timeline of Stripe events (Payment Intent Created, Charge Complete, Refund Issued, etc.)
- [ ] **ORD-08**: Order detail page shows customer info (email, billing address, shipping address), quick links to the Product page and User page, and all previous orders from the same customer (customer journey)
- [ ] **ORD-09**: Admin can resend an invoice email and download the invoice PDF from the order detail page

### CPN — Coupons Admin

- [ ] **CPN-01**: Admin can view all coupons in a table with columns: Name, Code, Type, Discount, Usage count, Expiry, Status
- [ ] **CPN-02**: Admin can create a coupon with: internal name (admin-only), external coupon code (optional, for public use), type (Percentage / Fixed Amount / Free Product), role restrictions (multi-select whitelist or blacklist), product restrictions (multi-select whitelist or blacklist), usage limit (number input; 0 = unlimited) or single-use toggle, start date, expiry date
- [ ] **CPN-03**: Admin can edit a coupon; changes sync bidirectionally with Stripe (both `stripe_coupon_id` and `stripe_promotion_code_id` are stored separately)
- [ ] **CPN-04**: Admin can manually assign a coupon directly to a specific user without requiring a code; the user sees the associated product as free in the shop
- [ ] **CPN-05**: Coupon detail page shows usage history: a list of users who redeemed the coupon with date and order reference

### ANA — Analytics

- [ ] **ANA-01**: Admin can view user funnel metrics with a time range selector (30 days / 3 months / 6 months / custom range): new registrations, completed onboarding, conversion rate (registered → paid), new subscriptions, pending cancellations (cancelled but active until period end), new cancellations (fully churned), total active members, net growth
- [ ] **ANA-02**: Admin can view revenue metrics computed from local Supabase tables (no Stripe API calls at page load): ARR total, new ARR in period, churned ARR in period, net new ARR
- [ ] **ANA-03**: All funnel and revenue metrics can be split/filtered by member role: Student / Teacher / Wellness Practitioner / School
- [ ] **ANA-04**: Admin can export any metric or chart as a CSV file
- [ ] **ANA-05**: Analytics page displays interactive time-series charts built with Recharts: revenue over time and new orders over time

## Future Requirements

### Payments (deferred to v1.3+)

- **PAY-01**: Proration handling UI for subscription upgrades/downgrades
- **PAY-02**: Refund dispute management (chargeback handling)
- **PAY-03**: Subscription pause feature (currently use cancel-at-period-end instead)
- **PAY-04**: Multi-currency analytics

### Analytics (deferred to v1.3+)

- **ANA-F01**: Coupon performance analytics (redemption rates, revenue impact)
- **ANA-F02**: Product performance comparison charts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time bidirectional sync | Creates infinite webhook loops; write-to-Stripe-then-webhook is the correct pattern |
| In-place price amount editing | Stripe Prices are immutable — must create new Price and archive old |
| Real-time Stripe API polling for dashboard metrics | Rate limits; compute from local tables instead |
| Order deletion (hard delete) | Breaks audit trail; use `is_test` soft-delete flag instead |
| `@stripe/stripe-js` / `@stripe/react-stripe-js` | No new checkout UI in this milestone |
| Subscription pause feature | Confusing in Stripe; use cancel-at-period-end instead |
| Coupon auto-application rules engine | Use Stripe's native promotion code restrictions |
| Multi-currency support | USD only for v1.2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 8 | Pending |
| DB-02 | Phase 8 | Pending |
| DB-03 | Phase 8 | Pending |
| DB-04 | Phase 9 | Complete |
| DB-05 | Phase 9 | Complete |
| DB-06 | Phase 10 | Complete |
| DB-07 | Phase 10 | Complete |
| DB-08 | Phase 10 | Complete |
| DB-09 | Phase 10 | Pending |
| NAV-01 | Phase 11 | Pending |
| NAV-02 | Phase 11 | Pending |
| NAV-03 | Phase 11 | Pending |
| PROD-01 | Phase 12 | Pending |
| PROD-02 | Phase 12 | Pending |
| PROD-03 | Phase 12 | Pending |
| PROD-04 | Phase 12 | Pending |
| PROD-05 | Phase 12 | Pending |
| PROD-06 | Phase 12 | Pending |
| PROD-07 | Phase 12 | Pending |
| PROD-08 | Phase 12 | Pending |
| PROD-09 | Phase 12 | Pending |
| PROD-10 | Phase 12 | Pending |
| PROD-11 | Phase 12 | Pending |
| ORD-01 | Phase 12 | Pending |
| ORD-02 | Phase 12 | Pending |
| ORD-03 | Phase 12 | Pending |
| ORD-04 | Phase 12 | Pending |
| ORD-05 | Phase 12 | Pending |
| ORD-06 | Phase 12 | Pending |
| ORD-07 | Phase 12 | Pending |
| ORD-08 | Phase 12 | Pending |
| ORD-09 | Phase 12 | Pending |
| CPN-01 | Phase 12 | Pending |
| CPN-02 | Phase 12 | Pending |
| CPN-03 | Phase 12 | Pending |
| CPN-04 | Phase 12 | Pending |
| CPN-05 | Phase 12 | Pending |
| ANA-01 | Phase 13 | Pending |
| ANA-02 | Phase 13 | Pending |
| ANA-03 | Phase 13 | Pending |
| ANA-04 | Phase 13 | Pending |
| ANA-05 | Phase 13 | Pending |

**Coverage:**
- v1.2 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 — traceability populated by roadmapper*
