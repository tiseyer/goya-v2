---
phase: 15-subscriptions-page
plan: "01"
subsystem: settings/subscriptions
tags: [data-layer, server-actions, stripe, supabase, typescript]
dependency_graph:
  requires:
    - lib/stripe/client.ts
    - lib/supabase/service.ts
    - lib/supabaseServer.ts
    - supabase/migrations/20260340_stripe_tables.sql
    - supabase/migrations/20260345_upgrade_and_designations.sql
  provides:
    - app/settings/subscriptions/queries.ts (fetchSubscriptionsData, SubscriptionsData, SubscriptionItem, DesignationItem)
    - app/settings/subscriptions/actions.ts (createPortalSession, softDeleteDesignation)
  affects:
    - app/settings/subscriptions/page.tsx (Plan 02 consumer)
tech_stack:
  added: []
  patterns:
    - getSupabaseService() service role client for stripe_orders (admin-only RLS)
    - (supabase as any) cast for user_designations (not in generated types)
    - server-only import guard on queries module
    - 'use server' directive on actions module
    - auth guard via redirect('/sign-in') in server actions
key_files:
  created:
    - app/settings/subscriptions/queries.ts
    - app/settings/subscriptions/actions.ts
  modified: []
decisions:
  - "(supabase as any) cast for user_designations — table added in migration 20260345 but types/supabase.ts not regenerated; consistent with codebase pattern"
  - "getSupabaseService() in queries.ts — stripe_orders has admin-only RLS, service role required to fetch user's own orders"
  - "JS-side product classification via productName.includes('Membership') — avoids DB-level query complexity"
metrics:
  duration: "27 min"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 2
---

# Phase 15 Plan 01: Subscriptions Data Layer Summary

Data layer for the Subscriptions page: typed multi-table query using service role client, plus two server actions (Stripe Customer Portal redirect, designation soft-delete).

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create fetchSubscriptionsData query | 085a0e4 | app/settings/subscriptions/queries.ts |
| 2 | Create server actions (portal session + soft-delete) | cb79f51 | app/settings/subscriptions/actions.ts |

## What Was Built

### app/settings/subscriptions/queries.ts

Server-only module with `fetchSubscriptionsData(userId: string)` that:
1. Fetches profile (role, stripe_customer_id) via service role
2. Fetches active recurring stripe_orders for the user
3. Fetches stripe_prices and stripe_products for those order IDs
4. Classifies orders: products with "Membership" in name → baseMembership; others → additionalSubscriptions
5. Fetches school ownership via schools.owner_id
6. Fetches active user_designations (deleted_at IS NULL) with product names joined in JS

Returns `SubscriptionsData` with full typed shape ready for Plan 02 UI consumption.

### app/settings/subscriptions/actions.ts

`'use server'` module with two exported server actions:
- `createPortalSession(stripeCustomerId)` — auth guard, calls `getStripe().billingPortal.sessions.create`, returns `{ url }` for client-side redirect
- `softDeleteDesignation(designationId)` — auth guard, sets `deleted_at + deleted_by`, guards with `.eq('user_id', user.id)` and `.is('deleted_at', null)`, calls `revalidatePath`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] (supabase as any) cast for user_designations queries**
- **Found during:** Task 1 verification (TypeScript compilation)
- **Issue:** `user_designations` table added in migration 20260345 but `types/supabase.ts` not regenerated — Supabase client type-system errors on table access
- **Fix:** Applied `(supabase as any)` cast pattern consistent with `[12-06]` and `[Phase 20-01]` decisions in STATE.md; added explicit type annotation for the result rows
- **Files modified:** app/settings/subscriptions/queries.ts, app/settings/subscriptions/actions.ts
- **Commit:** 085a0e4, cb79f51

**2. [Rule 3 - Blocking] Rebase worktree onto develop before execution**
- **Found during:** Pre-execution setup
- **Issue:** Worktree `worktree-agent-a896b9fa` was on base `main` commit (07b2d79), missing `lib/stripe/client.ts`, `lib/supabase/service.ts`, `types/supabase.ts`, `app/settings/` directory
- **Fix:** `git rebase develop` to bring worktree up to date with the full codebase
- **Files modified:** n/a (git operation)
- **Commit:** n/a

## Known Stubs

None — this is a pure data layer. No UI rendering, no placeholder text.

## Self-Check: PASSED
