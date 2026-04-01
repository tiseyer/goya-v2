---
phase: 41-themeprovider-infrastructure
plan: "01"
subsystem: theme
tags: [theme, css-variables, server-component, site-settings, brand-colors, role-colors]
dependency_graph:
  requires: []
  provides: [ThemeColorProvider, BrandColors, RoleColors, DEFAULT_BRAND_COLORS, DEFAULT_ROLE_COLORS, DEFAULT_MAINTENANCE_COLOR]
  affects: [app/layout.tsx, all pages (CSS variables on :root)]
tech_stack:
  added: []
  patterns: [REST fetch with anon key (same as getAnalyticsSettings), React Server Component style injection, CSS custom properties on :root]
key_files:
  created:
    - lib/theme/types.ts
    - lib/theme/defaults.ts
    - app/components/ThemeColorProvider.tsx
  modified:
    - app/layout.tsx
decisions:
  - "Used dynamic CSS variable injection via BRAND_CSS_VARS/ROLE_CSS_VARS mappings rather than hardcoding variable names in the component — keeps defaults.ts as single source of truth for naming"
  - "ThemeColorProvider placed inside <html> before <body> to ensure CSS variables are set before any body content renders"
  - "Partial save support via spread-merge: spread defaults first then DB values, so admin can change one color without losing others"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 41 Plan 01: ThemeColorProvider Infrastructure Summary

ThemeColorProvider server component that fetches brand_colors, role_colors, and maintenance_indicator_color from site_settings and injects 13 CSS custom properties on :root via a style tag, with full fallback to defaults when DB is unavailable.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create color defaults and types module | 9cb51bb | lib/theme/types.ts, lib/theme/defaults.ts |
| 2 | Create ThemeColorProvider and integrate into layout.tsx | 26306e0 | app/components/ThemeColorProvider.tsx, app/layout.tsx |

## What Was Built

### lib/theme/types.ts
TypeScript interfaces `BrandColors` (primary, accent, background, surface, border, foreground) and `RoleColors` (student, teacher, wellness, school, moderator, admin).

### lib/theme/defaults.ts
- `DEFAULT_BRAND_COLORS` — matches current globals.css :root values (e.g. primary: `#345c83`)
- `DEFAULT_ROLE_COLORS` — new role color palette (indigo/blue/emerald/amber/violet/red)
- `DEFAULT_MAINTENANCE_COLOR` — `#F59E0B` (amber)
- `BRAND_CSS_VARS`, `ROLE_CSS_VARS`, `MAINTENANCE_CSS_VAR` — CSS variable name mappings used by ThemeColorProvider

### app/components/ThemeColorProvider.tsx
React Server Component (no `'use client'`). Fetches from site_settings REST API using the same pattern as `getAnalyticsSettings` in layout.tsx. Merges DB values with defaults via object spread. Renders a `<style dangerouslySetInnerHTML>` tag declaring all 13 CSS variables on `:root`. Full try/catch fallback to defaults on any error.

CSS variables injected:
- Brand: `--color-primary`, `--color-accent`, `--color-bg`, `--color-surface`, `--color-border`, `--color-foreground`
- Role: `--color-student`, `--color-teacher`, `--color-wellness`, `--color-school`, `--color-moderator`, `--color-admin`
- Maintenance: `--color-maintenance`

### app/layout.tsx
Added import and `<ThemeColorProvider />` inside `<html>` before `<body>`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. ThemeColorProvider reads live DB values (or falls back to defaults). No placeholder data wired to UI rendering.

## Verification Results

- `npx tsc --noEmit` — passed, no errors
- `grep ThemeColorProvider app/layout.tsx` — 2 matches (import + render)
- `grep "'use client'" app/components/ThemeColorProvider.tsx` — 0 matches (server component confirmed)
- `npm run build` — succeeded, all routes compiled

## Self-Check: PASSED

Files exist:
- lib/theme/types.ts — FOUND
- lib/theme/defaults.ts — FOUND
- app/components/ThemeColorProvider.tsx — FOUND

Commits exist:
- 9cb51bb — FOUND
- 26306e0 — FOUND
