---
phase: quick
plan: 260403-hp9
subsystem: auth-roles
tags: [roles, superuser, admin, security, deletion]
dependency_graph:
  requires: []
  provides: [superuser-role, role-helpers, admin-deletion]
  affects: [middleware, bulk-delete, impersonation, all-admin-pages, header, chat]
tech_stack:
  added: [lib/roles.ts]
  patterns: [role-helper-module, displayRole-masking, double-confirmation-dialog]
key_files:
  created:
    - lib/roles.ts
    - supabase/migrations/20260404_add_superuser_role.sql
    - docs/developer/roles.md
    - activity/quick-tasks/quick-task_superuser-role-admin-deletion_03-04-2026.md
  modified:
    - lib/types.ts
    - middleware.ts
    - app/api/admin/users/bulk-delete/route.ts
    - app/actions/impersonation.ts
    - app/admin/inbox/actions.ts
    - app/admin/users/AdminUsersTable.tsx
    - app/admin/users/page.tsx
    - app/admin/users/AdminUsersFilters.tsx
    - app/admin/users/[id]/page.tsx
    - app/admin/users/[id]/UserDetailClient.tsx
    - app/components/Header.tsx
    - app/components/chat/ChatWidget.tsx
    - app/settings/page.tsx
    - app/profile/settings/page.tsx
    - app/settings/components/SettingsShell.tsx
    - app/admin/impersonation-log/page.tsx
    - app/api/admin/health/route.ts
    - app/api/admin/danger/clear-cache/route.ts
    - app/api/admin/danger/invalidate-sessions/route.ts
    - app/admin/events/page.tsx
    - app/admin/events/AdminEventsFilters.tsx
    - app/admin/events/[id]/edit/page.tsx
    - app/admin/courses/AdminCoursesFilters.tsx
    - app/admin/courses/[id]/edit/page.tsx
    - app/admin/media/page.tsx
    - app/academy/[id]/page.tsx
    - app/api/search/route.ts
    - app/api/flows/active/route.ts
    - app/actions/members.ts
    - app/addons/page.tsx
    - app/teaching-hours/page.tsx
    - docs/admin/users.md
decisions:
  - superuser displays as admin in all UI (displayRole() single point of truth)
  - lib/roles.ts is mandatory import for all role checks — no raw string comparisons
  - migration applied via supabase db query --linked due to out-of-order migration conflict
  - admin deletion requires exact typed confirmation "DELETE ADMIN" to prevent accidents
metrics:
  duration: "45 minutes"
  completed: "2026-04-03"
  tasks_completed: 5
  files_modified: 31
---

# Quick Task 260403-hp9: Superuser Role + Admin Deletion

**One-liner:** Invisible superuser role (displays as Admin) with DB migration, centralized `lib/roles.ts` helpers, and double-confirmation admin deletion gate — applied across 31 files.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | DB migration + types + lib/roles.ts | 1f4f689 | Done |
| 2 | Role checks across middleware, API routes, actions | 99772ad | Done |
| 3 | UI masking + delete confirmation dialog | 07fe283 | Done |
| 4 | Migration applied + comprehensive role check sweep | 758b359 | Done |
| 5 | Documentation + activity log | d9abf5a | Done |

## What Was Built

**`lib/roles.ts`** — Single source of truth for all role checks:
- `isAdminOrAbove(role)` — admin + superuser
- `isAdminOrMod(role)` — admin + superuser + moderator
- `isSuperuser(role)` — superuser only
- `displayRole(role)` — superuser → 'admin' for all UI output
- `canDeleteUser(...)` — full deletion permission check

**Database:** `superuser` added to `user_role` enum. `till@seyer-marketing.de` promoted. `is_admin()` RLS function includes superuser.

**Bulk Delete API:** Superusers can delete admin accounts (not other superusers). Regular admins still skip admin accounts. Superuser accounts are completely undeletable.

**Delete UI:** Second confirmation dialog with exact `DELETE ADMIN` text input required before superuser can delete admin accounts.

**Role masking:** `displayRole()` applied to every UI location that displays user roles — zero "superuser" text ever rendered.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Comprehensive role check sweep across 17 additional files**
- **Found during:** Task 4 (grep scan for remaining hardcoded checks)
- **Issue:** 17 files outside the plan's `files_modified` list had hardcoded `=== 'admin'` checks that would block the superuser from using admin features (health API, danger routes, impersonation log, events/courses/media admin pages, academy page, teaching-hours, addons, search, flows, members action, SettingsShell)
- **Fix:** Applied `isAdminOrAbove()` or `isAdminOrMod()` from `lib/roles.ts` to each file
- **Files modified:** 17 additional files (all listed in key_files.modified above)
- **Commit:** 758b359

**2. [Rule 3 - Blocking Issue] Migration applied via db query instead of db push**
- **Found during:** Task 4
- **Issue:** `supabase db push` failed due to out-of-order migrations in the repository. The migration could not be applied via normal push flow.
- **Fix:** Applied the migration in 3 steps using `supabase db query --linked`:
  1. `ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'superuser'`
  2. `UPDATE public.profiles SET role = 'superuser' WHERE email = 'till@seyer-marketing.de'`
  3. `CREATE OR REPLACE FUNCTION public.is_admin() ...`
- The migration file still exists for version control; only application method changed.

**3. [Rule 1 - Bug] TypeScript enum overlap in bulk-delete route**
- **Found during:** Task 2 verification
- **Issue:** `p.role === 'superuser'` triggered TS2367 because Supabase client inferred the old enum type (without superuser) for the query result
- **Fix:** Cast `p.role as string` before comparison; same for `profile?.role as string` in isSuperuser() call
- **Commit:** 99772ad

## Known Stubs

None — all role checks are live and the DB has been updated.

## Self-Check: PASSED

- `lib/roles.ts` exists: FOUND
- `supabase/migrations/20260404_add_superuser_role.sql` exists: FOUND
- `docs/developer/roles.md` exists: FOUND
- Commits 1f4f689, 99772ad, 07fe283, 758b359, d9abf5a: all FOUND in git log
- DB verification: `SELECT role FROM profiles WHERE email = 'till@seyer-marketing.de'` → `superuser` CONFIRMED
- TypeScript: 0 errors (excluding pre-existing validator.ts error unrelated to this task)
- Superuser text in JSX: 0 display-facing instances CONFIRMED
