---
phase: 42-admin-colors-ui
plan: "01"
subsystem: admin-settings
tags: [colors, theme, admin, settings, brand, roles]
dependency_graph:
  requires: [lib/theme/defaults.ts, lib/theme/types.ts, site_settings table, app/admin/settings/page.tsx, app/admin/components/AdminShell.tsx]
  provides: [admin colors UI, live CSS variable preview, color persistence]
  affects: [all CSS color variables via document.documentElement.style.setProperty, site_settings rows for brand_colors/role_colors/maintenance_indicator_color]
tech_stack:
  added: []
  patterns: [site_settings upsert with onConflict, live CSS variable preview via setProperty, ColorRow sub-component with native color picker + hex input + swatch]
key_files:
  created:
    - app/admin/settings/components/ColorsTab.tsx
  modified:
    - app/admin/settings/page.tsx
    - app/admin/components/AdminShell.tsx
decisions:
  - Colors tab inserted between General and Health in the settings tab bar (prominent position)
  - Reset button on ColorRow uses opacity-0 + pointer-events-none when not dirty to avoid layout shift
  - Live preview deferred until `loaded` flag is true to avoid flashing defaults before DB load
  - Per-color reset is inline (no modal) — single click restores that key
metrics:
  duration: "~3 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_changed: 3
---

# Phase 42 Plan 01: Admin Colors UI Summary

Admin Colors settings page — ColorsTab component with brand/role/maintenance color pickers, live CSS variable preview, save to site_settings, per-color and reset-all functionality wired into the settings tab bar and sidebar.

## What Was Built

### ColorsTab component (`app/admin/settings/components/ColorsTab.tsx`)

A `'use client'` component providing full color management for platform admins:

- **3 sections:** Brand Colors (6 rows), Role Colors (6 rows), Maintenance Indicator (1 row) = 13 total pickers
- **ColorRow sub-component:** native `<input type="color">`, hex text input (7-char with pattern validation), 24px swatch preview, reset button visible only when color differs from default
- **Live preview:** `document.documentElement.style.setProperty()` called on every state change via `useEffect` depending on each color group
- **On mount:** fetches `brand_colors`, `role_colors`, `maintenance_indicator_color` from `site_settings`, merges with defaults
- **Save All:** upserts all 3 site_settings rows in parallel via `Promise.all`, logs audit event `admin.colors_updated`
- **Per-color reset:** inline reset to default for each individual color key
- **Reset All:** restores all 3 groups to defaults, prompts user to Save to persist

### Settings page (`app/admin/settings/page.tsx`)

- Added `'colors'` to `Tab` type union
- Added `{ key: 'colors', label: 'Colors' }` to TABS array (position 2, after General)
- Imported `ColorsTab` and renders it when `tab === 'colors'`

### Admin sidebar (`app/admin/components/AdminShell.tsx`)

- Added `{ href: '/admin/settings?tab=colors', label: 'Colors', paths: [...] }` to Settings group children
- Positioned between System (index 0) and Flows (now index 2)
- Uses Heroicons color-swatch SVG path

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all color pickers read from and write to the live site_settings table. Live preview wires directly to CSS variables.

## Self-Check: PASSED

- `app/admin/settings/components/ColorsTab.tsx` — FOUND (361 lines)
- `app/admin/settings/page.tsx` — FOUND, contains `ColorsTab` import and render
- `app/admin/components/AdminShell.tsx` — FOUND, contains Colors sidebar entry
- Commits `9868db6` and `ced06fd` — FOUND in git log
- `npx tsc --noEmit` — PASSED
