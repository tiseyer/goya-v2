# Quick Task: Remove Label Text from Theme Toggle

**Date:** 2026-03-27
**Task ID:** 260327-lpc
**Status:** DONE

## Task Description

Remove visible text labels from the `ThemeInline` component buttons in the profile dropdown theme toggle. Only icons should display; the `title` attribute provides accessibility via hover tooltips.

## Solution

Modified `app/components/ThemeToggle.tsx` — `ThemeInline` component only:

- Removed `<span>{t.label}</span>` from each button
- Removed `gap-1.5`, `text-xs`, `font-medium` from button className (no longer needed without text)
- Preserved `title={t.label}` for accessibility

`ThemeCards` (Settings page variant) was not changed — it keeps labels by design.

**Commit:** `6430dad`
