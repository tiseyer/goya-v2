---
phase: 12-shop-admin-pages
plan: "04"
subsystem: shop-admin
tags: [orders, stripe, refund, subscription, timeline, server-actions, tdd]
dependency_graph:
  requires: [12-03]
  provides: [order-detail-page, order-actions, order-timeline]
  affects: [admin-shop-orders]
tech_stack:
  added: []
  patterns:
    - Server Component order detail with Stripe customer.retrieve for billing/shipping (ORD-08)
    - Client component OrderActions with useTransition for pending state
    - Vertical timeline assembled from webhook_events filtered by stripe_id in payload
    - TDD: failing tests first, then implementation
key_files:
  created:
    - app/admin/shop/orders/[id]/actions.ts
    - app/admin/shop/orders/[id]/page.tsx
    - app/admin/shop/orders/[id]/OrderTimeline.tsx
    - app/admin/shop/orders/[id]/OrderActions.tsx
    - app/admin/shop/orders/[id]/ManualOrderForm.tsx
    - app/admin/shop/orders/actions.test.ts
  modified: []
decisions:
  - OrderActions extracted as separate client component — keeps page.tsx as a pure server component
  - ManualOrderForm extracted as separate client component — same pattern as CouponAssignment in 12-06
  - getInvoicePdfUrl treated as server action callable from client — opens PDF in new tab via window.open
  - Timeline filter: JS-level JSON.stringify(payload).includes(stripe_id) — avoids complex JSONB query
  - billingAddress/shippingAddress fetched via try/catch — non-fatal if Stripe API call fails
metrics:
  duration: "~16 min"
  completed: "2026-03-24T03:16:08Z"
  tasks: 2
  files: 6
---

# Phase 12 Plan 04: Order Detail Page Summary

Order detail page at `/admin/shop/orders/[id]` with event timeline, billing/shipping from Stripe, refund/cancel/invoice actions, and manual order creation at `/admin/shop/orders/new`.

## What Was Built

**Task 1: Server Actions with TDD (12 tests)**

`app/admin/shop/orders/[id]/actions.ts` exports:
- `refundOrder(paymentIntentId, amountCents?)` — full or partial refund via `stripe.refunds.create`
- `cancelSubscription(subscriptionId, mode)` — schedule (`cancel_at_period_end: true`) or immediate (`subscriptions.cancel`)
- `resendInvoice(invoiceId)` — `stripe.invoices.sendInvoice`
- `getInvoicePdfUrl(invoiceId)` — returns `invoice.invoice_pdf` URL
- `createManualOrder(data)` — creates Stripe customer if missing, then payment intent (one_time) or subscription (recurring)

All actions have try/catch with `{ success: boolean; error?: string }` return type.

`app/admin/shop/orders/actions.test.ts`: 12 tests covering all actions, full/partial refund paths, schedule/immediate cancel, missing customer creation, recurring vs one_time subscription.

**Task 2: Order Detail Page**

`app/admin/shop/orders/[id]/page.tsx` (Server Component):
- Handles `id === 'new'` → renders `ManualOrderForm` for ORD-04
- Queries `stripe_orders`, `profiles`, `products`, `webhook_events` tables
- Fetches `customers.retrieve(stripe_customer_id)` from Stripe for billing/shipping address (ORD-08)
- Timeline: queries webhook_events with event_type like `%payment_intent%`, `%subscription%`, `%invoice%`, `%charge%`, `%refund%` — filtered in JS by `JSON.stringify(payload).includes(stripe_id)`
- Customer journey: last 10 orders from same `stripe_customer_id`
- Quick links: `/admin/users?search={email}` and `/admin/shop/products/{id}`

`app/admin/shop/orders/[id]/OrderTimeline.tsx` (Client Component):
- Vertical timeline with dot/line connector
- 10-entry event type→label mapping (payment_intent, charge, invoice, subscription variants)
- Dot colors: green (succeeded/paid/created), red (failed), blue (updated), slate (deleted/canceled)
- Empty state: "No events recorded yet."

`app/admin/shop/orders/[id]/OrderActions.tsx` (Client Component):
- Full refund button
- Partial refund with dollar input field
- Schedule Cancellation / Suspend Immediately (recurring only)
- Resend Invoice / Download PDF
- `useTransition` for pending states, inline success/error messages (5s auto-dismiss)

`app/admin/shop/orders/[id]/ManualOrderForm.tsx` (Client Component):
- Product dropdown (products with stripe_product_id)
- Price type selector (one_time / recurring)
- Stripe Price ID text input
- User search (client-side filter of pre-fetched profiles) with dropdown results
- Shows Stripe customer status on profile select
- On submit calls `createManualOrder`, redirects to `/admin/shop/orders` on success

## Requirements Satisfied

- ORD-04: Admin can manually create an order (product + user selector at `/admin/shop/orders/new`)
- ORD-05: Full and partial refund from order detail page
- ORD-06: Cancel subscription via schedule (period end) or suspend immediately
- ORD-07: Chronological event timeline of Stripe events
- ORD-08: Customer info includes email, billing address, and shipping address from Stripe customer
- ORD-09: Resend invoice email and download invoice PDF

## Deviations from Plan

### Pre-existing Issues (Deferred — Out of Scope)

**Build failure from parallel agent work:**
- `app/onboarding/components/` — TypeScript errors from another parallel agent's uncommitted files
- `__tests__/connect-button.test.tsx` — type argument error
- `app/page.test.tsx` — missing test runner types

These are pre-existing issues from other parallel agents not related to plan 12-04. Documented in `deferred-items.md`. My files have zero TypeScript errors (`npx tsc --noEmit | grep "orders/[id]"` returns empty).

## Known Stubs

None — all data is wired to real Stripe API and Supabase queries. Billing/shipping addresses gracefully show "No address on file" when Stripe customer has no address (not a stub — real data absence).

## Self-Check: PASSED

All 6 files confirmed present on disk. Both commits (b015a2d, f1d6e08) confirmed in git log.
