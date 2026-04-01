# Quick Task: Apply GOYA Primary Blue Background to Hero Sections

**Date:** 2026-03-31
**Task ID:** 260331-kil
**Status:** Complete

## Description

Applied the GOYA primary blue (#345c83, `bg-primary`) background to the hero/top sections of the Dashboard, Events, Academy, and Add-Ons pages, matching the visual style of the event detail page's gradient hero (no-image variant).

## Solution

Added a `variant` prop to `PageHero.tsx` (`'light' | 'dark'`, defaulting to `'light'`):

- **Dark variant:** `bg-primary` section background with dot-grid texture overlay, soft top-right glow, white headline text, `text-primary-200` subtitle, and pills styled as `bg-white/12 text-white/90 border border-white/15`.
- **Light variant:** Unchanged from original — `bg-surface-muted`, `text-primary-dark` heading, `text-slate-500` subtitle, `bg-primary/8` pill.

Added `variant="dark"` to:
- `app/dashboard/page.tsx`
- `app/events/page.tsx`
- `app/academy/page.tsx`
- `app/addons/page.tsx`

Untouched pages: `app/events/[id]/page.tsx` (own custom hero), `app/members/page.tsx` (no hero), all admin pages.

## Files Modified

- `app/components/PageHero.tsx` — Added dark variant support
- `app/dashboard/page.tsx` — `variant="dark"` added
- `app/events/page.tsx` — `variant="dark"` added
- `app/academy/page.tsx` — `variant="dark"` added
- `app/addons/page.tsx` — `variant="dark"` added
