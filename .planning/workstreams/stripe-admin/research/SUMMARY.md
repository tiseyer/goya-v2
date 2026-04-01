# Project Research Summary

**Project:** GOYA v2 — v1.2 Stripe Admin & Shop
**Domain:** Stripe bidirectional sync + Shop admin section
**Researched:** 2026-03-23
**Confidence:** HIGH (Stripe patterns, architecture) / MEDIUM (library versions, async processing)

## Executive Summary

This milestone adds the payment infrastructure backbone that the GOYA v2 platform currently lacks: real Stripe data flowing into an admin Shop section (Orders, Products, Coupons, Analytics). The recommended approach is a webhook-first, Stripe-as-source-of-truth architecture — Stripe owns all payment state, the app writes to Stripe and receives updates back via webhooks into a set of Supabase mirror tables. The existing `products` table is NOT replaced; it is extended with a `stripe_product_id` bridge column, keeping GOYA-specific product logic intact while linking to Stripe's billing objects.

The single highest-risk pattern in this milestone is the sync loop: when the app writes to Stripe, Stripe fires a webhook back. Without strict write-partitioning (Stripe owns payment fields, GOYA owns display/visibility fields), webhook handlers will overwrite GOYA-specific columns on every admin edit. The second highest-risk is webhook idempotency — Stripe retries failed deliveries, and without an idempotency table, concurrent retries create duplicate orders. Both risks are fully preventable with upfront DB design choices made in the foundation phase, before any handlers are written.

The build order is hard-constraint driven: the database tables must exist before webhooks can write to them, webhook infrastructure must exist before handlers can be wired up, and the admin UI can only show meaningful data once the tables are populated. This maps cleanly to a 6-phase roadmap where each phase is a deployable, testable increment.

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, React 19.2.3, Supabase, Tailwind CSS 4, TypeScript 5, Resend, Vercel) is validated and unchanged. Three new dependency groups are added for this milestone only.

**Core technologies:**
- `stripe ^17.x` (server SDK): Official Stripe Node.js SDK — use server-side only via `lib/stripe/client.ts` singleton; never import in Client Components
- `@dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities ^6.3/10.0/3.2`: Drag-and-drop for Products table row reordering — React-native, maintained; react-beautiful-dnd is archived and must not be used
- `recharts ^3.8.0`: Charts for Analytics page — SVG-based, integrates with Tailwind CSS variables, React 19 compatible from 3.8.0 (3.7.x has a blank-chart regression)

**Critical version notes:** Use recharts 3.8.0 or later. dnd-kit's multi-container drag bug is not relevant here (flat list only). `stripe` SDK pins an API version at install — `^17.x` is stable; `^20.x` is also acceptable if you want the 2026-02-25 API surface.

**What NOT to add:** `@stripe/stripe-js`, `@stripe/react-stripe-js` (no new checkout UI), `react-beautiful-dnd` (archived), TanStack Table (conflicts with existing admin table pattern), Inngest/Trigger.dev (Supabase idempotency table + Vercel cron is sufficient).

### Expected Features

**Must have (table stakes) — v1.2 launch:**
- Stripe webhook processing for 15 event types (products, prices, payment intents, subscriptions, coupons)
- DB foundation: 5 new Stripe-mirror tables + `stripe_customer_id` on profiles + bridge columns on products
- Shop > Orders: filterable list, order detail with timeline, full/partial refund action, subscription cancel
- Shop > Products: table over both GOYA + Stripe products, edit modal (metadata only for price), active toggle, drag-and-drop priority reordering, bulk activate/deactivate
- Shop > Coupons: list, create (calls Stripe API), manual user assignment, usage history
- Shop > Analytics: MRR/ARR cards, revenue chart (30/90/365d), new orders over time, role-split funnel breakdown
- AdminShell Shop nav dropdown (Orders, Products, Coupons, Analytics)

**Should have (competitive differentiators) — v1.2 or v1.x:**
- Drag-and-drop product reordering (better UX than numeric priority input)
- ARR/MRR display calculated from local orders table (no Stripe API call at page load)
- Role-split funnel analytics (teacher/student/wellness) — GOYA-specific insight
- Order timeline (status history as events)
- Stripe sync health indicator (last webhook received banner)
- CSV export for orders and revenue

**Defer (v2+):**
- Proration handling UI for subscription upgrades/downgrades
- Refund dispute management (chargebacks)
- Multi-currency analytics
- Coupon auto-application rules engine (use Stripe's native promotion code restrictions instead)
- Subscription pause feature (use cancel-at-period-end instead — pause is confusing in Stripe)

**Anti-features to avoid building:**
- Full bidirectional real-time sync (creates infinite webhook loops)
- In-place price editing (Stripe Price amounts are immutable — must create new Price, archive old)
- Real-time Stripe API polling for dashboard metrics (rate limits hit fast; compute from local tables)
- Order deletion (breaks audit trail; use `is_test` soft-delete flag instead)

### Architecture Approach

The architecture follows a clean inbound/outbound Stripe integration layered over the existing admin pattern. Stripe events flow into `app/api/webhooks/stripe/route.ts` (raw body, HMAC verified), which dispatches to per-entity handlers in `lib/stripe/handlers/` that do idempotent upserts into five new Supabase tables. Admin Shop pages are Server Components that query those tables and pass data to Client Components for interaction — identical to the existing `app/admin/products/` pattern.

**Major components:**
1. `app/api/webhooks/stripe/route.ts` — receives, verifies, dispatches Stripe events; returns 200 after verification
2. `lib/stripe/handlers/*.ts` (products, prices, orders, subscriptions, coupons) — idempotent upsert logic per event group using service-role Supabase client
3. `lib/stripe/sync.ts` — admin-triggered full re-sync via Stripe list API (paginates and upserts)
4. `lib/stripe-data.ts` — typed read functions for Shop admin pages (follows `lib/*-data.ts` pattern)
5. `app/admin/shop/` (orders, products, coupons, analytics) — four new admin sections
6. `supabase/migrations/*_stripe_tables.sql` — 5 new tables, RLS policies, bridge columns, idempotency table
7. `app/admin/components/AdminShell.tsx` (modified) — Shop dropdown group added to sidebar nav

**Key patterns:**
- Raw body webhook verification: always `req.text()`, never `req.json()`
- Idempotent upserts keyed on `stripe_id` (UNIQUE constraint at DB level)
- Service-role client for webhook writes (no user session); standard server client for admin UI reads
- Write partitioning: Stripe owns payment fields; GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`
- `webhook_events` idempotency table: INSERT event ID atomically before processing; skip on conflict

### Critical Pitfalls

1. **`request.json()` in webhook handler** — causes 100% signature verification failures in production; use `request.text()` exclusively in `app/api/webhooks/stripe/route.ts`
2. **Sync loop wiping GOYA fields** — webhook handler overwrites `requires_any_of`, `hidden_if_has_any`, `priority` on every Stripe write-back; enforce write partitioning from day one, set `metadata.source = 'goya_admin'` on outbound writes, and never overwrite GOYA-owned columns in webhook handlers
3. **Missing `webhook_events` idempotency table** — Stripe retries on failure cause duplicate orders; build the idempotency INSERT-on-conflict check before writing any handler
4. **RLS gaps on new tables** — admin UI returns empty arrays while data exists in DB; every migration must include RLS policies for `admin`/`moderator` roles as a non-negotiable checklist item
5. **Stripe Price immutability** — `unit_amount` cannot be updated on existing Price objects; the Products editor must create a new Price, migrate subscriptions, and archive the old Price — never call `stripe.prices.update()` with a new amount
6. **`customer.subscription.deleted` immediate downgrade** — Stripe fires this event at period end for `cancel_at_period_end` subscriptions, not at moment of cancellation; always inspect `cancel_at_period_end` and `current_period_end` before changing `profiles.subscription_status`
7. **Coupon vs Promotion Code conflation** — store both `stripe_coupon_id` and `stripe_promotion_code_id` in the coupons table; manual customer assignment uses Coupon ID, checkout sessions use Promotion Code ID
8. **Vercel timeout on complex webhook events** — `checkout.session.completed` with email + designation updates can exceed Stripe's 20s timeout; return 200 after idempotency check, process heavy side-effects via Vercel Cron polling the `webhook_events` table

## Implications for Roadmap

Based on the hard dependency chain discovered in research, six phases emerge. Each phase is a deployable increment that can be tested independently.

### Phase 1: DB Foundation
**Rationale:** Every other feature reads or writes the new Stripe-mirror tables. The idempotency table, bridge columns, and RLS policies must exist before any code can run against them. This is the only phase with zero UI deliverables — it is pure infrastructure that unblocks everything else.
**Delivers:** 5 new Supabase tables (`stripe_products`, `stripe_prices`, `stripe_orders`, `stripe_coupons`, `stripe_coupon_redemptions`), `webhook_events` idempotency table, `stripe_product_id` bridge column on `products`, `stripe_customer_id` on `profiles`, all RLS policies, all indices.
**Addresses:** Table stakes DB requirements; `stripe_customer_id` needed for coupon assignment and subscription lookup.
**Avoids:** RLS gaps (empty admin UI), missing idempotency table (duplicate orders), null `stripe_product_id` on existing 22 products (runtime errors in later phases).
**Flag:** Standard patterns — no additional research needed.

### Phase 2: Stripe SDK + Webhook Infrastructure
**Rationale:** The Stripe SDK singleton and webhook route must exist before any handler can be written or tested. The route should return 200 for all events (dispatcher-only) until handlers are built in Phase 3. This separation allows the webhook endpoint to be registered in the Stripe Dashboard and tested immediately.
**Delivers:** `lib/stripe/client.ts` (SDK singleton with server-only guard), `app/api/webhooks/stripe/route.ts` (raw body, signature verification, event dispatch switch, 200 response), environment variable documentation.
**Uses:** `stripe ^17.x` SDK; raw body pattern (`req.text()`).
**Avoids:** `request.json()` body parsing (Pitfall 1); middleware auth accidentally blocking the webhook route (Pitfall 6).
**Flag:** Standard patterns — well-documented raw body + constructEvent pattern.

### Phase 3: Webhook Handlers + Initial Sync
**Rationale:** With tables and the route in place, all 15 event handlers can be wired up and tested via the Stripe CLI. The initial sync utility populates the tables from existing Stripe account data before the admin UI exists — so when Phase 5 ships, the UI has real data immediately.
**Delivers:** `lib/stripe/handlers/` (products, prices, orders, subscriptions, coupons), `lib/stripe/sync.ts` (full re-sync for products, prices, coupons), all 15 event handlers with idempotent upserts.
**Implements:** Handler architecture, service-role client for writes, idempotency INSERT-before-process pattern, write-partitioning enforcement.
**Avoids:** Sync loop (Pitfall 2), race conditions (Pitfall 5), subscription cancellation mishandling (Pitfall 10), Vercel timeout on complex events (Pitfall 9 — define simple vs complex event handling here).
**Flag:** Needs careful attention — this phase has the highest concentration of critical pitfalls. Standard webhook patterns are documented, but the write-partitioning logic is GOYA-specific and must be designed explicitly.

### Phase 4: AdminShell Shop Nav
**Rationale:** The nav group can be added before any Shop pages exist (links 404 until pages are built). Adding it early lets QA verify the nav renders correctly while Shop page development happens in parallel if needed. Low risk, low effort.
**Delivers:** "Shop" collapsible dropdown in AdminShell sidebar with four child links (Orders, Products, Coupons, Analytics); `localStorage` key for expanded state; naming decision for "Shop > Products" vs "Stripe Products" vs "Listings".
**Implements:** AdminShell modification (Pattern 5 from ARCHITECTURE.md).
**Flag:** Standard patterns — no research needed.

### Phase 5: Shop Admin Pages (Orders, Products, Coupons)
**Rationale:** With populated tables and nav in place, the three transactional admin sections can be built. Orders comes first (highest user value, read-heavy). Products CRUD second (requires the price-immutability flow). Coupons third (depends on Stripe customer ID on profiles, which is in Phase 1, and the coupon/promotion code distinction from Phase 3 handlers).
**Delivers:**
- Shop > Orders: filterable table, order detail with timeline, refund action (full + partial), subscription cancel action
- Shop > Products: table over GOYA + Stripe products, edit modal (metadata only for price), new-price-version flow for amount changes, active toggle, drag-and-drop priority reordering, bulk activate/deactivate
- Shop > Coupons: list, create (calls Stripe API, stores both coupon + promotion code IDs), manual user assignment, usage history
**Uses:** `@dnd-kit/core + @dnd-kit/sortable` for drag reordering; `lib/stripe-data.ts` for read functions; Server Action pattern for mutations.
**Avoids:** Price immutability confusion (Pitfall 3), coupon/promotion code conflation (Pitfall 8), drag-and-drop writing to wrong column (must write to `products.priority`, not a new `display_order`).
**Flag:** Needs careful attention for Products price-change flow (create new Price, archive old). Otherwise standard patterns.

### Phase 6: Analytics
**Rationale:** Analytics depends on orders data (Phase 3 populates it) and is the lowest-risk, highest-visibility deliverable. It is entirely read-only (no Stripe API calls at page load), computed from local tables, and has no side-effects. Building it last gives the most data to visualize.
**Delivers:** Shop > Analytics page with MRR/ARR cards, revenue time-series chart (30/90/365d), new orders over time, role-split breakdown by member type; Recharts chart components with `'use client'` wrapper.
**Uses:** `recharts ^3.8.0`; `lib/stripe-data.ts` analytics queries; joins `stripe_orders` to `profiles` for role-split.
**Avoids:** Recharts rendered as Server Component (blank chart, hydration error).
**Flag:** Standard patterns — no research needed.

### Phase Ordering Rationale

- **Dependency chain is strict:** Tables → SDK → Handlers → UI. No step can be reordered without breaking its successor.
- **Pitfall concentration:** Phases 1–3 contain 8 of the 10 critical pitfalls. Front-loading foundation work eliminates the highest-risk decisions before any UI is built.
- **Incremental testability:** Each phase can be verified in isolation — Phase 1 with SQL queries, Phase 2 with a Stripe CLI test event, Phase 3 with all 15 event types via CLI, Phase 5 with real admin UI flows.
- **Write-partitioning must be decided in Phase 1 (documented) and enforced in Phase 3 (implemented).** Documenting the ownership boundary before any code is written prevents the sync loop pitfall from being designed in accidentally.

### Research Flags

Phases likely needing deeper attention during planning:
- **Phase 3 (Webhook Handlers):** The write-partitioning strategy (which fields Stripe owns vs GOYA owns) needs to be spelled out as an explicit table in the phase plan before implementation begins. The async processing decision (which events are "simple" inline vs "complex" queued) also needs an explicit decision log.
- **Phase 5 (Products CRUD — price-change flow):** The new-Price/archive-old-Price flow has UX implications that need to be designed before the edit form is built. Should be flagged for a UX review step within the phase.

Phases with standard patterns (no research-phase needed):
- **Phase 1 (DB Foundation):** Supabase migration patterns, RLS, and table design are well-documented and follow existing GOYA conventions.
- **Phase 2 (Webhook Infrastructure):** Raw body + constructEvent is a documented Next.js App Router pattern.
- **Phase 4 (AdminShell Nav):** Single file modification with well-understood state pattern.
- **Phase 6 (Analytics):** Recharts with `'use client'` wrapper is standard; queries are reads from populated local tables.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | npm package versions confirmed via search (not direct npm access); Stripe SDK API version mapping confirmed via GitHub releases; recharts React 19 regression issue verified |
| Features | HIGH | All table stakes and constraints derived from official Stripe API documentation; price immutability, coupon/promotion code distinction, and subscription lifecycle confirmed from Stripe docs |
| Architecture | HIGH | Webhook raw-body pattern, service-role vs server-client boundary, and idempotent upsert pattern all confirmed from official and high-quality sources; GOYA-specific structural decisions follow established patterns in the codebase |
| Pitfalls | HIGH (known patterns) / MEDIUM (async processing) | Signature verification, price immutability, and RLS gaps are verified from official docs; race condition mitigation and Vercel timeout behavior are from community sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Existing 22 products → Stripe provisioning:** The migration plan adds `stripe_product_id` as nullable. A one-time provisioning script must be written and run to populate those IDs. The script needs to handle the case where a Stripe Product already exists for a GOYA product (lookup by name or metadata) vs. needs to be created. This edge case needs a decision before Phase 1 ships.
- **`stripe.subscriptions.cancel()` vs `cancel_at_period_end`:** The Orders admin UI needs a clear UX decision on whether to expose both cancellation modes or only the safer `cancel_at_period_end`. This is a product decision, not a technical one — flag for requirements.
- **"Shop > Products" vs top-level "Products" naming:** Both exist in the admin nav. The nav label for the Stripe-synced Shop products page needs a final name ("Stripe Products", "Listings", or something else) — flag for UX/design decision before Phase 4 ships.
- **Async webhook processing infrastructure:** Pitfall 9 recommends a Vercel Cron + `webhook_events` polling approach for complex events. GOYA already uses Vercel Cron. Whether to build the async queue in Phase 3 or defer it (accepting the timeout risk during early usage) is a scope decision that should be made during Phase 3 planning.

## Sources

### Primary (HIGH confidence)
- [Stripe Webhooks — Official Docs](https://docs.stripe.com/webhooks) — signature verification, idempotency, timeout requirements, retry behavior
- [Stripe Manage Products and Prices](https://docs.stripe.com/products-prices/manage-prices) — price immutability, create-new-price pattern
- [Stripe Subscriptions Webhooks](https://docs.stripe.com/billing/subscriptions/webhooks) — subscription lifecycle, cancel_at_period_end behavior
- [Stripe Refunds API](https://docs.stripe.com/refunds) — refund constraints, partial refund limits
- [Stripe Coupons and Promotion Codes](https://docs.stripe.com/billing/subscriptions/coupons) — coupon vs promotion code distinction
- [Stripe 2025-03-31 API Changelog](https://docs.stripe.com/changelog/basil/2025-03-31/deprecate-singular-coupon-promotion-code) — deprecation of singular coupon parameter
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS policy patterns

### Secondary (MEDIUM confidence)
- [stripe-node GitHub releases](https://github.com/stripe/stripe-node/releases) — API version pinning, release cadence
- [Next.js App Router + Stripe Webhook Signature Verification](https://kitson-broadhurst.medium.com/next-js-app-router-stripe-webhook-signature-verification-ea9d59f3593f) — `request.text()` pattern confirmed
- [Supabase Stripe Webhooks Guide](https://supabase.com/docs/guides/functions/examples/stripe-webhooks) — idempotency with Postgres UNIQUE constraint
- [recharts GitHub issue #6857](https://github.com/recharts/recharts/issues/6857) — React 19.2.3 blank chart regression in 3.7.x
- [DEV: Race Condition with Stripe Webhooks](https://dev.to/belazy/the-race-condition-youre-probably-shipping-right-now-with-stripe-webhooks-mj4) — concurrent delivery analysis

### Tertiary (LOW confidence — needs validation at implementation)
- [Top 5 drag-and-drop libraries 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) — dnd-kit recommendation
- [Stripe + Next.js 2026 guide (dev.to)](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) — webhook Route Handler pattern
- [HookRelay: Fix Stripe Webhook Timeouts](https://www.hookrelay.io/guides/stripe-webhook-timeout) — Vercel 10s Hobby / 60s Pro timeout limits

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
