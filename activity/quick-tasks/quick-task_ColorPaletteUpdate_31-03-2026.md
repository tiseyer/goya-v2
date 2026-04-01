# Quick Task: Color Palette Update — Harmonize with #345c83 Primary Blue

**Status:** Complete
**Date:** 2026-03-31

## Task

The hero background was changed to #345c83 (GOYA primary blue), but buttons, filter chips, calendar highlights, and other interactive elements still used the old darker navy (#1B3A5C, #1e3a52, #1a2744). This created visual disharmony.

## Solution

### 1. Updated CSS variables in globals.css

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `--goya-primary` | #345c83 | #345c83 (unchanged) |
| `--goya-primary-light` | #4e87a0 | #4a7aab |
| `--goya-primary-dark` | #1e3a52 | #2a4d6e |

### 2. Added light-mode CSS overrides for hardcoded hex colors

100+ component files use hardcoded `bg-[#1B3A5C]` and similar hex values for buttons. Rather than editing every file, added CSS-level remapping rules (same pattern already used for dark mode):

- `bg-[#1B3A5C]`, `bg-[#1a2744]`, `bg-[#1e3a5f]` → `var(--goya-primary)` (#345c83)
- `hover:bg-[#142d47]`, `hover:bg-[#162f4a]`, `hover:bg-[#15304d]`, `hover:bg-[#16304f]`, `hover:bg-[#162d4a]`, `hover:bg-[#1e3a52]` → `var(--goya-primary-dark)` (#2a4d6e)
- `border-[#1B3A5C]`, `border-[#1a2744]` → `var(--goya-primary)`
- `bg-[#4E87A0]`, `hover:bg-[#4E87A0]` → `var(--goya-primary-light)` (#4a7aab)
- `hover:bg-[#3A7190]` → `var(--goya-primary)`

### Elements verified (all use CSS variables)

- Dashboard "Edit Profile" button → `bg-primary-dark` ✓
- Academy filter buttons active state → `bg-primary-dark` ✓
- Calendar date highlight → `bg-primary-dark` ✓
- Events filter active state → `bg-primary-dark` ✓
- Events type filter → `bg-primary-dark` ✓

### Verification

- `npx tsc --noEmit` passes
- Only `globals.css` modified — zero component file changes
