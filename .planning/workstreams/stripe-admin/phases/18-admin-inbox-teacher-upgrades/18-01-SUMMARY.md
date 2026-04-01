---
phase: 18-admin-inbox-teacher-upgrades
plan: 01
subsystem: payments
tags: [stripe, server-actions, supabase, notifications, teacher-upgrade]

# Dependency graph
requires:
  - phase: 17-upgrade-page
    provides: upgrade_requests rows with stripe_payment_intent_id in pending status
  - phase: 08-db-foundation
    provides: stripe mirror tables, profiles with stripe_customer_id
provides:
  - approveUpgradeRequest server action (capture payment, create subscription, set role to teacher)
  - rejectUpgradeRequest server action (cancel payment intent, mark rejected, notify user)
affects: [18-02-teacher-upgrades-tab]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Admin-guarded server actions with role check via getSupabaseService()
    - (supabase as any) cast for untyped tables (upgrade_requests, notifications)
    - Stripe paymentIntents.capture/cancel for delayed capture flow

key-files:
  created:
    - app/admin/inbox/actions.ts
  modified: []

key-decisions:
  - "Auth guard fetches admin role via getSupabaseService() (service role) rather than session-based RLS — consistent with codebase pattern"
  - "Errors caught per-Stripe-call (capture, subscriptions.create, cancel) and returned as { success: false, error } — no redirect() per plan spec"
  - "subscription type narrowed to { id: string } to avoid TypeScript inference issues with Stripe SDK"

patterns-established:
  - "Inline try/catch per Stripe API call returns typed error — no global catch"

requirements-completed: [ADM-03, ADM-04]

# Metrics
duration: 5min
completed: 2026-03-26
---

# Phase 18 Plan 01: Admin Inbox Teacher Upgrades Actions Summary

**Admin server actions for teacher upgrade approval: Stripe delayed capture flow with subscription creation, role promotion, and per-action user notifications**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-26T00:00:00Z
- **Completed:** 2026-03-26T00:05:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `approveUpgradeRequest` server action: captures pending payment intent, creates Teacher Membership subscription (price_1TE4kfDLfij4i9P9sUpSD2Si), sets profile role to `teacher`, marks upgrade_request approved with subscription ID, notifies user
- Created `rejectUpgradeRequest` server action: cancels payment intent (no charge to user), marks upgrade_request rejected with reason, notifies user
- Both actions are admin-only guarded and revalidate `/admin/inbox` on success

## Task Commits

1. **Task 1: Create app/admin/inbox/actions.ts with approveUpgradeRequest and rejectUpgradeRequest** - `aa9bba8` (feat)

## Files Created/Modified

- `app/admin/inbox/actions.ts` - Two exported server actions powering the approve and reject flows for teacher upgrade requests

## Decisions Made

- Auth guard fetches admin role via `getSupabaseService()` (service role bypass) — consistent with codebase pattern for admin operations
- Errors returned as `{ success: false, error }` objects per plan spec — no `redirect()` used so client components can surface errors
- `(supabase as any)` cast used for `upgrade_requests` and `notifications` tables — not in generated types, consistent with codebase pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `approveUpgradeRequest` and `rejectUpgradeRequest` are ready for consumption by the Teacher Upgrades tab UI (Plan 18-02)
- No blockers

---
*Phase: 18-admin-inbox-teacher-upgrades*
*Completed: 2026-03-26*
