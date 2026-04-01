# Quick Task: Fix Auth Logo Size & Homepage Header/Footer

**Date:** 2026-03-27
**Status:** Complete
**Commit:** 01624b5

## Task Description

Two fixes for auth pages and homepage:
1. Enlarge GOYA logo on auth pages from h-8 (32px height) to w-40 (160px width)
2. Restore homepage header/footer by setting x-pathname on both request and response headers in middleware

## Solution

- Changed logo className from `h-8` to `w-40` on sign-in, register, and forgot-password pages
- Added `response.headers.set('x-pathname', pathname)` on both fast path and slow path return in middleware.ts so the root layout can reliably read the pathname
