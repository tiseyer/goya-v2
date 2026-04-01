# Quick Task: Fix Auth Pages Layout

**Date:** 2026-03-27
**Status:** Complete

## Description

Fix 4 issues with auth pages: header/footer still visible on sign-in/register/forgot-password, page scrollable, visual hierarchy imbalance with competing headings, and form centering.

## Solution

1. **Middleware x-pathname fix**: The root cause was that `x-pathname` was set on response headers but `headers()` in server components reads request headers. Fixed both the fast path and slow path in `middleware.ts` to set `x-pathname` on a cloned request headers object passed to `NextResponse.next()`.

2. **Sign-in page**: Removed "Welcome back" heading and subtitle. Logo reduced to h-8 compact brand mark.

3. **Forgot-password page**: Removed heading/subtitle from above card, moved "Reset your password" heading inside the card. Logo reduced to h-8.

4. **Register page**: Replaced inline-styled 96px logo with h-8 compact brand mark matching other auth pages.

## Files Modified

- `middleware.ts` - x-pathname on request headers instead of response headers
- `app/sign-in/page.tsx` - compact logo, removed heading/subtitle
- `app/forgot-password/page.tsx` - compact logo, heading moved inside card
- `app/register/page.tsx` - compact logo matching other auth pages
