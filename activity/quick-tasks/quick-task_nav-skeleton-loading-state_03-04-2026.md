---
task_id: 260403-c47
date: 2026-04-03
status: complete (awaiting human verify)
---

# Quick Task: Nav Skeleton Loading State

## Task Description

Add skeleton loading placeholders to the navigation bar so nav items don't progressively pop in as auth state resolves. Eliminates the visual jank where logged-out nav items flash first, then switch to logged-in nav items when auth resolves.

## Status

Implementation complete. Awaiting human visual verification.

## Solution

Modified `app/components/Header.tsx`:

**Desktop nav:** Wrapped link rendering in `authLoading` ternary — shows 4 pulsing pill skeletons (widths 80/64/72/64px, `h-[34px] rounded-lg bg-slate-100 animate-pulse`) during auth load, then renders all links at once when resolved.

**Mobile nav:** Same pattern — shows 4 skeleton bars (widths 128/96/112/96px, `h-10`) during auth load, then renders all links at once.

The right-side auth area was left unchanged as it already had proper skeleton handling.

## Commit

`65194b6` — feat(quick-260403-c47): add skeleton loading to desktop and mobile nav
