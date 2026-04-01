---
phase: quick-260331-k2r
plan: "01"
subsystem: admin-navigation
tags: [admin, settings, email-templates, navigation, sidebar]
dependency_graph:
  requires: []
  provides: [standalone-email-templates-page]
  affects: [admin-settings, admin-sidebar]
tech_stack:
  added: []
  patterns: [next-app-router-pages, client-components]
key_files:
  created:
    - app/admin/settings/email-templates/page.tsx
  modified:
    - app/admin/settings/page.tsx
    - app/admin/components/AdminShell.tsx
decisions:
  - "Used exact-match guard for /admin/settings in isChildActive — already existed, kept as-is"
  - "Kept useSearchParams/useEffect in settings page for remaining tab deep-link support"
metrics:
  duration: "5 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260331-k2r: Extract Email Templates from System Settings — Summary

**One-liner:** Moved Email Templates from a System Settings tab to a standalone page at /admin/settings/email-templates with correct sidebar highlighting.

## What Was Done

Extracted the Email Templates tab from the System Settings page into its own Next.js page. Updated the admin sidebar to link directly to the new URL. The sidebar highlighting logic already had an exact-match guard for `/admin/settings` — this correctly handles the new URL structure with no changes needed.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create standalone Email Templates page and clean up System Settings | 540b852 | app/admin/settings/email-templates/page.tsx, app/admin/settings/page.tsx |
| 2 | Update sidebar navigation and fix highlighting | da39228 | app/admin/components/AdminShell.tsx |

## Verification

- `npx tsc --noEmit` passes (only pre-existing iCloud duplicate file errors unrelated to this change)
- `/admin/settings` now has 3 tabs: General, Health, Maintenance
- `/admin/settings/email-templates` is a standalone page rendering EmailTemplatesList
- Sidebar Email Templates links to `/admin/settings/email-templates` (no query param)
- On `/admin/settings` only System highlights; on `/admin/settings/email-templates` only Email Templates highlights
- Settings group auto-opens for both paths via `pathname.startsWith(childPath)`

## Deviations from Plan

None — plan executed exactly as written. The `isChildActive` guard for `/admin/settings` was already in place (from a previous task), so no changes were needed beyond updating the href.

## Known Stubs

None.

## Self-Check: PASSED

- app/admin/settings/email-templates/page.tsx: FOUND
- app/admin/settings/page.tsx: FOUND (3 tabs only)
- app/admin/components/AdminShell.tsx: FOUND (updated href)
- Commit 540b852: FOUND
- Commit da39228: FOUND
