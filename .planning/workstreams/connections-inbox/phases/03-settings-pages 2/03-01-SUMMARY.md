---
phase: 03-settings-pages
plan: "01"
subsystem: settings
tags: [profile, settings, migration, server-action]
dependency_graph:
  requires: [02-01]
  provides: [settings-general-page]
  affects: [app/settings/page.tsx, app/settings/actions.ts]
tech_stack:
  added: []
  patterns: [server-action, impersonation-safe-update, settings-shell-content]
key_files:
  created:
    - app/settings/actions.ts
  modified:
    - app/settings/page.tsx
decisions:
  - "Kept router import for handleDeleteAccount (post-delete redirect to '/')"
  - "Removed router.push('/sign-in') — layout already handles auth guard"
  - "Used p-6 max-w-4xl outer wrapper matching settings shell content pattern"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-23"
  tasks_completed: 1
  files_changed: 2
---

# Phase 03 Plan 01: General Settings Page Migration Summary

**One-liner:** Full profile settings form migrated from app/profile/settings/ into app/settings/page.tsx, rendered inside the Settings shell with impersonation-safe server action.

## What Was Built

- `app/settings/actions.ts` — Server action (`updateProfile`) copied from `app/profile/settings/actions.ts`, using `getEffectiveUserId` and `getEffectiveClient` for impersonation-safe profile updates
- `app/settings/page.tsx` — Full profile settings form replacing the stub, with all sections intact: profile info, role-specific sections (student Practice Profile, teacher Teaching Profile, school School Profile), account information, and danger zone

## Key Changes from Source

1. Outer layout wrapper changed from `min-h-screen bg-[#0f172a] pt-20 pb-16 > max-w-2xl mx-auto px-4` to `p-6 max-w-4xl` (settings shell content pattern)
2. Loading spinner updated to remove dark background
3. Page heading changed from "Profile Settings" to "General"
4. `router.push('/sign-in')` redirect removed — settings layout handles auth guard
5. Function renamed from `ProfileSettingsPage` to `SettingsGeneralPage`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- Avatar upload: "Avatar upload coming soon" — intentional placeholder, avatar upload is out of scope for this milestone

## Self-Check: PASSED

Files exist:
- FOUND: app/settings/actions.ts
- FOUND: app/settings/page.tsx

Commits exist:
- FOUND: 7eb1034 (feat(03-01): migrate General settings page with full profile form and server action)
