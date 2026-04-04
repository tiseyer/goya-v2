# Quick Task 260404-mww — Summary

**Task:** Quick switch redesign — icon-only buttons matching mode switcher style
**Status:** Complete
**Commit:** ed05dda

## What Changed

The Quick Switch section in the profile dropdown was redesigned to match the theme switcher:
- Removed "QUICK SWITCH" label and separate divider
- Merged into same bordered container as the sun/monitor/moon theme buttons
- Buttons now show only the role icon (no name text) — same visual weight as theme buttons
- First name shows on hover via `title` attribute tooltip
- Same hover/active styles: `hover:bg-surface hover:shadow-sm`
