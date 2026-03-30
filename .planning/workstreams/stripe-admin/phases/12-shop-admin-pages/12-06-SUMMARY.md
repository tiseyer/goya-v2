---
phase: 12-shop-admin-pages
plan: "06"
subsystem: shop-admin
tags: [coupons, admin, server-actions, supabase]
depends_on: [12-05]
provides: [coupon-detail-page, coupon-form, coupon-assignment, redemption-history]
affects: [admin-shop-coupons]
tech_stack:
  added: []
  patterns: [server-component, client-component, server-action, useTransition]
key_files:
  created:
    - app/admin/shop/coupons/[id]/actions.ts
    - app/admin/shop/coupons/[id]/page.tsx
    - app/admin/shop/coupons/[id]/CouponForm.tsx
    - app/admin/shop/coupons/[id]/CouponAssignment.tsx
  modified:
    - app/admin/shop/coupons/actions.ts
decisions:
  - "CouponAssignment extracted as separate client component to keep page.tsx server-only"
  - "role_restrictions and product_restrictions cast via (supabase as any) — not in generated types yet (migration ran, types not regenerated)"
  - "CouponForm uses href='/admin/shop/coupons' for Cancel to avoid client-side navigation dependency"
metrics:
  duration: "~25 min"
  completed: "2026-03-24"
  tasks_completed: 1
  files_created: 4
  files_modified: 1
requirements: [CPN-04, CPN-05]
---

# Phase 12 Plan 06: Coupon Detail Page Summary

Coupon detail page at `/admin/shop/coupons/[id]` with full create/edit form (role restrictions whitelist/blacklist + product restrictions whitelist/blacklist per CPN-02), manual user assignment action writing to `stripe_coupon_redemptions` (append-only, CPN-04), and redemption history with user names, dates, and order links (CPN-05).

## What Was Built

### app/admin/shop/coupons/[id]/actions.ts
Server Action `assignCoupon(stripeCouponId, userId)` that performs an append-only INSERT into `stripe_coupon_redemptions` and increments `times_redeemed` on `stripe_coupons`. Returns `{ success, error? }`.

### app/admin/shop/coupons/[id]/page.tsx
Server Component that:
- Handles `/admin/shop/coupons/new` for coupon creation (renders CouponForm with null coupon)
- For existing coupons: fetches coupon by UUID, redemption history, enriches with profile names and order data
- Fetches all products for product restrictions multi-select
- Fetches first 200 profiles for assignment dropdown
- Renders 2-column layout: form (2/3) + assignment + history (1/3)

### app/admin/shop/coupons/[id]/CouponForm.tsx
Client Component with all coupon fields:
- Internal name, public code, discount type (percent/amount/free_product), percent off, amount off, duration (once/forever/repeating), duration in months, single-use toggle, max redemptions, expiry date
- Role Restrictions section: mode radio (none/whitelist/blacklist) + checkbox group of 4 GOYA roles (student/teacher/wellness_practitioner/school)
- Product Restrictions section: mode radio (none/whitelist/blacklist) + searchable checkbox list of all products
- Edit mode: discount fields disabled with warning banner; role/product restrictions always editable
- `useTransition` for pending state; calls `createCoupon` or `editCoupon` then redirects

### app/admin/shop/coupons/[id]/CouponAssignment.tsx
Client Component with searchable user dropdown (filters by name/email, shows top 20 results) and Assign button. Calls `assignCoupon` server action and shows success/error feedback inline.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Stripe promotionCodes.create API signature**
- **Found during:** Build verification
- **Issue:** `stripe.promotionCodes.create({ coupon: id, code })` — the `coupon` top-level field was removed in the current Stripe SDK version (20.4.1). The new API requires `{ promotion: { type: 'coupon', coupon: id }, code }`.
- **Fix:** Updated the call in `app/admin/shop/coupons/actions.ts` to use the `promotion` wrapper object.
- **Files modified:** `app/admin/shop/coupons/actions.ts`
- **Commit:** 396b0fe

**2. [Rule 1 - Bug] Fixed Supabase typed client rejecting Record<string, unknown> for upsert/update**
- **Found during:** Build verification
- **Issue:** The `stripe_coupons` table has `role_restrictions` and `product_restrictions` columns added via migration but the generated `types/supabase.ts` was not regenerated. The Supabase typed client rejects `as Record<string, unknown>` since it doesn't satisfy the Insert/Update types.
- **Fix:** Cast the supabase client with `(getSupabaseService() as any)` and `localUpdate: any` for both `upsert` and `update` calls to allow the extra GOYA-local columns.
- **Files modified:** `app/admin/shop/coupons/actions.ts`
- **Commit:** 396b0fe

## Known Stubs

None — all data is wired to real Supabase queries.

## Self-Check: PASSED

Files created:
- FOUND: app/admin/shop/coupons/[id]/actions.ts
- FOUND: app/admin/shop/coupons/[id]/page.tsx
- FOUND: app/admin/shop/coupons/[id]/CouponForm.tsx
- FOUND: app/admin/shop/coupons/[id]/CouponAssignment.tsx

Commit: 396b0fe — verified in git log
