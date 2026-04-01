# Quick Task: Admin Sidebar Nav Fixes 2

**Date:** 2026-04-01
**Status:** Done

## Task Description

Fix 3 sidebar navigation issues in `app/admin/components/AdminShell.tsx`:

1. Missing divider between Shop and the settings section
2. Emails item incorrectly placed inside Settings group (should be standalone top-level link)
3. Entire group header row was one click target — split into two hit targets so chevron only toggles collapse/expand without navigating

## Solution

### Fix 1: Missing divider
Added `{ type: 'divider' }` between the Shop group and Emails/Settings in the `NAV_ITEMS` array.

### Fix 2: Emails position
Removed Emails from `Settings.children` and added it as a standalone `{ type: 'link' }` item between the new divider and the Settings group. Correct order is now: Shop → divider → Emails (standalone) → Settings (group).

### Fix 3: Split group header hit targets
Replaced the single `<button>` group header with a `<div>` wrapper containing two separate buttons:
- **Left button** (icon + label, `flex-1`): calls `expandGroup()` — expands the group and navigates to first child href (previous behavior)
- **Right button** (chevron icon, `w-6`): calls `toggleGroupCollapse()` with `e.stopPropagation()` — only toggles the open/collapsed state, no navigation

Added `toggleGroupCollapse` handler and renamed `toggleGroup` to `expandGroup` for clarity.

## Files Modified
- `app/admin/components/AdminShell.tsx`

## Branch
`feature/nav-fixes-2` — merged to `develop` and pushed.
