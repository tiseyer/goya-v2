---
phase: 30-school-registration-flow
plan: "01"
subsystem: schools
tags: [stripe, checkout, webhook, server-action, slug]
dependency_graph:
  requires: []
  provides:
    - lib/schools/slug.ts (generateSlug utility)
    - app/api/schools/check-slug/route.ts (slug uniqueness API)
    - app/schools/create/actions.ts (createSchoolCheckoutSession server action)
    - lib/stripe/handlers/checkout-session.ts (school_registration webhook handler)
    - app/schools/create/success/page.tsx (post-payment redirect page)
  affects:
    - lib/stripe/handlers/checkout-session.ts (extended with school_registration branch)
tech_stack:
  added: []
  patterns:
    - Stripe Checkout subscription mode with add_invoice_items for one-time signup fee
    - Webhook handler dispatch by metadata.type (school_registration vs teacher_upgrade)
    - Async searchParams in Next.js 15 server components
key_files:
  created:
    - lib/schools/slug.ts
    - app/api/schools/check-slug/route.ts
    - app/schools/create/actions.ts
    - app/schools/create/success/page.tsx
  modified:
    - lib/stripe/handlers/checkout-session.ts
decisions:
  - "Used Option B (2 shared price IDs: STRIPE_SCHOOL_ANNUAL_PRICE_ID + STRIPE_SCHOOL_SIGNUP_PRICE_ID) since all 8 designations share identical pricing"
  - "add_invoice_items is a valid Stripe API field but missing from SDK v20 TypeScript types; cast checkout.sessions.create to any to bypass type error"
  - "success_url includes slug param so success page redirects without querying DB, avoiding webhook race condition"
  - "School insert uses unique violation (23505) check for idempotency — duplicate webhook events are safe"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_created: 4
  files_modified: 1
---

# Phase 30 Plan 01: Server-side Foundation for School Registration — Summary

**One-liner:** Stripe Checkout subscription session with annual price + one-time signup fee per designation, webhook handler creating school/designation records, and post-payment redirect page.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Slug utility + check-slug API route | d4f8658 | lib/schools/slug.ts, app/api/schools/check-slug/route.ts |
| 2 | Stripe Checkout action + webhook handler + success page | 3301c6d | app/schools/create/actions.ts, lib/stripe/handlers/checkout-session.ts, app/schools/create/success/page.tsx |

## What Was Built

### lib/schools/slug.ts
Extracted `generateSlug(name: string): string` from the old onboarding page into a shared utility. Converts school names to URL-safe slugs: `"My Yoga School"` → `"my-yoga-school"`.

### app/api/schools/check-slug/route.ts
GET endpoint at `/api/schools/check-slug?slug=foo` returning `{ available: boolean }`. Queries the `schools` table using `createSupabaseServerClient`. Returns `{ available: false }` for empty/missing slug.

### app/schools/create/actions.ts
Server action `createSchoolCheckoutSession(schoolName, slug, designationTypes[])` that:
- Validates user auth via `createSupabaseServerActionClient`
- Reads `STRIPE_SCHOOL_ANNUAL_PRICE_ID` + `STRIPE_SCHOOL_SIGNUP_PRICE_ID` env vars
- Creates one subscription line item per designation (shared annual price)
- Adds one-time signup fee per designation via `subscription_data.add_invoice_items`
- Passes full metadata (`school_name`, `school_slug`, `designation_types`) for webhook
- Includes `slug` in `success_url` to avoid webhook race condition on redirect

### lib/stripe/handlers/checkout-session.ts
Extended to handle `metadata.type === 'school_registration'` before the existing `teacher_upgrade` branch. New `handleSchoolRegistration()` function:
1. Inserts school with `status: 'pending'`
2. Handles `23505` unique violation idempotently
3. Inserts `school_designations` rows (one per type) with `signup_fee_paid: true`
4. Updates `profiles.principal_trainer_school_id`
5. Notifies all admins with `type: 'school_registration_submitted'`

### app/schools/create/success/page.tsx
Server component with async `searchParams`. Redirects to `/schools/${slug}/onboarding` using the slug from the success URL. Fallback: queries DB by `owner_id`. If school not yet created (webhook race), shows "Setting up your school..." with `<meta httpEquiv="refresh" content="3">` auto-reload.

## Decisions Made

1. **Shared price IDs (Option B):** All 8 designations share identical pricing (€40/year + €99 signup), so 2 env vars suffice instead of 16. Stored in `STRIPE_SCHOOL_ANNUAL_PRICE_ID` and `STRIPE_SCHOOL_SIGNUP_PRICE_ID`.

2. **TypeScript cast for `add_invoice_items`:** Stripe SDK v20's `SubscriptionData` type for Checkout Sessions does not include `add_invoice_items` (it exists only on the Subscriptions resource types). Cast `checkout.sessions.create` to `any` with an explanatory comment — same pattern used in the existing webhook handler for Supabase calls.

3. **Slug in success_url:** Rather than relying on DB state, the slug is embedded in the `success_url` so the success page can redirect immediately without waiting for the webhook. Fallback DB query handles edge cases.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stripe SDK type missing add_invoice_items in Checkout SubscriptionData**
- **Found during:** Task 2
- **Issue:** `subscription_data.add_invoice_items` is a valid Stripe API field but absent from the TypeScript type definition in stripe SDK v20 for `checkout.sessions.create`. TypeScript error TS2769 prevented compilation.
- **Fix:** Cast `getStripe().checkout.sessions.create` to `any` with an inline comment explaining the reason. This is the same pattern used in the existing webhook handler.
- **Files modified:** app/schools/create/actions.ts
- **Commit:** 3301c6d

## Known Stubs

None — all env vars (`STRIPE_SCHOOL_ANNUAL_PRICE_ID`, `STRIPE_SCHOOL_SIGNUP_PRICE_ID`) are referenced by name and will be populated by the user in Stripe Dashboard. No placeholder data flows to UI rendering.

## User Setup Required

Before the checkout flow can be tested end-to-end, these env vars must be set:

| Env Var | Description | Source |
|---------|-------------|--------|
| `STRIPE_SCHOOL_ANNUAL_PRICE_ID` | Recurring EUR 40.00/year price | Stripe Dashboard → Products → Create recurring price |
| `STRIPE_SCHOOL_SIGNUP_PRICE_ID` | One-time EUR 99.00 signup fee | Stripe Dashboard → Products → Create one-time price |

## Self-Check: PASSED

All 5 files verified present. Both commits exist in git log.
