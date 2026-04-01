---
phase: quick
plan: 260327-ky9
subsystem: auth-ui
tags: [fix, middleware, layout, auth-pages]
key-files:
  modified:
    - middleware.ts
    - app/sign-in/page.tsx
    - app/forgot-password/page.tsx
    - app/register/page.tsx
decisions:
  - Set x-pathname on request headers (not response) for server component access
  - Compact h-8 logo as brand mark on all auth pages
  - Moved forgot-password heading inside card for better information architecture
metrics:
  completed: 2026-03-27
  tasks: 1/1
---

# Quick Task 260327-ky9: Fix Auth Pages Hide Header/Footer & Visual Hierarchy

**One-liner:** Fixed middleware x-pathname propagation via request headers and simplified auth page visual hierarchy with compact logos.

## What Was Done

### Task 1: Fix header/footer hiding, no-scroll, visual hierarchy, and centering

**Middleware fix (root cause):**
The root layout reads `x-pathname` via `await headers()` which accesses request headers. The middleware was setting `x-pathname` on response headers only. Fixed both code paths (fast path for public routes, slow path for auth-checked routes) to create a cloned `Headers` object from `request.headers`, set `x-pathname` on it, and pass it to `NextResponse.next({ request: { headers: requestHeaders } })`. Also updated the `setAll` cookie callback to reconstruct the response with the same request headers.

**Sign-in page:**
Removed "Welcome back" h1 and "Sign in to your GOYA account" subtitle. Logo reduced from h-10 to h-8 compact brand mark. Wrapper spacing tightened from mb-8 to mb-6.

**Forgot-password page:**
Removed heading and dynamic subtitle from above the card. Added "Reset your password" heading and subtitle inside the card at the top, before the form/sent-state content. Logo compact h-8 treatment.

**Register page:**
Replaced inline-styled 96px wide logo with h-8 Tailwind class matching other auth pages. Wrapped in centered div with mb-6 spacing.

**Commit:** `08cd691`

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Verification

- `npx next build` completes without errors
- Middleware sets x-pathname on request headers (not response headers)
- No "Welcome back" heading on sign-in page
- Logo is h-8 (compact brand mark) on all auth pages
- Forgot-password heading moved inside card
