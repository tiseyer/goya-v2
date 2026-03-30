---
phase: quick
plan: 260327-lpc
subsystem: ui-components
tags: [theme-toggle, ui, cleanup]
dependency_graph:
  requires: []
  provides: [icon-only-theme-inline]
  affects: [ThemeInline component in profile dropdown]
tech_stack:
  added: []
  patterns: [icon-only button with title tooltip for accessibility]
key_files:
  created: []
  modified:
    - app/components/ThemeToggle.tsx
decisions:
  - Remove label text from ThemeInline buttons; icons are self-explanatory, title attribute covers accessibility
metrics:
  duration: "< 5 minutes"
  completed: "2026-03-27"
---

# Quick Task 260327-lpc: Remove Label Text from ThemeInline Toggle Buttons Summary

**One-liner:** Removed visible text labels from ThemeInline buttons, leaving icon-only display with title tooltip for accessibility.

## What Was Done

Edited the `ThemeInline` component in `app/components/ThemeToggle.tsx` to remove the visible text labels from the three theme toggle buttons (Light / System / Dark). The buttons now show only their SVG icons, making the toggle more compact for use in the profile dropdown.

Changes made to the `THEMES.map` button inside `ThemeInline`:
- Removed `<span>{t.label}</span>` — eliminates visible text
- Removed `gap-1.5` from button className — no gap needed with a single icon
- Removed `text-xs` and `font-medium` from button className — no text to style

The `title={t.label}` attribute was preserved for hover tooltip accessibility. `ThemeCards` (the Settings page variant) was not modified — it intentionally keeps labels.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- [x] `app/components/ThemeToggle.tsx` modified as specified
- [x] Commit `6430dad` exists
- [x] `grep -n "t.label" ThemeToggle.tsx` returns only title attribute (line 120) and ThemeCards span (line 90) — no span in ThemeInline
- [x] `gap-1.5` only in ThemeCards, not ThemeInline
- [x] `text-xs` only in ThemeCards, not ThemeInline
