---
phase: 30-school-registration-flow
plan: "02"
subsystem: schools
tags: [wizard, stripe, designations, registration, client-component]
dependency_graph:
  requires:
    - lib/schools/slug.ts (generateSlug utility — from 30-01)
    - app/api/schools/check-slug/route.ts (slug uniqueness API — from 30-01)
    - app/schools/create/actions.ts (createSchoolCheckoutSession — from 30-01)
  provides:
    - app/schools/create/page.tsx (server component with auth+role gate)
    - app/schools/create/SchoolCreateWizard.tsx (3-step client wizard)
  affects:
    - docs/teacher/school-registration.md (updated with wizard docs)
tech_stack:
  added: []
  patterns:
    - URL param step navigation (useSearchParams + useRouter.push)
    - Debounced fetch for slug uniqueness check
    - localStorage draft persistence for wizard state
    - next/image for designation product images
    - Server component auth/role gate wrapping Suspense + client wizard
key_files:
  created:
    - app/schools/create/SchoolCreateWizard.tsx
  modified:
    - app/schools/create/page.tsx
  deleted:
    - app/schools/create/onboarding/page.tsx
    - app/schools/create/page 2.tsx
decisions:
  - "Wizard split into page.tsx (server, auth gate, product fetch) + SchoolCreateWizard.tsx (client) for clean RSC boundary"
  - "Step navigation via URL params (?step=2) so browser back button works and cancel_url from Stripe returns to correct step"
  - "Slug uniqueness check debounced at 500ms to avoid excessive API calls while typing"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-31"
  tasks_completed: 1
  files_created: 1
  files_modified: 1
  files_deleted: 2
---

# Phase 30 Plan 02: Multi-Step School Registration Wizard — Summary

**One-liner:** 3-step client wizard replacing the old landing page — name+slug entry with live uniqueness check, 8 designation cards with EUR pricing and running total, Stripe Checkout redirect via server action.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Multi-step registration wizard + cleanup old files | 8c41773 | app/schools/create/page.tsx, app/schools/create/SchoolCreateWizard.tsx (new), app/schools/create/onboarding/page.tsx (deleted), app/schools/create/page 2.tsx (deleted), docs/teacher/school-registration.md |

## What Was Built

### app/schools/create/page.tsx (replaced)
Server component that:
1. Auth-gates via `createSupabaseServerClient` — redirects to `/sign-in` if no session
2. Role-gates: queries `profiles` for `role` and `principal_trainer_school_id` — redirects `role !== 'teacher'` and existing school owners to `/dashboard`
3. Fetches designation products with `category = 'school_designation'` ordered by priority
4. Renders `PageContainer > Suspense > <SchoolCreateWizard products={products} />`

### app/schools/create/SchoolCreateWizard.tsx (new)
`'use client'` component with step navigation via `useSearchParams`:

**StepIndicator** — 3-step progress bar (School Name, Designations, Payment) with completed checkmarks and connector lines.

**Step 1 — School Name:**
- Name input (min 3 chars)
- Auto-generated editable slug with `goya.org/schools/` prefix display
- 500ms debounced uniqueness check against `/api/schools/check-slug`
- Green check (available) / Red X (taken) / spinner (checking) status indicators
- Continue enabled only when name ≥ 3 chars AND slug available

**Step 2 — Designations:**
- 8 product cards in 1-col/2-col responsive grid using `next/image`
- Multi-select: border+background highlight on selection, checkbox indicator
- Running total: "EUR {N*40}.00/year" and "EUR {N*99}.00" signup fee shown separately
- "Can't find your specialty? You can add more designations later." hint text
- Continue to Payment enabled when ≥ 1 designation selected

**Payment flow:**
- Calls `createSchoolCheckoutSession(schoolName, slug, selectedTypes)`
- Loading state ("Redirecting to payment...") while action executes
- On success: clears localStorage draft, `window.location.href = result.url`
- On error: shows red error banner with "Try Again" button

**State persistence:** localStorage key `school-registration-draft` with name, slug, selectedTypes. Restored on mount, cleared on successful Stripe redirect.

## Deleted Files

- `app/schools/create/onboarding/page.tsx` — old 6-step onboarding form (replaced by Phase 31 at `/schools/[slug]/onboarding`)
- `app/schools/create/page 2.tsx` — stale duplicate of old landing page

## Decisions Made

1. **Separate SchoolCreateWizard.tsx file:** Keeps RSC boundary clean — server component handles auth/data fetching, client component handles all interactive state.

2. **URL param step navigation:** `?step=2` means the browser back button navigates between wizard steps correctly, and Stripe's `cancel_url=/schools/create?step=2` returns users to the right step.

3. **Debounced slug check (500ms):** Balances responsiveness vs API call volume. Slug is re-checked on every change.

## Deviations from Plan

None — plan executed exactly as written. The wizard was kept in a separate file (`SchoolCreateWizard.tsx`) rather than inlined in `page.tsx` to keep the server/client boundary explicit.

## Known Stubs

None — all 8 designation cards are dynamic from the `products` table. Running totals are calculated from real constants (EUR 40/year, EUR 99 signup). No placeholder data flows to UI rendering.

## Checkpoint Reached

Task 2 is a `checkpoint:human-verify` gate. The wizard is complete and waiting for visual verification before the plan is marked fully done.

## Self-Check: PASSED
