---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: milestone
status: Ready to plan
stopped_at: Completed 12-02-PLAN.md
last_updated: "2026-03-24T04:12:25.699Z"
progress:
  total_phases: 6
  completed_phases: 5
  total_plans: 15
  completed_plans: 15
---

# Project State — stripe-admin workstream

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** Phase 12 — shop-admin-pages

## Current Position

Phase: 13
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: 4.5 min
- Total execution time: 9 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 08-db-foundation | 2/2 | 9 min | 4.5 min |

*Updated after each plan completion*
| Phase 05-profile-page-buttons P02 | 8 | 1 tasks | 1 files |
| Phase 09 P01 | 2 | 1 tasks | 5 files |
| Phase 09 P02 | 3 | 1 tasks | 2 files |
| Phase 10 P02 | 162 | 2 tasks | 6 files |
| Phase 10 P03 | 4 | 3 tasks | 6 files |
| Phase 11-adminshell-shop-nav P01 | 4 | 1 tasks | 1 files |
| Phase 12 P04 | 16 | 2 tasks | 6 files |
| Phase 12 P02 | 9 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

- Supabase as cache layer; Stripe as source of truth for all payment data
- Write-partitioning: Stripe owns payment/billing fields; GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`
- Async webhook processing via Vercel Cron + `webhook_events` polling (not Inngest/Trigger.dev)
- Recharts 3.8.0+ required (3.7.x has React 19 blank-chart regression)
- `@dnd-kit` for drag-and-drop (react-beautiful-dnd is archived)
- Admin + Moderator access only for Shop admin
- USD only for v1.2
- [08-01] Omit explicit FKs on stripe_product_id/stripe_price_id/stripe_customer_id text columns — out-of-order webhook delivery would cause FK violations
- [08-01] stripe_coupon_redemptions has no updated_at column or trigger — append-only log, rows are never updated
- [08-02] No CREATE INDEX on webhook_events.stripe_event_id — UNIQUE constraint already creates B-tree index (avoids double index)
- [08-02] No updated_at on webhook_events — events are write-once; status changes are the only mutation
- [08-02] Bridge columns (products.stripe_product_id, profiles.stripe_customer_id) are nullable with no DEFAULT — existing rows have no Stripe IDs yet
- [Phase 05-profile-page-buttons]: viewerRole fallback chain matches profileRole: member_type ?? role ?? 'student' for consistency across server component queries
- [Phase 05-profile-page-buttons]: School ownership uses owner_id-only query (no profile_id join needed) — viewer owns any school combined with role==='school' is sufficient for v1.1
- [Phase 09-01]: No apiVersion argument — stripe@20.4.1 defaults to latest stable
- [Phase 09-01]: Lazy singleton in getStripe() body (not module level) prevents build crash when STRIPE_SECRET_KEY missing
- [Phase 09]: request.text() not request.json() — Stripe signs raw bytes, parsing breaks HMAC
- [Phase 09]: Missing STRIPE_WEBHOOK_SECRET returns 500 (config error) not 400 (client error)
- [Phase 09]: Phase 9 stub dispatch via console.log — idempotency + event dispatch in Phase 10
- [Phase 10]: HandlerResult type defined in subscription.ts and imported by payment-intent.ts and invoice.ts — avoids type duplication
- [Phase 10]: invoice.subscription_status=null — invoice rows track payment events, not subscription lifecycle (subscription handler owns that field)
- [Phase 10]: PostgreSQL 23505 error code used for idempotency gate (atomic single INSERT vs SELECT-then-INSERT)
- [Phase 10]: Admin sync uses CRON_SECRET bearer token (not session auth) — run from CLI or scheduled trigger
- [Phase 11-adminshell-shop-nav]: Hardcode shopOpen as named state — generic group state map deferred until second nav group is needed
- [12-01]: Status derivation: Deleted = stripe.active false; Draft = is_active false with stripe active; Published = both active
- [12-01]: Sales counts fetched via stripe_orders table, grouped in JS with Map — avoids per-product subqueries
- [12-01]: Status/type filtering applied in JS after fetching all products (enables status derivation before filter)
- [12-06]: CouponAssignment extracted as separate client component to keep page.tsx as a server component
- [12-06]: role_restrictions/product_restrictions cast via (supabase as any) — columns added in migration but types/supabase.ts not regenerated; regeneration needed before typed client can use these fields
- [12-06]: Stripe promotionCodes.create API changed to require promotion: { type: 'coupon', coupon: id } wrapper object (fixed in Plan 12-06)
- [12-02]: createProduct uses client-side crypto.randomUUID() as temp productId — full flow requires a separate insertProduct server action to create local row first
- [12-02]: stripeProduct fetched via explicit column select (not *) to avoid TypeScript inference issue with Json metadata type
- [12-02]: PriceSection shows current price as read-only; Change Price flow opens amber sub-form making destructive nature clear
- [Phase 12-shop-admin-pages]: OrderActions extracted as separate client component — keeps page.tsx as pure server component
- [Phase 12-shop-admin-pages]: billingAddress/shippingAddress from Stripe customers.retrieve wrapped in try/catch — non-fatal if Stripe API fails
- [Phase 12-shop-admin-pages]: Timeline filter: JS JSON.stringify(payload).includes(stripe_id) — avoids complex JSONB query on webhook_events

### Pending Todos

None yet.

### Blockers/Concerns

- Existing 22 products need a one-time provisioning script to populate `stripe_product_id` — decision needed before Phase 8 ships: lookup by name/metadata vs always create new
- "Shop > Products" final nav label decision — address before Phase 11 planning

## Session Continuity

Last session: 2026-03-24T03:21:00Z
Stopped at: Completed 12-02-PLAN.md
Resume file: None
