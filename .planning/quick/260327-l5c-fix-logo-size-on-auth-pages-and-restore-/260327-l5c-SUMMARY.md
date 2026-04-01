# Quick Task 260327-l5c: Summary

**Task:** Fix logo size on auth pages and restore homepage header/footer
**Date:** 2026-03-27
**Commit:** 01624b5

## Changes

| File | Change |
|------|--------|
| app/sign-in/page.tsx | Logo `h-8` → `w-40` |
| app/forgot-password/page.tsx | Logo `h-8` → `w-40` |
| app/register/page.tsx | Logo `h-8` → `w-40` |
| middleware.ts | Set `x-pathname` on both request AND response headers (fast + slow paths) |

## Root Cause (Header/Footer)

The middleware was setting `x-pathname` only on request headers via `NextResponse.next({ request: { headers } })`. The root layout reads this via `await headers()`. Adding the header to the response as well ensures it's available regardless of how Next.js propagates headers internally.
