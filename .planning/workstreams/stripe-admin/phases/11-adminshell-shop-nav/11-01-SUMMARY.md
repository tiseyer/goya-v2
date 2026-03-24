---
phase: 11-adminshell-shop-nav
plan: 01
subsystem: ui
tags: [react, nextjs, sidebar, navigation, typescript]

# Dependency graph
requires: []
provides:
  - Collapsible Shop nav group in AdminShell sidebar (Orders, Products, Coupons, Analytics)
  - NavLink/NavGroup/NavItem TypeScript union types for typed nav items
  - shopOpen state with auto-expand when on /admin/shop/* paths
affects: [12-shop-products, 13-shop-orders-coupons-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - NavItem union type (NavLink | NavGroup) allows sidebar to render both flat links and collapsible groups
    - Group auto-expand via useEffect watching pathname.startsWith('/admin/shop')

key-files:
  created: []
  modified:
    - app/admin/components/AdminShell.tsx

key-decisions:
  - "Hardcode shopOpen as the only group state — generic group state deferred until a second group is needed"
  - "Children hidden in collapsed sidebar mode — consistent with plan spec and sidebar space constraints"
  - "Pre-existing build error in stripe-sync/route.ts (stripe_products types) is out of scope — deferred to Phase 12"

patterns-established:
  - "NavItem union type: add type: 'link' | 'group' discriminator; group has children array; link has href"
  - "Group auto-expand pattern: useEffect + pathname.startsWith() to open group on navigation"

requirements-completed: [NAV-01, NAV-02, NAV-03]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 11 Plan 01: AdminShell Shop Nav Summary

**Collapsible Shop nav group added to AdminShell sidebar with TypeScript union types, replacing the legacy flat Products link**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-24T01:25:53Z
- **Completed:** 2026-03-24T01:29:00Z
- **Tasks:** 1 of 2 complete (Task 2 is checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments
- Added `NavLink | NavGroup | NavItem` union types enabling typed mixed navigation items
- Inserted Shop collapsible group after Courses with four children: Orders, Products, Coupons, Analytics
- Removed legacy top-level `/admin/products` nav item (NAV-02)
- shopOpen state with auto-expand useEffect when pathname starts with `/admin/shop`
- Chevron rotates 180deg when group is open; children hidden when sidebar is collapsed
- All acceptance criteria verified before commit

## Task Commits

Each task was committed atomically:

1. **Task 1: Add collapsible Shop nav group to AdminShell sidebar** - `14d42aa` (feat)

**Plan metadata:** (pending — checkpoint hit at Task 2)

## Files Created/Modified
- `app/admin/components/AdminShell.tsx` - Added NavLink/NavGroup types, Shop group, shopOpen state, updated nav rendering

## Decisions Made
- Hardcoded `shopOpen` as named state rather than a generic group state map — keeps complexity minimal; a second nav group would warrant refactor
- Shop children are hidden when sidebar is collapsed (collapsed shows icon only) — consistent with plan spec
- Pre-existing TypeScript error in `app/api/admin/stripe-sync/route.ts` (stripe_products table missing from Supabase types) is out of scope; logged in deferred-items.md

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**Pre-existing build error (out of scope):**
- `app/api/admin/stripe-sync/route.ts:40` — TypeScript error: `stripe_products` table not in generated Supabase types, causing upsert to type `never`
- Confirmed pre-existing by git stash test
- Will be resolved in Phase 12 when `stripe_products` DB table is created and types regenerated
- Logged in: `.planning/workstreams/stripe-admin/phases/11-adminshell-shop-nav/deferred-items.md`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- AdminShell sidebar now has Shop nav group; Phase 12 (Shop > Products) and Phase 13 (Orders/Coupons/Analytics) pages can be navigated immediately
- The pre-existing `stripe_products` TypeScript error will be resolved when Phase 12 creates the DB table and regenerates types

---
*Phase: 11-adminshell-shop-nav*
*Completed: 2026-03-24*
