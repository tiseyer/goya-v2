---
phase: 12-shop-admin-pages
plan: "05"
subsystem: shop-admin
tags: [coupons, stripe-sync, server-actions, tdd, migration]
requirements: [CPN-01, CPN-02, CPN-03]

dependency_graph:
  requires:
    - 08-01 (stripe_coupons table)
    - 12-01 (admin shell + shop nav)
  provides:
    - Coupons list page at /admin/shop/coupons
    - createCoupon and editCoupon server actions
    - role_restrictions and product_restrictions columns on stripe_coupons
  affects:
    - stripe_coupons table (two new columns via migration)
    - lib/stripe/client.ts (consumed via getStripe())
    - lib/supabase/service.ts (consumed via getSupabaseService())

tech_stack:
  added: []
  patterns:
    - Server Component list page with Supabase query + search/sort/filter/pagination
    - Client Component table with useRouter for row navigation
    - Server Actions with 'use server' + 'server-only' guards
    - TDD: RED (tests fail) → GREEN (tests pass) pattern
    - free_product type maps to percent_off:100 in Stripe (Pitfall 6)
    - role_restrictions and product_restrictions stored as GOYA-local jsonb, never sent to Stripe

key_files:
  created:
    - supabase/migrations/20260341_coupon_restrictions.sql
    - app/admin/shop/coupons/actions.ts
    - app/admin/shop/coupons/actions.test.ts
    - app/admin/shop/coupons/page.tsx
    - app/admin/shop/coupons/CouponsTable.tsx
  modified: []

decisions:
  - role_restrictions and product_restrictions stored as jsonb with DEFAULT '{}' — GOYA-local only, never passed to Stripe API
  - CouponsFilters implemented as inline Server Component with native form submit (no client-side router push needed for filter bar)
  - CouponRow type uses snake_case field names matching DB column names for direct mapping
  - editCoupon only conditionally adds fields to localUpdate object — avoids overwriting with undefined

metrics:
  duration: 5 min
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 12 Plan 05: Coupons Page + Server Actions Summary

Coupons admin list page with create/edit server actions, Stripe sync, and migration for GOYA-local role/product restriction columns.

## What Was Built

**Task 1 (TDD):** Migration `20260341_coupon_restrictions.sql` adds `role_restrictions` and `product_restrictions` jsonb columns to `stripe_coupons`. Server Actions `createCoupon` and `editCoupon` in `actions.ts` implement full Stripe coupon lifecycle: `createCoupon` translates `free_product` discount type to `percent_off: 100` (Pitfall 6), optionally creates a Stripe promotion code when `publicCode` is provided, and upserts to `stripe_coupons` including both Stripe IDs plus GOYA-local restriction fields. `editCoupon` calls `stripe.coupons.update` with only `name` and `metadata` (Stripe limitation), then updates local row with GOYA-specific fields. 12 tests cover all coupon types, promotion code creation/omission, restriction storage, and Stripe isolation.

**Task 2:** `page.tsx` Server Component queries `stripe_coupons` with search (name/code ilike), status filter (all/active/expired), sort options, and pagination. `CouponsTable.tsx` Client Component renders all required columns: Name, Code, Type pill (Percentage/Fixed Amount/Free Product with distinct colors), Discount (formatted as "25% off", "$10.00 off", or "100% off (Free)"), Usage count with optional max, Expiry date, and Status pill (Active/Expired). Row clicks navigate to `/admin/shop/coupons/[id]`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 1258001 | feat(12-05): add coupon restrictions migration and server actions with tests |
| 2 | b3ed384 | feat(12-05): build coupons list page and table component |

## Deviations from Plan

None — plan executed exactly as written.

**Note:** `npx next build` fails due to pre-existing TypeScript errors in `app/onboarding/components/` files introduced by parallel agent work in another worktree. Zero TypeScript errors exist in the files created by this plan (`npx tsc --noEmit` produces no errors in `app/admin/shop/coupons/`).

## Known Stubs

None — all functionality is fully wired. The create/edit navigation destinations (`/admin/shop/coupons/new` and `/admin/shop/coupons/[id]`) are links to pages that will be built in future plans (12-06).

## Self-Check: PASSED

- FOUND: 20260341_coupon_restrictions.sql
- FOUND: actions.ts
- FOUND: actions.test.ts
- FOUND: page.tsx
- FOUND: CouponsTable.tsx
- FOUND: commit 1258001
- FOUND: commit b3ed384
- 12/12 tests pass
- Zero TypeScript errors in created files
