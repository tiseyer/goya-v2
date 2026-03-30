---
phase: 15-subscriptions-page
plan: "02"
subsystem: settings/subscriptions
tags: [ui, client-components, server-component, stripe, react]
dependency_graph:
  requires:
    - app/settings/subscriptions/queries.ts (fetchSubscriptionsData, SubscriptionsData, DesignationItem)
    - app/settings/subscriptions/actions.ts (createPortalSession, softDeleteDesignation)
    - lib/supabaseServer.ts
  provides:
    - app/settings/subscriptions/page.tsx (server component, live Stripe data rendering)
    - app/settings/subscriptions/PortalButton.tsx (client component, Stripe portal redirect)
    - app/settings/subscriptions/DesignationsBox.tsx (client component, designation soft-delete)
  affects:
    - /settings/subscriptions route (visible to all authenticated users)
tech_stack:
  added: []
  patterns:
    - Server component fetches data, passes to client components as props
    - Optimistic UI via local useState in DesignationsBox
    - Conditional section rendering with inline Separator component
    - window.location.href redirect after server action in PortalButton
key_files:
  created:
    - app/settings/subscriptions/PortalButton.tsx
    - app/settings/subscriptions/DesignationsBox.tsx
  modified:
    - app/settings/subscriptions/page.tsx
decisions:
  - "Inline Separator function component — no separate file needed for a single-use 4-line component"
  - "Optimistic UI in DesignationsBox (filter local state) — avoids full page reload; softDeleteDesignation still calls revalidatePath for next hard navigation"
  - "ROLE_PLAN_NAMES extended with admin/moderator entries — fixes bug in prior placeholder page which showed generic labels for these roles"
metrics:
  duration: "15 min"
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 15 Plan 02: Subscriptions UI Summary

Replaced the placeholder Subscriptions page with a fully functional server component showing live Stripe membership data, school membership, and designations — with PortalButton (Stripe Customer Portal redirect) and DesignationsBox (optimistic soft-delete) client components.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Create PortalButton and DesignationsBox client components | 524302a | app/settings/subscriptions/PortalButton.tsx, app/settings/subscriptions/DesignationsBox.tsx |
| 2 | Replace placeholder page.tsx with live data rendering | ff4d6a8 | app/settings/subscriptions/page.tsx |

## What Was Built

### app/settings/subscriptions/PortalButton.tsx

Client component (`'use client'`) that:
1. Takes `stripeCustomerId` prop
2. On click: calls `createPortalSession(stripeCustomerId)` server action
3. Redirects to returned URL via `window.location.href`
4. Shows loading state "Weiterleiten…" during redirect

### app/settings/subscriptions/DesignationsBox.tsx

Client component (`'use client'`) that:
1. Takes `designations: DesignationItem[]` prop
2. Manages local state for optimistic removal
3. Per-row Delete button calls `softDeleteDesignation(id)` then filters item from local state
4. Returns null when items array empties (no orphan rendering)

### app/settings/subscriptions/page.tsx

Server component replacing the old placeholder. Renders four conditional sections:

- **BOX 1 (always):** Base Membership with plan name (Stripe product name OR role-based fallback), price, and Verwalten button when stripeCustomerId exists
- **BOX 2 (conditional):** Additional Subscriptions list when `additionalSubscriptions.length > 0`
- **BOX 3 (conditional):** School Membership when `ownsSchool = true`
- **BOX 4 (conditional):** DesignationsBox when `designations.length > 0`

Sections separated by inline `Separator` component rendering a "+" glyph.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all sections render live data from `fetchSubscriptionsData`. BOX 4 uses a note in the plan that a separator orphan after all designations deleted is acceptable for v1.3; this is a known minor UX limitation, not a stub.

## Self-Check: PASSED
