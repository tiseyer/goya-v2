# Quick Task: Fix Theme Toggle Buttons in Navbar Dropdown

**Date:** 2026-03-27
**Status:** Done

## Task Description

The `ThemeInline` component used in the navbar profile dropdown was displaying as three small icon-only buttons with gaps. The task was to restyle it as a proper full-width segmented control with icon + label text in each segment.

## Solution

Modified `app/components/ThemeToggle.tsx` — `ThemeInline` component only (ThemeCards and shared logic left untouched):

- Container div changed to `flex w-full bg-surface-muted rounded-lg p-1` for full-width pill background
- Each button changed to use `flex-1` so all three segments share equal 1/3 width
- Added `<span>{t.label}</span>` after the icon so each button shows "Light", "System", or "Dark"
- Active state uses `bg-surface text-primary shadow-sm` for a raised segment appearance
- Inactive hover state kept as color-only change (no background needed since container provides it)

## Commit

`98430af` — feat(quick-260327-l8q): restyle ThemeInline as full-width segmented control
