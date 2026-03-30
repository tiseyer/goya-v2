---
phase: 17-upgrade-page
plan: "02"
subsystem: ui
tags: [react, nextjs, stripe, supabase-storage, teacher-upgrade, multi-step-form]

dependency_graph:
  requires:
    - phase: 17-01
      provides: uploadCertificate and createUpgradeCheckoutSession server actions
  provides:
    - /upgrade route (server component with role guard)
    - UpgradePage client component (3-step upgrade flow)
    - /upgrade/success confirmation page
  affects:
    - Phase 16 (CTA links to /upgrade — now resolved)
    - Phase 18 (admin inbox reads upgrade_requests created after Stripe Checkout)

tech-stack:
  added: []
  patterns:
    - Server component role guard pattern: auth + profile.role check, redirect unauthorized roles
    - Client-side multi-step state machine with useState<1|2|3>
    - FormData POST to server action per file, previewUrl via URL.createObjectURL()
    - window.location.href for Stripe Checkout redirect (not Next.js router — full page navigation)

key-files:
  created:
    - app/upgrade/page.tsx
    - app/upgrade/UpgradePage.tsx
    - app/upgrade/success/page.tsx
  modified: []

key-decisions:
  - "Client-side state machine (useState) not URL-based steps — simpler, no need for deep-linking in a sequential wizard"
  - "URL.createObjectURL() for image previews — no server round-trip, revoked on file removal"
  - "No auth required on /upgrade/success — stateless page, URL only reachable after Stripe Checkout"

patterns-established:
  - "Multi-step client wizard: useState<1|2|3> step enum, conditional rendering per step, Back/forward buttons"

requirements-completed: [UPG-03, UPG-04, UPG-05, UPG-07]

duration: 8min
completed: 2026-03-25
---

# Phase 17 Plan 02: Upgrade Page UI Summary

**Multi-step /upgrade page with role guard (student/wellness_practitioner), certificate upload to Supabase Storage, Stripe Checkout redirect, and /upgrade/success confirmation page.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-25T10:33:32Z
- **Completed:** 2026-03-25T10:41:00Z
- **Tasks:** 2 of 2 auto tasks complete (Task 3 is checkpoint:human-verify — awaiting user verification)
- **Files modified:** 3

## Accomplishments

- Role-guarded /upgrade server component: students and wellness_practitioners only; all other roles redirect to /settings/subscriptions
- UpgradePage 3-step client state machine: Step 1 (info + benefits + $39/yr price), Step 2 (certificate upload 1-3 files with progress, image previews, remove button, disabled Continue until ≥1 file), Step 3 (price summary, delayed-capture note, Stripe Checkout redirect)
- /upgrade/success page with exact UPG-07 copy: "submitted", "48 hours", "notification", Dashboard link

## Task Commits

1. **Task 1: /upgrade server page + UpgradePage client component** - `348f6d2` (feat)
2. **Task 2: /upgrade/success confirmation page** - `4d9e814` (feat)

## Files Created/Modified

- `app/upgrade/page.tsx` — Server component: createSupabaseServerClient auth, profile.role check, redirect non-eligible roles to /settings/subscriptions, renders UpgradePage
- `app/upgrade/UpgradePage.tsx` — Client component: 3-step state machine using useState<1|2|3>, file upload via FormData to uploadCertificate server action, image previews via URL.createObjectURL(), Stripe redirect via window.location.href from createUpgradeCheckoutSession
- `app/upgrade/success/page.tsx` — Static server component: checkmark icon, required confirmation copy, Dashboard link

## Decisions Made

- Client-side step state (useState) over URL-based steps — the wizard is sequential with no need for deep-linking or bookmarking individual steps
- URL.createObjectURL() for image previews — avoids server round-trip; revoked on file removal to prevent memory leaks
- No auth guard on /upgrade/success — page is stateless and contains no sensitive data; Stripe redirects here after checkout

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data paths are wired. Step 2 uploads to real Supabase Storage via uploadCertificate. Step 3 creates a real Stripe Checkout Session via createUpgradeCheckoutSession and redirects to the Stripe URL.

## Self-Check: PASSED

Files created:
- app/upgrade/page.tsx — FOUND
- app/upgrade/UpgradePage.tsx — FOUND
- app/upgrade/success/page.tsx — FOUND

Commits:
- 348f6d2 — FOUND (feat(17-02): add /upgrade server page with role guard and UpgradePage client component)
- 4d9e814 — FOUND (feat(17-02): add /upgrade/success confirmation page)

## Issues Encountered

None. TypeScript compiles clean for all three new files. Pre-existing errors in connect-button.test.tsx and app/page.test.tsx are unrelated to this plan (documented in 17-01-SUMMARY.md).

## Next Phase Readiness

- /upgrade full flow is ready for human verification (Task 3 checkpoint)
- After verification, Phase 18 (admin inbox Teacher Upgrades tab) can proceed — upgrade_requests table is populated by the 17-01 webhook handler on checkout.session.completed

---
*Phase: 17-upgrade-page*
*Completed: 2026-03-25*
