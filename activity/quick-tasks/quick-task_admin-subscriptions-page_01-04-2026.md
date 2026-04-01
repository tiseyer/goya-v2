# Quick Task: Admin Subscriptions Page

**Task ID:** 260401-lv2
**Date:** 2026-04-01
**Status:** Complete

## Description

Create the admin Subscriptions page under Shop, matching the Orders page visual style exactly. Includes migration for the subscriptions table, API route with filters, sidebar nav entry, and full page with filters/table/pagination client components.

## Solution

### Task 1: Migration + Type + Sidebar

- Created `supabase/migrations/20260401_create_subscriptions.sql` with subscriptions table DDL, indexes on user_id / stripe_customer_id / status, and RLS policies (admin full access, users can read own)
- Added `Subscription` interface to `lib/types.ts`
- Inserted Subscriptions as 2nd child of Shop group in `AdminShell.tsx` (after Orders, before Products)

### Task 2: API Route

- Created `app/api/v1/admin/subscriptions/route.ts` with GET handler supporting search, status, sort, date range, page, and limit params
- Uses `RawSubscription` type cast to handle the new table not yet in Supabase generated types
- Joins profiles via stripe_customer_id for customer names

### Task 3: Page + Client Components

- `SubscriptionsFilters.tsx` — debounced search, status dropdown, date range, sort (no price/type filters unlike orders)
- `SubscriptionsTable.tsx` — 7 columns: customer, plan+interval badge, status pill, amount, started, next payment, Stripe ID link
- `SubscriptionsPagination.tsx` — prev/next, page size selector
- `page.tsx` — server component with Supabase query, profile join, JS search filter, error state
- Empty state: "No subscriptions found. Subscriptions will appear here once imported or created via Stripe."

### Docs

Updated `docs/admin/shop.md` with full Subscriptions section, regenerated search index.

## Files Modified

- `supabase/migrations/20260401_create_subscriptions.sql` (created)
- `lib/types.ts` (added Subscription interface)
- `app/admin/components/AdminShell.tsx` (sidebar nav entry)
- `app/api/v1/admin/subscriptions/route.ts` (created)
- `app/admin/shop/subscriptions/page.tsx` (created)
- `app/admin/shop/subscriptions/SubscriptionsFilters.tsx` (created)
- `app/admin/shop/subscriptions/SubscriptionsTable.tsx` (created)
- `app/admin/shop/subscriptions/SubscriptionsPagination.tsx` (created)
- `docs/admin/shop.md` (updated with Subscriptions section)
