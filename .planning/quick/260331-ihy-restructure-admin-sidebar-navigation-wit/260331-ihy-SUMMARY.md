---
phase: quick
plan: 260331-ihy
subsystem: admin-ui
tags: [navigation, sidebar, inbox, settings, restructure]
dependency_graph:
  requires: []
  provides: [grouped-sidebar-nav, inbox-verifications-tab, visitors-placeholder]
  affects: [admin-shell, inbox-page, settings-page]
tech_stack:
  added: []
  patterns: [set-based-group-state, url-param-tab-sync]
key_files:
  created:
    - app/admin/analytics/visitors/page.tsx
    - activity/quick-tasks/quick-task_AdminNavRestructure_31-03-2026.md
  modified:
    - app/admin/components/AdminShell.tsx
    - app/admin/inbox/page.tsx
    - app/admin/settings/page.tsx
decisions:
  - Set<string> for group state instead of per-group booleans — scales to any number of groups
  - Email Templates sidebar link points to /admin/settings?tab=email-templates — avoids creating redirect page
  - Settings page reads useSearchParams for initial tab — enables deep-linking from sidebar
metrics:
  duration: 316s
  completed: 2026-03-31
---

# Quick Task 260331-ihy: Admin Sidebar Navigation Restructure Summary

Grouped flat admin sidebar into three sections (Analytics, Content, Settings) with dividers, added Verifications tab to Inbox, removed duplicate Analytics config from Settings page.

## Commits

| # | Hash | Type | Description |
|---|------|------|-------------|
| 1 | 9ba0ddc | feat | Restructure sidebar with Analytics/Settings groups, dividers, visitors placeholder |
| 2 | 8ceded0 | feat | Add Verifications tab to Inbox with 5-tab reorder |
| 3 | 7f76ab2 | refactor | Remove Analytics tab from Settings, rename to System Settings |

## Changes Summary

### Task 1: AdminShell sidebar restructure
- Replaced flat nav with grouped structure: Dashboard, Analytics (Shop, Visitors), Inbox, divider, Users, Events, Courses, Shop (Orders, Products, Coupons), divider, Settings (System, Email Templates, Flows, Chatbot, Credits, API Keys, Audit Log, Migration)
- Generalized `shopOpen` boolean to `Set<string>` openGroups for independent group expand/collapse
- Auto-open groups matching current pathname on mount and navigation
- Added NavDivider type and rendering
- Created `/admin/analytics/visitors` placeholder page

### Task 2: Inbox Verifications tab
- Added Verifications as 2nd tab with pending profile query and VerificationActions component
- Reordered tabs: Credits & Hours, Verifications, Support Tickets, Teacher Upgrades, School Registrations
- Changed default tab from 'schools' to 'credits'
- Updated header description

### Task 3: Settings cleanup
- Removed AnalyticsTab and all analytics-only helpers (Toggle, InputField, StatusDot, Toast, datetime utils)
- Reduced tabs from 5 to 4: General, Email Templates, Health, Maintenance
- Renamed heading to "System Settings"
- Added useSearchParams for URL-based tab selection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added useSearchParams to Settings page**
- **Found during:** Task 3
- **Issue:** Settings page used client-side useState('general') ignoring URL params, so sidebar link to /admin/settings?tab=email-templates would not auto-select the tab
- **Fix:** Added useSearchParams() and useEffect to sync tab state from URL search params
- **Files modified:** app/admin/settings/page.tsx
- **Commit:** 7f76ab2

## Known Stubs

| File | Description | Resolution |
|------|-------------|------------|
| app/admin/analytics/visitors/page.tsx | Placeholder page — no actual analytics data | Future plan will integrate GA4, Clarity, and Vercel Analytics |

## Self-Check: PASSED
