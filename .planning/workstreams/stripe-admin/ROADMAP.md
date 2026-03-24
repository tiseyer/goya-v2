# Roadmap: GOYA v2 — v1.2 Stripe Admin & Shop

## Overview

Six phases build the full Stripe billing backbone and Shop admin section. The dependency chain is strict: database tables must exist before webhooks can write to them, webhook infrastructure must exist before handlers can be wired up, and the admin UI can only show meaningful data once the tables are populated. Phases 8–10 establish the invisible infrastructure; Phases 11–13 deliver the visible admin experience.

## Phases

**Phase Numbering:** Continues from v1.1 (Phases 4–7). This milestone uses Phases 8–13.

- [x] **Phase 8: DB Foundation** - Create 5 Stripe-mirror tables, idempotency table, bridge columns, and RLS policies
- [ ] **Phase 9: Stripe SDK + Webhook Infrastructure** - SDK singleton and webhook endpoint with signature verification
- [x] **Phase 10: Webhook Handlers + Initial Sync** - All 15 event handlers with idempotent upserts and admin-triggered sync (completed 2026-03-24)
- [x] **Phase 11: AdminShell Shop Nav** - Shop collapsible dropdown in AdminShell sidebar (completed 2026-03-24)
- [ ] **Phase 12: Shop Admin Pages** - Products, Orders, and Coupons admin sections
- [ ] **Phase 13: Analytics** - ARR/MRR metrics, revenue charts, role-split funnel, CSV export

## Phase Details

### Phase 8: DB Foundation
**Goal**: The database layer for all Stripe data is in place and enforced
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: DB-01, DB-02, DB-03
**Success Criteria** (what must be TRUE):
  1. Supabase contains `stripe_products`, `stripe_prices`, `stripe_orders`, `stripe_coupons`, `stripe_coupon_redemptions`, and `webhook_events` tables with correct columns
  2. Admin and moderator roles can read and write to all new tables; other roles are blocked by RLS
  3. Existing `products` table has a nullable `stripe_product_id` column; `profiles` table has a nullable `stripe_customer_id` column
  4. The `webhook_events` table has a UNIQUE constraint on event ID that prevents duplicate processing on INSERT conflict
**Plans**: 2 plans
Plans:
- [x] 08-01-PLAN.md — Create 5 Stripe entity tables with RLS, triggers, and indices
- [x] 08-02-PLAN.md — Create webhook_events idempotency table and bridge columns

### Phase 9: Stripe SDK + Webhook Infrastructure
**Goal**: The Stripe SDK is available server-side and the webhook endpoint can receive and verify Stripe events
**Depends on**: Phase 8
**Requirements**: DB-04, DB-05
**Success Criteria** (what must be TRUE):
  1. `lib/stripe/client.ts` exports a server-only Stripe singleton; importing it in a Client Component throws a build error
  2. `POST /api/webhooks/stripe` returns 400 for requests with an invalid or missing signature
  3. `POST /api/webhooks/stripe` returns 200 for a valid Stripe-signed test event sent via Stripe CLI
  4. The endpoint uses `request.text()` for body parsing, not `request.json()`
**Plans**: 2 plans
Plans:
- [x] 09-01-PLAN.md — Install stripe + server-only packages, create server-only Stripe SDK singleton with tests
- [x] 09-02-PLAN.md — Create webhook route handler with Stripe signature verification and tests

### Phase 10: Webhook Handlers + Initial Sync
**Goal**: All 15 Stripe event types are handled with idempotent upserts and an admin can seed the database from the existing Stripe account
**Depends on**: Phase 9
**Requirements**: DB-06, DB-07, DB-08, DB-09
**Success Criteria** (what must be TRUE):
  1. Firing each of the 15 event types via Stripe CLI results in a correctly upserted row in the corresponding Supabase table
  2. Firing the same event ID twice produces exactly one row in the database (idempotency holds under concurrent retries)
  3. GOYA-owned columns (`priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`) are never overwritten by webhook handlers
  4. Complex webhook events (checkout, subscription updates) return 200 immediately; side-effects are queued to `webhook_events` for Vercel Cron processing
  5. Admin can trigger a one-time sync that populates `stripe_products`, `stripe_prices`, and `stripe_coupons` from the Stripe account
**Plans**: 3 plans
Plans:
- [x] 10-01-PLAN.md — Migration for pending_cron status + product, price, coupon handlers with tests
- [x] 10-02-PLAN.md — Subscription, payment-intent, invoice handlers with pending_cron support
- [x] 10-03-PLAN.md — Wire dispatch + idempotency into webhook route, cron route, admin sync route

### Phase 11: AdminShell Shop Nav
**Goal**: The Shop section is navigable from the AdminShell sidebar for admin and moderator roles
**Depends on**: Phase 10
**Requirements**: NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. AdminShell sidebar shows a "Shop" collapsible group with four child links in order: Orders, Products, Coupons, Analytics
  2. The legacy top-level "Products" nav item is gone; no duplicate products links exist in the sidebar
  3. A user with student, teacher, or wellness practitioner role sees no Shop nav group
**Plans**: 1 plan
Plans:
- [x] 11-01-PLAN.md — Add collapsible Shop nav group to AdminShell sidebar with Orders, Products, Coupons, Analytics child links
**UI hint**: yes

### Phase 12: Shop Admin Pages
**Goal**: Admins can manage all products, orders, and coupons through dedicated Shop admin pages
**Depends on**: Phase 11
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, PROD-06, PROD-07, PROD-08, PROD-09, PROD-10, PROD-11, ORD-01, ORD-02, ORD-03, ORD-04, ORD-05, ORD-06, ORD-07, ORD-08, ORD-09, CPN-01, CPN-02, CPN-03, CPN-04, CPN-05
**Success Criteria** (what must be TRUE):
  1. Admin can view, filter, reorder (drag-and-drop), bulk-action, and soft-delete products; the new order persists to `products.priority`
  2. Changing a product's price creates a new Stripe Price and archives the old one; the edit form does not allow direct amount mutation
  3. Admin can view, filter, search, and bulk-action orders; order detail shows a chronological Stripe event timeline, customer info, full/partial refund action, and subscription cancel (schedule or immediate)
  4. Admin can create, edit, and manually assign coupons; both `stripe_coupon_id` and `stripe_promotion_code_id` are stored; coupon detail shows redemption history
  5. Product visibility rules (show-to / don't-show-to) can be configured per product and are persisted to GOYA-owned columns
**Plans**: 6 plans
Plans:
- [ ] 12-01-PLAN.md — Products list page with dnd-kit sortable table, status toggle, bulk actions, drag-and-drop reorder
- [ ] 12-02-PLAN.md — Product detail/edit page with price change flow, visibility config, sync status
- [ ] 12-03-PLAN.md — Orders list page with filters, search, bulk actions
- [ ] 12-04-PLAN.md — Order detail page with timeline, refund/cancel actions, customer info, invoice
- [ ] 12-05-PLAN.md — Coupons list page with table, create/edit Server Actions
- [ ] 12-06-PLAN.md — Coupon detail page with form, manual assignment, redemption history
**UI hint**: yes

### Phase 13: Analytics
**Goal**: Admins can view user funnel and revenue metrics computed from local tables, filtered by role and time range, with chart and CSV export
**Depends on**: Phase 12
**Requirements**: ANA-01, ANA-02, ANA-03, ANA-04, ANA-05
**Success Criteria** (what must be TRUE):
  1. Analytics page loads without any Stripe API calls; all metrics are computed from Supabase tables
  2. Admin can select a time range (30 days / 3 months / 6 months / custom) and all funnel and revenue metrics update accordingly
  3. Funnel and revenue metrics can be filtered by member role (Student / Teacher / Wellness Practitioner / School)
  4. Admin can export any metric or chart data as a CSV file
  5. Revenue over time and new orders over time are displayed as interactive Recharts time-series charts
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** 8 → 9 → 10 → 11 → 12 → 13

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 8. DB Foundation | 2/2 | Complete | 2026-03-23 |
| 9. Stripe SDK + Webhook Infrastructure | 1/2 | In Progress|  |
| 10. Webhook Handlers + Initial Sync | 3/3 | Complete    | 2026-03-24 |
| 11. AdminShell Shop Nav | 1/1 | Complete    | 2026-03-24 |
| 12. Shop Admin Pages | 0/6 | Not started | - |
| 13. Analytics | 0/? | Not started | - |
