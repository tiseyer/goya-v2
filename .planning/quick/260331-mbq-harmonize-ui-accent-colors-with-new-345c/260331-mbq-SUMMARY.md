# Quick Task 260331-mbq: Harmonize UI accent colors with #345c83 primary blue

**Status:** Complete
**Date:** 2026-03-31

## Changes

1. **Updated CSS variables** in `app/globals.css`:
   - `--goya-primary-light`: #4e87a0 → #4a7aab (closer to primary hue)
   - `--goya-primary-dark`: #1e3a52 → #2a4d6e (lighter, harmonizes with #345c83)

2. **Added light-mode CSS overrides** for 100+ hardcoded hex colors:
   - All `bg-[#1B3A5C]`, `bg-[#1a2744]`, `bg-[#1e3a5f]` → remapped to `--goya-primary`
   - All hover variants → remapped to `--goya-primary-dark`
   - All border variants → remapped to `--goya-primary`
   - Old teal `#4E87A0` backgrounds → remapped to `--goya-primary-light`

3. **Zero component files modified** — CSS-only approach

## Verification

- Dashboard, Academy, Events, Calendar elements all inherit from CSS variables
- `npx tsc --noEmit` passes
