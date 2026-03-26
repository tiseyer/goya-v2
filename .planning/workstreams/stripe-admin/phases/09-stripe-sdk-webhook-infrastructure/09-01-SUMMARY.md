---
phase: 09-stripe-sdk-webhook-infrastructure
plan: "01"
subsystem: stripe
tags: [stripe, sdk, singleton, server-only, testing]
dependency_graph:
  requires: [DB-04]
  provides: [lib/stripe/client.ts, getStripe singleton]
  affects: [phase-10-webhook-handler, all future Stripe API calls]
tech_stack:
  added: [stripe@20.4.1, server-only@0.0.1]
  patterns: [lazy singleton, server-only guard, vitest path alias]
key_files:
  created:
    - lib/stripe/client.ts
    - lib/stripe/client.test.ts
  modified:
    - vitest.config.ts
    - package.json
    - package-lock.json
decisions:
  - No apiVersion argument — stripe@20.4.1 defaults to latest stable
  - Lazy init inside function body (not module level) to avoid build crashes when env var missing
  - Follows exact lazy singleton pattern from lib/supabase/service.ts
metrics:
  duration: "2 min"
  completed: "2026-03-23"
  tasks_completed: 1
  files_created: 2
  files_modified: 3
---

# Phase 09 Plan 01: Stripe SDK Singleton Summary

Server-only Stripe SDK singleton with `import 'server-only'` guard, lazy initialization pattern matching existing Supabase/Resend clients, and full unit test coverage via vitest with mocked Stripe constructor.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Install stripe + server-only, create singleton with tests | 56c21b7 | Done |

## What Was Built

### `lib/stripe/client.ts`

Exports `getStripe()` — a lazy singleton that:
- Guards against client-component import via `import 'server-only'` (build-time error if imported in Client Components)
- Throws `Error('STRIPE_SECRET_KEY is not set')` when env var is missing
- Creates and caches a `Stripe` instance on first call, returns cached instance on subsequent calls
- Follows the identical pattern to `lib/supabase/service.ts` and `lib/email/client.ts`

### `lib/stripe/client.test.ts`

3 unit tests (all passing):
- Returns a Stripe instance when `STRIPE_SECRET_KEY` is set
- Throws when `STRIPE_SECRET_KEY` is not set
- Returns the same instance on repeated calls (singleton — `toBe` identity check)

Uses `vi.resetModules()` + dynamic `import()` per test to get a fresh module with clean singleton state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `@/` path alias to vitest.config.ts**
- **Found during:** Task 1 (RED phase)
- **Issue:** Test file uses `import('@/lib/stripe/client')` but vitest.config.ts had no path alias configured, causing a vite:import-analysis error
- **Fix:** Added `resolve.alias` with `@` → `.` (project root) to vitest.config.ts, matching the tsconfig.json `paths` config
- **Files modified:** `vitest.config.ts`
- **Commit:** e0b2db7 (included in RED commit)

## Known Stubs

None — `getStripe()` is fully functional (no hardcoded values or placeholders).

## Self-Check: PASSED

- FOUND: lib/stripe/client.ts
- FOUND: lib/stripe/client.test.ts
- FOUND commit: e0b2db7 (test RED + vitest alias)
- FOUND commit: 56c21b7 (feat GREEN implementation)
