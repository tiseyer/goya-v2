---
phase: 04
plan: 01
subsystem: analytics
tags: [ga4, event-tracking, analytics, client-side]
dependency_graph:
  requires: []
  provides: [ga4-event-tracking]
  affects: [register, sign-in, checkout, schools-create, academy-course, events, profile-settings, members, connections, flow-player]
tech_stack:
  added: [lib/analytics/events.ts]
  patterns: [thin-client-tracker-component, safe-gtag-no-op, analytics-fireforget]
key_files:
  created:
    - lib/analytics/events.ts
    - app/academy/[id]/CourseViewTracker.tsx
    - app/events/[id]/EventViewTracker.tsx
  modified:
    - app/sign-in/page.tsx
    - app/register/page.tsx
    - app/checkout/page.tsx
    - app/schools/create/SchoolCreateWizard.tsx
    - app/academy/[id]/CourseEnrollCard.tsx
    - app/academy/[id]/page.tsx
    - app/events/[id]/page.tsx
    - app/profile/settings/page.tsx
    - app/components/ConnectButton.tsx
    - app/components/flow-player/FlowPlayer.tsx
    - app/members/page.tsx
decisions:
  - Reused window.gtag global declaration from tracking.ts (avoids TS2687 duplicate modifier error)
  - Used Record<string, any> in trackEvent to match existing GtagEventParams interface
  - Course and event view tracking via thin no-render client components (RSC pages cannot fire client-side events)
  - Onboarding tracking uses flow.name as the role identifier since ActiveFlowResponse has no user role field
  - Search tracking uses 1-second debounce to avoid flooding GA4 on keystroke
  - schoolRegistrationCompleted fires before Stripe redirect (not after payment confirmation)
metrics:
  duration: ~25 min
  completed_date: 2026-04-01
  tasks_completed: 2
  files_changed: 13
---

# Phase 04 Plan 01: GA4 Event Tracking Summary

GA4 tracking utility (`lib/analytics/events.ts`) with 22 predefined events wired across all key user flows in the app.

## What Was Built

### Task 1: Analytics tracking utility

`lib/analytics/events.ts` exports:
- `trackEvent(eventName, params)` — safe wrapper around `window.gtag('event', ...)`, no-ops on SSR and when GA4 is not loaded
- `Analytics` object with 22 predefined methods across 8 domains

### Task 2: Wired tracking calls

| Flow | Event(s) | File |
|------|----------|------|
| Email sign-in | `login('email')` | `app/sign-in/page.tsx` |
| OAuth sign-in | `login('google'\|'apple')` | `app/sign-in/page.tsx` |
| Email sign-up | `signUp('email')` | `app/register/page.tsx` |
| OAuth sign-up | `signUp('google'\|'apple')` | `app/register/page.tsx` |
| Onboarding start | `onboardingStarted(flowName)` | `app/components/flow-player/FlowPlayer.tsx` |
| Onboarding complete | `onboardingCompleted(flowName)` | `app/components/flow-player/FlowPlayer.tsx` |
| Checkout page mount | `beginCheckout(total, items)` | `app/checkout/page.tsx` |
| Place order | `purchase(orderId, total, items)` | `app/checkout/page.tsx` |
| School wizard open | `schoolRegistrationStarted()` | `app/schools/create/SchoolCreateWizard.tsx` |
| School proceeds to payment | `schoolRegistrationCompleted(name)` | `app/schools/create/SchoolCreateWizard.tsx` |
| Course page view | `courseViewed(id, name)` | `CourseViewTracker.tsx` (client mount) |
| Course enroll click | `courseEnrolled(id, name)` | `app/academy/[id]/CourseEnrollCard.tsx` |
| Event page view | `eventViewed(id, name)` | `EventViewTracker.tsx` (client mount) |
| Profile save | `profileUpdated()` | `app/profile/settings/page.tsx` |
| Connect button click | `connectionRequested()` | `app/components/ConnectButton.tsx` |
| Accept connection | `connectionAccepted()` | `app/components/ConnectButton.tsx` |
| Member search | `search(query, count)` | `app/members/page.tsx` (debounced 1s) |

## Decisions Made

1. **No window.gtag re-declaration** — `tracking.ts` already declares the global; `events.ts` uses `Record<string, any>` param type to avoid conflict.
2. **Thin tracker components for RSC pages** — `CourseViewTracker` and `EventViewTracker` are tiny `'use client'` components that fire a `useEffect` and render `null`. This is the correct pattern for injecting client-side side effects into Server Component page trees.
3. **Debounced search tracking** — 1-second debounce prevents GA4 from being flooded on every keystroke.
4. **Flow name as onboarding role** — `ActiveFlowResponse` does not expose the user's role; using `flow.name` gives sufficient context to differentiate onboarding flows in GA4.
5. **schoolRegistrationCompleted fires pre-redirect** — fires before `window.location.href = result.url` so Stripe redirect doesn't lose the event.

## Deviations from Plan

None — plan executed exactly as written with one implementation detail: the `declare global { Window.gtag }` block was omitted from `events.ts` (present in the plan spec) because `tracking.ts` already declares it and TypeScript enforces identical modifiers across all declarations.

## Known Stubs

None — all events fire with real data from the surrounding component context.

## Self-Check

- [x] `lib/analytics/events.ts` — created and compiles cleanly
- [x] `app/academy/[id]/CourseViewTracker.tsx` — created
- [x] `app/events/[id]/EventViewTracker.tsx` — created
- [x] All 11 modified files compile without new TS errors
- [x] Commits: `3487c31` (events.ts), `4a56f0b` (wiring)
