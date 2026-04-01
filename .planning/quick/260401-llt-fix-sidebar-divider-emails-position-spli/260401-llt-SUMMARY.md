---
task: 260401-llt
title: Fix 3 sidebar navigation issues in AdminShell.tsx
date: 2026-04-01
status: complete
branch: feature/nav-fixes-2
commit: 2945a2b
files_modified:
  - app/admin/components/AdminShell.tsx
---

# 260401-llt: Fix sidebar divider, emails position, split chevron toggle

## One-liner

Restored missing Shop/Settings divider, moved Emails back to standalone top-level nav, and split group header into separate label (navigate) and chevron (collapse-only) hit targets.

## Changes Made

### Fix 1 — Missing divider
Added `{ type: 'divider' }` at position 10 in `NAV_ITEMS`, between the Shop group and the Emails/Settings items.

### Fix 2 — Emails position
Removed Emails from `Settings.children`. Added it as a top-level `{ type: 'link' }` item immediately after the new divider. Settings group now only contains: System, Flows, Chatbot, Credits, API Keys, Documentation, Audit Log, Migration.

### Fix 3 — Split chevron toggle from navigation
Replaced the monolithic group-header `<button>` with a `<div>` wrapper holding two separate interactive elements:

- **Left button** (icon + label, flex-1): `expandGroup()` — opens group and navigates to first child (unchanged behavior for label clicks)
- **Right button** (chevron, w-6): `toggleGroupCollapse(e, item)` — calls `e.stopPropagation()`, then toggles the group's presence in `openGroups`. No navigation occurs.

Renamed `toggleGroup` to `expandGroup` for clarity. Added new `toggleGroupCollapse` handler.

## Verification

- `npx tsc --noEmit` passed with zero errors
- Branch `feature/nav-fixes-2` merged fast-forward to `develop` and pushed to origin

## Deviations

None — plan executed exactly as specified.
