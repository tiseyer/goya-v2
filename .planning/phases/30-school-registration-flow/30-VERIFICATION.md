---
phase: 30-school-registration-flow
verified: 2026-03-31T00:00:00Z
status: human_needed
score: 5/5 must-haves verified
re_verification: false
human_verification:
  - test: "Visit /schools/create as a teacher without a school. Enter a school name and confirm the slug auto-generates below with 'goya.org/schools/' prefix. Edit the slug manually and confirm uniqueness indicator updates (spinner → green check / red X)."
    expected: "Slug auto-generates from name, manual edits are sanitized, uniqueness check shows correct state after 500ms debounce."
    why_human: "Real-time debounce behavior and visual indicator state cannot be verified by static code analysis."
  - test: "On step 2, select 3 designation cards and confirm the running total reads 'EUR 120.00/year' and 'EUR 297.00' separately, and the hint text 'Can't find your specialty? You can add more designations later.' is visible."
    expected: "Running totals update per selection, both annual and one-time lines are present, hint text is shown."
    why_human: "Multi-select toggle behavior and rendered output require browser interaction."
  - test: "Click 'Continue to Payment' with env vars STRIPE_SCHOOL_ANNUAL_PRICE_ID and STRIPE_SCHOOL_SIGNUP_PRICE_ID unset. Confirm an error banner appears with a 'Try Again' button rather than a crash."
    expected: "Error state renders cleanly; no unhandled rejection."
    why_human: "Error rendering path requires triggering the server action in a real environment."
  - test: "Visit /schools/create as a non-teacher (e.g. student) and confirm redirect to /dashboard. Visit as a teacher who already has a school and confirm the same redirect."
    expected: "Both unauthorized cases redirect to /dashboard, not showing the wizard."
    why_human: "Role-gating behavior requires authenticated sessions with specific profile states."
  - test: "After a completed Stripe payment (test mode), confirm /schools/create/success?session_id=X&slug=my-school redirects to /schools/my-school/onboarding."
    expected: "Post-payment redirect lands on onboarding. If webhook fires before the page loads, the redirect is immediate. If not, the 'Setting up your school...' message with 3-second meta refresh appears."
    why_human: "Requires Stripe test mode credentials and a live checkout session to verify the redirect chain end-to-end."
---

# Phase 30: School Registration Flow — Verification Report

**Phase Goal:** A teacher can name their school, select designations, pay via Stripe, and arrive at onboarding with a school record created.
**Verified:** 2026-03-31
**Status:** HUMAN NEEDED (all automated checks passed; 5 items require browser/Stripe verification)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Step 1 shows a name input and auto-generated editable slug with real-time uniqueness check | VERIFIED | `SchoolCreateWizard.tsx` lines 113–131: `generateSlug` called on name change, debounced `fetch('/api/schools/check-slug?slug=...')` at 500ms, `slugStatus` state drives green/red indicators |
| 2 | Step 2 shows 8 designation cards with multi-select, prices (EUR 40/year + EUR 99 signup each), and a running total | VERIFIED | `SchoolCreateWizard.tsx` lines 256–395: product grid renders `products` prop, `ANNUAL_PRICE_EUR=40`, `SIGNUP_PRICE_EUR=99` constants, `annualTotal` and `signupTotal` computed from `selectedTypes.length`, hint text `Can't find your specialty?` present at line 361 |
| 3 | Clicking Continue to Payment triggers the server action and redirects to Stripe Checkout | VERIFIED | `SchoolCreateWizard.tsx` line 460: `createSchoolCheckoutSession(schoolName, slug, selectedTypes)` called, result `url` used in `window.location.href` (line 465), draft cleared on success |
| 4 | The webhook handler creates a school record with status='pending', school_designations rows, and updates the profile | VERIFIED | `checkout-session.ts` lines 80–130: inserts `{ status: 'pending' }` into `schools`, loops over `designationTypes` inserting into `school_designations` with `signup_fee_paid: true`, updates `profiles.principal_trainer_school_id`, sends admin notifications |
| 5 | The success page redirects to /schools/[slug]/onboarding after successful payment | VERIFIED | `success/page.tsx` lines 25–39: primary path redirects via slug from URL params; fallback queries DB by `owner_id`; if school not yet created, renders meta-refresh with "Setting up your school..." |

**Score: 5/5 truths verified**

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/schools/slug.ts` | `generateSlug` utility function | VERIFIED | 3 lines, exports `generateSlug`, correct regex logic |
| `app/api/schools/check-slug/route.ts` | GET endpoint returning `{ available: boolean }` | VERIFIED | 20 lines, uses `createSupabaseServerClient`, queries `schools.slug`, returns `{ available: !data }` |
| `app/schools/create/actions.ts` | Server action for Stripe Checkout session | VERIFIED | 68 lines, `'use server'` directive, `createSchoolCheckoutSession` exported, `mode: 'subscription'`, `add_invoice_items` for signup fees, env vars read correctly |
| `lib/stripe/handlers/checkout-session.ts` | Webhook handler for `school_registration` type | VERIFIED | 157 lines, dispatches on `metadata.type === 'school_registration'` before `teacher_upgrade` branch, full `handleSchoolRegistration` implementation |
| `app/schools/create/success/page.tsx` | Post-payment redirect page | VERIFIED | 57 lines, async `searchParams`, primary slug redirect, DB fallback, meta-refresh for race condition, `PageContainer` wrapper |
| `app/schools/create/page.tsx` | Server component with auth + role gate | VERIFIED | 55 lines, auth gate, role check (`role !== 'teacher'`), `principal_trainer_school_id` check, products query, `Suspense` + `SchoolCreateWizard` |
| `app/schools/create/SchoolCreateWizard.tsx` | Multi-step wizard client component | VERIFIED | 524 lines, `'use client'`, 3-step wizard, step nav via `useSearchParams`, localStorage draft persistence |
| `app/schools/create/page 2.tsx` | DELETED — stale duplicate | VERIFIED | File does not exist |
| `app/schools/create/onboarding/page.tsx` | DELETED — replaced by Phase 31 | VERIFIED | File does not exist (empty directory remains) |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SchoolCreateWizard.tsx` | `app/schools/create/actions.ts` | `createSchoolCheckoutSession` | WIRED | Imported line 7, called line 460 |
| `SchoolCreateWizard.tsx` | `app/api/schools/check-slug/route.ts` | `fetch('/api/schools/check-slug?slug=...')` | WIRED | Line 130 |
| `SchoolCreateWizard.tsx` | `lib/schools/slug.ts` | `import generateSlug` | WIRED | Line 6, used line 115 |
| `app/schools/create/actions.ts` | `lib/stripe/client.ts` | `getStripe().checkout.sessions.create()` | WIRED | Line 40 |
| `lib/stripe/handlers/checkout-session.ts` | `lib/supabase/service.ts` | `getSupabaseService()` | WIRED | Lines 78, 82, 115, 126, 136 |
| `app/schools/create/actions.ts` | `lib/schools/slug.ts` | Not needed — slug is passed as argument from wizard | N/A | Slug is generated client-side; action receives it as a parameter |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SchoolCreateWizard.tsx` | `products` prop | `supabase.from('products').select(...).eq('category','school_designation')` in `page.tsx` line 41 | Yes — real DB query, not a static return | FLOWING |
| `SchoolCreateWizard.tsx` | `selectedTypes` | User interaction (toggle state) | N/A — user-driven state | N/A |
| `checkout-session.ts` | `designationRows` | `JSON.parse(meta.designation_types)` from Stripe session metadata | Yes — sourced from wizard's `selectedTypes` via server action metadata | FLOWING |
| `success/page.tsx` | `school.slug` (fallback) | `supabase.from('schools').select('slug').eq('owner_id', user.id)` line 31 | Yes — real DB query | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED for server-only files (no runnable entry points without a live dev server and Stripe credentials). Wiring is confirmed by static analysis above.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REG-01 | 30-01, 30-02 | School name + auto-generated slug with uniqueness check at /schools/create step 1 | SATISFIED | `slug.ts` utility + `check-slug` API + `SchoolCreateWizard.tsx` Step 1 implementation |
| REG-02 | 30-02 | Designation selection showing 8 products as cards with prices and running total | SATISFIED | `SchoolCreateWizard.tsx` Step 2: products from DB, EUR 40/99 pricing constants, `annualTotal`/`signupTotal` computed |
| REG-03 | 30-01 | Stripe Checkout session with annual subscription + signup fee per selected designation | SATISFIED | `actions.ts`: `mode: 'subscription'`, `line_items` per designation, `add_invoice_items` for signup fees |
| REG-04 | 30-01 | Post-payment: school record created with status='pending', school_designations created | SATISFIED | `checkout-session.ts` `handleSchoolRegistration`: school insert `status:'pending'`, designation rows per type, profile update |
| REG-05 | 30-01, 30-02 | Redirect to onboarding flow after successful payment | SATISFIED | `success/page.tsx` redirects to `/schools/${slug}/onboarding` |

All 5 phase requirements (REG-01 through REG-05) are accounted for. No orphaned requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/schools/create/page.tsx` | 40 | `supabase as any` for products query | Info | Required due to `products` table not being in generated TypeScript types — same pattern used throughout codebase. Does not affect runtime behavior. |
| `lib/stripe/handlers/checkout-session.ts` | 30, 39, 40, 44 | `supabase as any` and `checkout.sessions.create as any` | Info | Documented workarounds: Supabase cast is a project-wide pattern; Stripe cast addresses `add_invoice_items` missing from SDK v20 types. No stub behavior. |
| `.next/dev/types/validator.ts` | 638 | Stale `.next` cache references deleted `onboarding/page.tsx` | Warning | Stale `.next` build cache causes 2 tsc errors referencing the deleted file. Does not affect source files. Will be resolved on next `next build` or `next dev` run. |

No blocker anti-patterns found. The `as any` casts are documented workarounds with explanatory comments, not stubs.

**Pre-existing tsc errors (not introduced by this phase):** 63 errors in `.next/` cache, `app/onboarding/components/` stale duplicates, and `__tests__/connect-button.test.tsx`. Zero errors in phase-modified source files.

---

### Human Verification Required

#### 1. Step 1 — Slug generation and uniqueness check UX

**Test:** Visit `/schools/create` as a teacher without a school. Type a school name and observe the slug field below. Then manually edit the slug.
**Expected:** Slug auto-generates from the name using `generateSlug`. A spinner appears during the debounce wait. After 500ms, a green check (available) or red X (taken) appears. The Continue button only enables when the slug shows green.
**Why human:** Debounce timing, visual indicator rendering, and button enable/disable state require browser interaction to confirm.

#### 2. Step 2 — Designation cards and running total

**Test:** On step 2, select 2 then 3 designation cards and observe the running total section.
**Expected:** With 3 selected: "EUR 120.00/year" and "EUR 297.00" (one-time) shown separately. "Can't find your specialty? You can add more designations later." hint is visible. Continue to Payment button enables.
**Why human:** Multi-select toggle rendering and computed total display require interactive verification.

#### 3. Step 2 — Stripe redirect error handling

**Test:** Without `STRIPE_SCHOOL_ANNUAL_PRICE_ID` set, click "Continue to Payment" with ≥1 designation selected.
**Expected:** Loading state appears briefly, then a red error banner shows "Stripe school prices not configured" with a "Try Again" button. No crash or blank page.
**Why human:** Requires triggering the server action error path in a running environment.

#### 4. Role-gating behavior

**Test:** Visit `/schools/create` as (a) a non-teacher member and (b) a teacher who already has `principal_trainer_school_id` set.
**Expected:** Both cases redirect to `/dashboard` without rendering the wizard.
**Why human:** Requires authenticated sessions with specific profile states.

#### 5. End-to-end payment and onboarding redirect

**Test:** Complete a Stripe Checkout in test mode with valid school designation price IDs. After payment, observe the redirect.
**Expected:** `/schools/create/success?session_id=X&slug=my-school` redirects immediately to `/schools/my-school/onboarding`. The school record in Supabase has `status='pending'` and matching `school_designations` rows. `profiles.principal_trainer_school_id` is set.
**Why human:** Requires Stripe test mode credentials, real webhook delivery, and DB state inspection.

---

### Gaps Summary

No automated gaps. All 5 observable truths are verified at all four levels (existence, substantive, wired, data-flowing). The phase goal is architecturally complete. The 5 human verification items are routine UI/integration checks that cannot be confirmed by static analysis alone.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
