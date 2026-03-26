---
phase: 16-upgrade-cta
plan: 01
subsystem: ui
tags: [stripe, supabase, upgrade-flow, teacher-membership, roles]

# Dependency graph
requires:
  - phase: 15-subscriptions-page
    provides: fetchSubscriptionsData, SubscriptionsData type, subscriptions page layout
  - phase: 19-upgrade-requests
    provides: upgrade_requests table with status CHECK ('pending','approved','rejected')
provides:
  - hasPendingUpgrade boolean in SubscriptionsData returned by fetchSubscriptionsData
  - Upgrade CTA card on /settings/subscriptions for student/wellness_practitioner below BOX 1
  - Pending info card replaces CTA when upgrade request is pending
  - Teacher Membership product filtered in /addons by role + pending state
  - upgradeHref prop on ProductCard routes Teacher Membership to /upgrade
affects: [17-upgrade-page, phase-16]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase as any cast for untyped tables, name-based product matching with Stripe ID fallback]

key-files:
  created: []
  modified:
    - app/settings/subscriptions/queries.ts
    - app/settings/subscriptions/page.tsx
    - app/addons/page.tsx

key-decisions:
  - "Name-based Teacher Membership match (includes 'teacher' && 'membership') used as primary filter since local products table stripe_product_id is nullable (22 existing products unprovided); Stripe ID check added as secondary"
  - "hasPendingUpgrade query uses (supabase as any) cast — upgrade_requests not in generated types, consistent with codebase pattern"
  - "addons page uses user-scoped supabase client (not service role) for upgrade_requests — RLS policy allows users to read their own rows"
  - "isStaff check included in Teacher Membership filter — admin/moderator bypass isProductVisible but should still not see upgrade-only product"

patterns-established:
  - "Upgrade eligibility: role === 'student' || role === 'wellness_practitioner'"
  - "Teacher Membership product ID: prod_UCTigELsOhovuE (constant TEACHER_MEMBERSHIP_PRODUCT_ID)"
  - "Pending upgrade gate: hasPendingUpgrade suppresses all upgrade entry points"

requirements-completed: [UPG-01, UPG-02, UPG-08]

# Metrics
duration: 12min
completed: 2026-03-25
---

# Phase 16 Plan 01: Upgrade CTA Summary

**Upgrade entry points gated by role and pending state: CTA card on subscriptions page and conditional Teacher Membership visibility in /addons for student/wellness_practitioner only**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-25T00:00:00Z
- **Completed:** 2026-03-25T00:12:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Extended `fetchSubscriptionsData` with `hasPendingUpgrade` boolean from live `upgrade_requests` query
- Added upgrade CTA card and pending info card to `/settings/subscriptions` below BOX 1 for eligible roles
- Filtered Teacher Membership from `/addons` for ineligible users and users with pending requests; button reads "Upgrade" and links to `/upgrade`

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend fetchSubscriptionsData to include hasPendingUpgrade** - `625278e` (feat)
2. **Task 2: Add upgrade CTA and pending info card to Subscriptions page** - `ba95ee4` (feat)
3. **Task 3: Conditionally show Teacher Membership in /addons based on role and pending state** - `a9058ed` (feat)
4. **Comment fix for grep discoverability** - `5a90c4f` (fix)

## Files Created/Modified

- `app/settings/subscriptions/queries.ts` - Added `hasPendingUpgrade: boolean` to `SubscriptionsData` type; added Step 8 querying `upgrade_requests` table
- `app/settings/subscriptions/page.tsx` - Destructured `hasPendingUpgrade`; defined `isUpgradeEligible`; inserted conditional CTA/pending block below BOX 1
- `app/addons/page.tsx` - Added pending upgrade check; `isUpgradeEligible` constant; `filteredProducts` with Teacher Membership gate; `upgradeHref` prop on `ProductCard`; "Upgrade" button label for Teacher Membership

## Decisions Made

- Name-based Teacher Membership match (`includes('teacher') && includes('membership')`) used since `stripe_product_id` on local `products` table is nullable for existing 22 products; Stripe ID `prod_UCTigELsOhovuE` added as secondary check for future-proofing
- `isStaff` guard explicitly included in Teacher Membership filter even though staff bypasses `isProductVisible` — makes the intent unambiguous
- `(supabase as any)` cast for `upgrade_requests` consistent with `user_designations` pattern established in Phase 15

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in `__tests__/connect-button.test.tsx`, `app/page.test.tsx`, and `lib/audit.ts` exist but are out of scope — not caused by these changes. All three modified files compile cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Upgrade entry points are gated and live — Phase 17 can build the `/upgrade` multi-step flow
- The `/upgrade` route referenced by both CTA button and Teacher Membership card will 404 until Phase 17 ships
- `hasPendingUpgrade` is available in `SubscriptionsData` for any future use on the subscriptions page

---
*Phase: 16-upgrade-cta*
*Completed: 2026-03-25*
