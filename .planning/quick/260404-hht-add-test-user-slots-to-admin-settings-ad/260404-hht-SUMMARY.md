---
phase: quick-260404-hht
plan: 01
subsystem: admin
tags: [admin, impersonation, test-users, dnd-kit, magic-link]
dependency_graph:
  requires: []
  provides: [admin_test_user_slots table, TestUsersTab component, /api/admin/impersonate route, Header quick-switch]
  affects: [app/admin/settings, app/components/Header.tsx]
tech_stack:
  added: [@dnd-kit/core, @dnd-kit/sortable (already installed)]
  patterns: [magic-link impersonation, dnd-kit sortable, supabase upsert]
key_files:
  created:
    - supabase/migrations/20260404_admin_test_user_slots.sql
    - app/admin/settings/components/TestUsersTab.tsx
    - app/api/admin/impersonate/route.ts
    - activity/quick-tasks/quick-task_admin-test-user-slots_04-04-2026.md
  modified:
    - app/admin/settings/page.tsx
    - app/components/Header.tsx
decisions:
  - Fetch test slots in parent Header component, pass as props to UserMenu (pure presentational pattern)
  - Magic link approach (independent session in new tab) rather than cookie-based impersonation
  - Role icon derived from role + principal_trainer_school_id (teacher with school -> SchoolIcon)
metrics:
  duration: ~20 minutes
  completed: 2026-04-04
  tasks: 2
  files: 6
---

# Phase quick-260404-hht Plan 01: Admin Test User Slots Summary

**One-liner:** Admin test user shortcut slots with dnd-kit drag-reorder, role-icon chips, and magic-link quick-switch in profile dropdown.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration + TestUsersTab + impersonate API | 1974a8f | supabase/migrations/20260404_admin_test_user_slots.sql, app/admin/settings/components/TestUsersTab.tsx, app/admin/settings/page.tsx, app/api/admin/impersonate/route.ts |
| 2 | Profile dropdown Quick Switch buttons | 916e2e4 | app/components/Header.tsx |

## What Was Built

### admin_test_user_slots table
- Primary key: `admin_user_id` (FK to profiles, ON DELETE CASCADE)
- `slot_1`, `slot_2`, `slot_3`: nullable UUIDs referencing profiles (ON DELETE SET NULL)
- RLS: admins can only read/write their own row

### TestUsersTab component
- 3 labeled sortable slots using `@dnd-kit/core` + `@dnd-kit/sortable` (horizontal layout)
- Each slot: search input using `searchMembers()` with debounce (300ms), dropdown results
- Selected user shown as chip: role icon + full name + X to remove
- Role icons: student → GraduationCap, teacher+school → School, teacher → Flower2, wellness_practitioner → Stethoscope, fallback → User
- Save button upserts to `admin_test_user_slots` with success confirmation
- On mount: loads existing slots and hydrates profile data

### /api/admin/impersonate POST route
- Verifies caller is authenticated and has admin role
- Resolves target user email via `service.auth.admin.getUserById()`
- Generates OTP magic link via `service.auth.admin.generateLink({ type: 'magiclink', email })`
- Returns `{ url: linkData.properties.action_link }`
- Returns 401/403/404/500 on error conditions

### Header Quick Switch
- `fetchTestSlots()` called on auth state change for admin users (not when impersonating)
- `TestSlot` interface: `{ userId, firstName, role, hasPrincipalSchool }`
- `QuickSwitchRoleIcon` helper maps role to lucide-react icon
- Quick Switch section renders between theme switcher and logout divs
- Only shown for admins with at least 1 configured slot, hidden when impersonating
- Click: closes dropdown, calls `handleQuickSwitch()`, fetches magic link, opens in `_blank` tab

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data sources are wired.

## Notes

- Migration blocked from `npx supabase db push --include-all` due to pre-existing out-of-order migration conflict (older `posts` table migration). Apply `supabase/migrations/20260404_admin_test_user_slots.sql` directly in Supabase SQL editor or dashboard to activate the feature.
- TypeScript compiles with 0 errors on all modified files.

## Self-Check: PASSED

Files created:
- supabase/migrations/20260404_admin_test_user_slots.sql — EXISTS
- app/admin/settings/components/TestUsersTab.tsx — EXISTS
- app/api/admin/impersonate/route.ts — EXISTS

Commits:
- 1974a8f — EXISTS
- 916e2e4 — EXISTS
