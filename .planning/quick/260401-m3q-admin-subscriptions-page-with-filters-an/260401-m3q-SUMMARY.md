---
phase: quick
plan: 260401-m3q
subsystem: admin-shop
tags: [subscriptions, admin, ui, stripe]
one_liner: "Subscriptions table with customer links, interval-suffixed amounts, middle-truncated Stripe IDs, corrected badge colors, and human-friendly status filter labels"
key_files:
  modified:
    - app/admin/shop/subscriptions/page.tsx
    - app/admin/shop/subscriptions/SubscriptionsTable.tsx
    - app/admin/shop/subscriptions/SubscriptionsFilters.tsx
    - app/api/v1/admin/subscriptions/route.ts
decisions:
  - "Dual profile lookup: first by stripe_customer_id, then fallback by user_id for subs without a Stripe customer"
  - "resolvedUserId prefers profile.id from stripe lookup over raw s.user_id to ensure UUID correctness"
  - "Route Handler req.nextUrl.searchParams is synchronous — no await needed (validator false positive)"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_modified: 4
---

# Quick Task 260401-m3q: Admin Subscriptions Page Refinements Summary

## What Was Done

Refined the existing admin Subscriptions page (`/admin/shop/subscriptions`) to match the task spec exactly. The page skeleton and all components already existed from quick task 260401-lv2; this task addressed the delta.

## Changes by File

### app/admin/shop/subscriptions/page.tsx
- Added `user_id: string | null` to `RawSubscription` type
- Added dual profile lookup: primary by `stripe_customer_id`, fallback by `user_id` for subs without a Stripe customer
- `profileMap` now keyed by both `stripe_customer_id` and `id` for easy lookup
- Added `userId: resolvedUserId` to each `SubscriptionRow` in the merge step

### app/admin/shop/subscriptions/SubscriptionsTable.tsx
- Added `userId: string | null` to `SubscriptionRow` type
- Customer column: wraps name in `<Link href="/admin/users/[userId]">` when `userId` is present; falls back to plain text
- Amount column: now renders `$39.00/year` or `$9.99/month` format
- Stripe ID column: uses middle-truncation `sub_1ABC...XYZ` (8 chars + `...` + last 3)
- Status badge colors updated per spec:
  - `canceled`: red (was slate)
  - `past_due`: red (was amber)
  - `incomplete`: yellow (was red)
  - `paused`: amber (was gray)

### app/admin/shop/subscriptions/SubscriptionsFilters.tsx
- Reordered status options to task spec priority: All Status, Active, Cancelled, Pending, Past Due, Trialing, Paused, Unpaid
- Human-friendly labels: "Cancelled" (value=`canceled`), "Pending" (value=`incomplete`)
- Filter values match migration CHECK constraint exactly

### app/api/v1/admin/subscriptions/route.ts
- Added `user_id: string | null` to `RawSubscription` type
- Added `userId: string | null` to `SubscriptionRow` type
- Same dual profile lookup logic as page.tsx

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 16d13d0 | Add user_id to subscriptions data flow and refine table UI |
| Task 2 | 7c370f9 | Reorder status filter options with human-friendly labels |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All data is wired from the database via the Supabase service client.

## Self-Check: PASSED

- `app/admin/shop/subscriptions/SubscriptionsTable.tsx` — exists, userId field added
- `app/admin/shop/subscriptions/page.tsx` — exists, user_id in RawSubscription type
- `app/admin/shop/subscriptions/SubscriptionsFilters.tsx` — exists, reordered options
- `app/api/v1/admin/subscriptions/route.ts` — exists, userId in SubscriptionRow
- Commit 16d13d0 — verified in git log
- Commit 7c370f9 — verified in git log
- `npx tsc --noEmit` — 0 errors
