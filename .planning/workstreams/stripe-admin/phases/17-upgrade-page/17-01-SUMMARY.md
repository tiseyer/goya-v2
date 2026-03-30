---
phase: 17-upgrade-page
plan: "01"
subsystem: stripe-admin
tags: [stripe, server-actions, webhook, supabase-storage, teacher-upgrade]
dependency_graph:
  requires: []
  provides:
    - uploadCertificate server action (app/upgrade/actions.ts)
    - createUpgradeCheckoutSession server action (app/upgrade/actions.ts)
    - handleCheckoutSession webhook handler (lib/stripe/handlers/checkout-session.ts)
    - checkout.session.completed dispatch in webhook route
  affects:
    - app/api/webhooks/stripe/route.ts (new event case)
    - Plan 17-02 (UI imports uploadCertificate + createUpgradeCheckoutSession)
    - Plan 18 (admin inbox reads upgrade_requests created by handleCheckoutSession)
tech_stack:
  added: []
  patterns:
    - TDD with vitest and vi.hoisted() for mock isolation
    - server-only import in webhook handlers (prevents client bundle inclusion)
    - getSupabaseService() in webhook handler (bypasses RLS, correct for server-only context)
    - createSupabaseServerActionClient() in server actions (auth-aware, reads cookies)
    - (supabase as any) cast for upgrade_requests table (not yet in generated types)
key_files:
  created:
    - app/upgrade/actions.ts
    - lib/stripe/handlers/checkout-session.ts
    - __tests__/upgrade-actions.test.ts
  modified:
    - app/api/webhooks/stripe/route.ts
decisions:
  - mode:payment with capture_method:manual for delayed capture — subscription created on admin approval (Phase 18)
  - (supabase as any) cast for upgrade_requests and notifications tables — not in generated types; consistent with codebase pattern
  - No revalidatePath in server actions — DB write happens in webhook handler, not at action time
  - Stripe.Checkout.Session (not Stripe.CheckoutSession) — correct type per stripe@20.x SDK
metrics:
  duration: "21 min"
  completed: "2026-03-25"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 17 Plan 01: Server-Side Data Layer for Teacher Upgrade Flow Summary

**One-liner:** Stripe Checkout Session creation with mode:payment + capture_method:manual, Supabase Storage certificate upload, and checkout.session.completed webhook handler that inserts upgrade_requests and notifies admins.

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Server actions — uploadCertificate + createUpgradeCheckoutSession | b8a57b6 | app/upgrade/actions.ts, __tests__/upgrade-actions.test.ts |
| 2 | Webhook handler for checkout.session.completed + wire into dispatch | 52fd2e5 | lib/stripe/handlers/checkout-session.ts, app/api/webhooks/stripe/route.ts |

## What Was Built

**app/upgrade/actions.ts** — Two `'use server'` exports:
- `uploadCertificate(formData)` — validates file (4MB max, pdf/jpeg/png/webp), uploads to `upgrade-certificates/{user_id}/{timestamp}-{filename}`, returns `{ url }` or `{ error }`
- `createUpgradeCheckoutSession(certificateUrls)` — auth-guarded, creates Stripe Checkout Session with `mode:'payment'`, `capture_method:'manual'`, price `price_1TE4kfDLfij4i9P9sUpSD2Si`, `teacher_upgrade` metadata including serialized `certificate_urls`

**lib/stripe/handlers/checkout-session.ts** — `handleCheckoutSession` webhook handler:
- Guards on `session.metadata?.type !== 'teacher_upgrade'` (early return for non-upgrade sessions)
- Inserts `upgrade_requests` row: `user_id`, `certificate_urls[]`, `stripe_payment_intent_id`, `status` defaults to `'pending'`
- Fetches all admin profiles and inserts `notifications` rows with `type: 'teacher_upgrade_submitted'`
- No payment capture, no role change — admin approval handles that in Phase 18

**app/api/webhooks/stripe/route.ts** — Added `checkout.session.completed` case to `dispatchEvent` switch, routing to `handleCheckoutSession`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe type Stripe.CheckoutSession does not exist**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** `Stripe.CheckoutSession` is not an exported member of the stripe SDK — the correct type under stripe@20.x is `Stripe.Checkout.Session`
- **Fix:** Changed cast in checkout-session.ts from `Stripe.CheckoutSession` to `Stripe.Checkout.Session`
- **Files modified:** lib/stripe/handlers/checkout-session.ts
- **Commit:** 52fd2e5

**2. [Rule 1 - Bug] vitest mock hoisting caused ReferenceError for mockGetUser**
- **Found during:** Task 1 TDD RED phase — test suite failed to collect
- **Issue:** `vi.mock` factory functions are hoisted before variable declarations; top-level `const mockGetUser = vi.fn()` was accessed before initialization
- **Fix:** Replaced plain `const` declarations with `vi.hoisted()` to create mock functions that are safe to reference in hoisted `vi.mock` factories
- **Files modified:** __tests__/upgrade-actions.test.ts
- **Commit:** b8a57b6

## Pre-existing Issues (Out of Scope)

The following TypeScript errors exist in the codebase before this plan and are unrelated to our changes:
- `app/page.test.tsx` — missing vitest globals type setup
- `__tests__/connect-button.test.tsx` — stale `ConnectionsContextType` export reference

These were logged as pre-existing and not modified.

## Known Stubs

None — all data paths are wired. `uploadCertificate` returns real Supabase Storage URLs. `createUpgradeCheckoutSession` returns a real Stripe Checkout URL. `handleCheckoutSession` inserts real DB rows.

## Self-Check: PASSED

Files created:
- app/upgrade/actions.ts — FOUND
- lib/stripe/handlers/checkout-session.ts — FOUND
- __tests__/upgrade-actions.test.ts — FOUND

Commits:
- b8a57b6 — FOUND (feat(17-01): add uploadCertificate and createUpgradeCheckoutSession server actions)
- 52fd2e5 — FOUND (feat(17-01): add handleCheckoutSession webhook handler and wire into dispatch)
