# Quick Task: Superuser Role + Admin Deletion

**Date:** 03-04-2026
**Status:** Complete
**Task ID:** 260403-hp9

## Task Description

Add a `superuser` role to the database and codebase as a strict superset of `admin`. The superuser is invisible in the UI (always displays as "Admin") but grants the backend permission to delete admin users. Regular admins cannot delete other admins. Deleting an admin requires a second confirmation dialog with exact text input. Superuser accounts are protected from deletion by anyone.

## Solution

### Database (Task 1)
- Migration `20260404_add_superuser_role.sql` adds `superuser` to the `user_role` enum
- `till@seyer-marketing.de` promoted to `superuser` (applied via `supabase db query --linked`)
- `is_admin()` RLS function updated to include superuser: `role::text IN ('admin', 'moderator', 'superuser')`

### TypeScript Infrastructure (Task 1)
- `lib/types.ts`: `UserRole` now includes `'superuser'`
- `lib/roles.ts` created as single source of truth for all role checks:
  - `isAdminOrAbove()` — true for admin + superuser
  - `isAdminOrMod()` — true for admin + superuser + moderator
  - `isSuperuser()` — true only for superuser
  - `displayRole()` — maps superuser → 'admin' for UI display
  - `canDeleteUser()` — full deletion permission check

### Server-Side Role Checks (Task 2)
Updated to use `lib/roles.ts` helpers:
- `middleware.ts` — maintenance bypass, impersonation guard, admin path guard, page visibility
- `app/api/admin/users/bulk-delete/route.ts` — superuser can delete admins; superusers undeletable
- `app/actions/impersonation.ts` — superuser can impersonate
- `app/admin/users/[id]/page.tsx` — superuser has isAdmin=true
- `app/admin/inbox/actions.ts` — all 8 role checks updated

### UI Masking (Task 3)
- `AdminUsersTable.tsx`: `displayRole()` for badge + label; second confirmation modal with `DELETE ADMIN` text input; superuser targets show "(cannot be deleted)"
- `page.tsx`: admin filter query includes superuser via `query.in('role', ['admin', 'superuser'])`
- `UserDetailClient.tsx`: `displayRole()` for role field
- `Header.tsx`: all role checks use `isAdminOrMod()`
- `ChatWidget.tsx`, `settings/page.tsx`, `profile/settings/page.tsx`: display role masking applied

### Comprehensive Sweep (Task 4)
17 additional files fixed with remaining hardcoded admin checks (auto-fix Rule 2 — missing functionality):
- Admin API routes: health, danger/clear-cache, danger/invalidate-sessions
- Admin pages: impersonation-log, events, courses, media (+ their filters + edit pages)
- App pages: academy/[id], teaching-hours, addons
- Actions/routes: members, api/search, api/flows/active, settings/SettingsShell

### Total: 0 TypeScript errors. No "superuser" text visible in any JSX.
