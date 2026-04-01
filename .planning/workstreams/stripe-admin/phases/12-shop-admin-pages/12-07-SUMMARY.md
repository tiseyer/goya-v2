---
phase: 12-shop-admin-pages
plan: 07
subsystem: payments
tags: [stripe, supabase, products, coupons, server-actions, vitest]

# Dependency graph
requires:
  - phase: 12-shop-admin-pages
    provides: createProduct server action, ProductEditForm CreateProductSection, coupon actions with promotionCodes.create

provides:
  - createLocalProduct server action that INSERTs into products table and returns real UUID
  - ProductEditForm CreateProductSection calls createLocalProduct before createProduct (no crypto.randomUUID stub)
  - All 12 coupon action tests passing with correct Stripe SDK promotionCodes.create signature

affects: [12-VERIFICATION, product-creation-flow, coupon-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Insert-then-link: createLocalProduct inserts local row first, createProduct links stripe_product_id — eliminates randomUUID stub that caused silent zero-row updates"

key-files:
  created: []
  modified:
    - app/admin/shop/products/actions.ts
    - app/admin/shop/products/[id]/ProductEditForm.tsx
    - app/admin/shop/products/actions.test.ts
    - app/admin/shop/coupons/actions.test.ts

key-decisions:
  - "createLocalProduct uses category='special' for admin-created products to satisfy NOT NULL CHECK constraint"
  - "slug generation uses name + Date.now() timestamp to ensure UNIQUE constraint is satisfied"
  - "is_active starts as false (Draft) — product becomes active after Stripe creation completes"

patterns-established:
  - "Insert-then-link pattern: always INSERT local row first to get real UUID before calling Stripe API"

requirements-completed:
  - PROD-01
  - PROD-02
  - PROD-03
  - PROD-04
  - PROD-05
  - PROD-06
  - PROD-07
  - PROD-08
  - PROD-09
  - PROD-10
  - PROD-11
  - ORD-01
  - ORD-02
  - ORD-03
  - ORD-04
  - ORD-05
  - ORD-06
  - ORD-07
  - ORD-08
  - ORD-09
  - CPN-01
  - CPN-02
  - CPN-03
  - CPN-04
  - CPN-05

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 12 Plan 07: Gap Closure Summary

**createLocalProduct server action eliminates crypto.randomUUID stub so new products get a real DB UUID before Stripe linkage; 12/12 coupon tests restored by fixing promotionCodes.create assertion to match Stripe SDK signature**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-24T11:03:00Z
- **Completed:** 2026-03-24T11:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Added `createLocalProduct` to `actions.ts` — INSERTs a row into the products table with all NOT NULL columns satisfied, returns the real Postgres UUID
- Updated `ProductEditForm.tsx` `handleCreate` to call `createLocalProduct` first, then pass the real UUID to `createProduct` — removing the `crypto.randomUUID()` stub that caused `products.update({ stripe_product_id })` to silently update zero rows
- Fixed coupon test assertion for `promotionCodes.create` from `expect.objectContaining({ coupon, code })` to the correct Stripe SDK signature `{ promotion: { type: 'coupon', coupon }, code }` — all 12 coupon tests now pass

## Task Commits

1. **Task 1: Add createLocalProduct server action and fix CreateProductSection flow** - `58d3da8` (feat)
2. **Task 2: Fix coupon promotionCodes.create test expectation** - `4e15cff` (fix)

## Files Created/Modified

- `app/admin/shop/products/actions.ts` - Added `createLocalProduct` server action before `createProduct`
- `app/admin/shop/products/[id]/ProductEditForm.tsx` - Import `createLocalProduct`, call it in `handleCreate` before `createProduct`, remove `crypto.randomUUID()` usage
- `app/admin/shop/products/actions.test.ts` - Added `createLocalProduct` to imports, added `describe('createLocalProduct', ...)` test block (9/9 tests pass)
- `app/admin/shop/coupons/actions.test.ts` - Updated `promotionCodes.create` assertion to match Stripe SDK API signature (12/12 tests pass)

## Decisions Made

- Used `category: 'special'` for admin-created products to satisfy the CHECK constraint without requiring category selection from the admin
- Slug generated as `name-lowercase-kebab + '-' + Date.now()` to guarantee UNIQUE constraint satisfaction
- `is_active` starts as `false` (Draft) — Stripe creation completes the flow and the product becomes manageable from the products list

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both verification gaps from `12-VERIFICATION.md` are now closed
- Product creation flow is complete end-to-end: local row INSERT → Stripe product/price CREATE → `stripe_product_id` linked to local row
- All coupon tests pass (12/12)
- Phase 12 shop admin pages are complete

---
*Phase: 12-shop-admin-pages*
*Completed: 2026-03-24*
