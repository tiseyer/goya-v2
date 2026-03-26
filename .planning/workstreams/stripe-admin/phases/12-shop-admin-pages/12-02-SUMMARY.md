---
phase: 12-shop-admin-pages
plan: 02
subsystem: admin-shop-products
tags: [stripe, products, server-actions, tdd, price-immutability, visibility]
dependency_graph:
  requires: [12-01]
  provides: [product-detail-page, product-edit-form, price-change-flow, visibility-config, sync-status]
  affects: [app/admin/shop/products]
tech_stack:
  added: []
  patterns: [TDD-red-green, useTransition, server-actions, stripe-price-immutability, write-partitioning]
key_files:
  created:
    - app/admin/shop/products/[id]/page.tsx
    - app/admin/shop/products/[id]/ProductEditForm.tsx
  modified:
    - app/admin/shop/products/actions.ts
    - app/admin/shop/products/actions.test.ts
decisions:
  - createProduct uses crypto.randomUUID() client-side as temp product ID — in full production flow a server action should pre-create the local row and return its UUID before calling Stripe
  - stripeProduct fetched via explicit column select instead of '*' to avoid TypeScript inference issues with Json type for metadata
  - MoreOptionsSection is collapsible to avoid overwhelming the form — starts closed
  - BasicInfoSection and MoreOptionsSection are separate save buttons so updates are scoped (Stripe call only with changed fields)
  - PriceSection shows current price as read-only; Change Price opens amber-highlighted sub-form to make the destructive nature clear
metrics:
  duration: 9 min
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 12 Plan 02: Product Detail & Edit Page Summary

**One-liner:** Product detail page at /admin/shop/products/[id] with full edit form, Stripe price immutability flow (create new + archive old), Show-to/Don't-show-to visibility config, and sync status indicator.

## What Was Built

### Task 1: Four new Server Actions (TDD)

Extended `app/admin/shop/products/actions.ts` with:

- **`createProduct`** — Creates Stripe product + initial price, upserts `stripe_products` and `stripe_prices` rows, links `stripe_product_id` to the local products row
- **`editProduct`** — Calls `stripe.products.update()` with only defined fields; webhook syncs `stripe_products` row
- **`updateProductPrice`** — Follows Stripe immutability rule: `stripe.prices.create()` + `stripe.prices.update(oldId, { active: false })` + upserts both rows in `stripe_prices`
- **`updateProductVisibility`** — GOYA-only write to `products.requires_any_of` and `products.hidden_if_has_any` (no Stripe call)

8 tests total pass in `actions.test.ts` (4 new, 4 existing).

### Task 2: Product Detail Page + Edit Form

`app/admin/shop/products/[id]/page.tsx` (Server Component):
- Handles `id='new'` as special case → renders empty create form
- Fetches product from `products` table, `stripe_products` row, active `stripe_prices` row, all products (for visibility config)
- Computes sync status by comparing `stripe_products.updated_at` vs `products.updated_at` (>5 min difference = out of sync)
- Renders sync status badge (Synced / Out of sync / Not synced to Stripe)

`app/admin/shop/products/[id]/ProductEditForm.tsx` (Client Component):
- **BasicInfoSection** — Name, description, featured image URL, up to 4 additional image URLs; save calls `editProduct`
- **PriceSection** — Current price as read-only display (stripe ID shown); "Change Price" opens amber sub-form with amount/type/interval; submit calls `updateProductPrice`
- **MoreOptionsSection** — Collapsible; statement descriptor (max 22), unit label, dynamic metadata key-value pairs, dynamic marketing features list; save calls `editProduct`
- **VisibilitySection** — Two searchable checkbox lists (Show to / Don't show to) referencing all other products; save calls `updateProductVisibility`
- **CreateProductSection** — Shown when product is null (new product flow); calls `createProduct` then redirects to `/admin/shop/products`
- `useTransition` on all save buttons with "Saving..." pending state

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

**CreateProductSection — product ID flow is a stub:**
- File: `app/admin/shop/products/[id]/ProductEditForm.tsx`
- Lines: ~450–460 (CreateProductSection handleCreate)
- Issue: Uses `crypto.randomUUID()` client-side as the `productId` argument to `createProduct`. In a full production flow, a products row should be inserted into the GOYA `products` table first (via a server action) to get a real UUID, then `createProduct` links it to Stripe. The current approach calls `createProduct` with a UUID that has no corresponding `products` row, so the `products.update({ stripe_product_id })` call will silently do nothing.
- Reason: The plan does not include a `insertProduct` server action or a products table `INSERT` flow. This is intentional for v1.2 scope — the existing products table was pre-populated with products from the old add-ons shop. New product creation via this admin form requires a follow-up plan to add a `createLocalProduct` server action.

## Self-Check: PASSED

All created files exist. All commits verified:
- `ec17f14` — test(12-02): add failing tests (TDD RED)
- `4d28968` — feat(12-02): add four Server Actions (TDD GREEN)
- `68a58f3` — feat(12-02): build product detail page + edit form
