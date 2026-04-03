---
title: Role System
audience: ["developer"]
section: developer
order: 3
last_updated: "2026-04-03"
---

# Role System

GOYA uses a role-based access control system. Roles are stored as a Postgres enum (`user_role`) on the `profiles` table.

## Role Hierarchy

```
superuser
  └── admin
        └── moderator
              └── teacher / wellness_practitioner / student
```

| Role | Description |
|---|---|
| `superuser` | Platform owner. Full admin access plus ability to delete admin accounts. Invisible in the UI — always displays as "Admin". |
| `admin` | Full admin panel access. Can manage users, events, courses, settings, inbox. Cannot delete other admins. |
| `moderator` | Admin panel access with reduced permissions. Cannot perform destructive operations on users. |
| `teacher` | Standard member with teacher-level features (credit hours, school creation). |
| `wellness_practitioner` | Standard member with WP-level features. |
| `student` | Default member role. |

## Superuser — Key Facts

- **Invisible:** The `superuser` role is never displayed to any user. It always renders as "Admin" via `displayRole()`.
- **Single account:** Only `till@seyer-marketing.de` holds this role. It is set via migration.
- **Undeletable:** Superuser accounts cannot be deleted through the UI or bulk-delete API.
- **Admin deletion:** Only a superuser can delete admin-role accounts, and only after a second confirmation dialog requiring exact text `DELETE ADMIN`.
- **All admin permissions included:** Superuser passes every `isAdminOrAbove()` and `isAdminOrMod()` check.

## Role Helper Functions — `lib/roles.ts`

All role checks should import from `@/lib/roles`. Never compare role strings directly.

```typescript
import {
  isAdminOrAbove,   // true for admin | superuser
  isAdminOrMod,     // true for admin | superuser | moderator
  isSuperuser,      // true only for superuser
  displayRole,      // maps superuser → 'admin' for UI display
  canDeleteUser,    // full deletion permission check
} from '@/lib/roles';
```

### `isAdminOrAbove(role)`

Use when a feature or route requires admin-level access (not moderator):

```typescript
if (!isAdminOrAbove(profile?.role)) return forbidden();
```

### `isAdminOrMod(role)`

Use when moderators also have access (admin panel pages, maintenance bypass, page visibility):

```typescript
if (!isAdminOrMod(role)) redirect('/dashboard');
```

### `isSuperuser(role)`

Use only when something is superuser-exclusive (delete confirmation logic):

```typescript
const callerIsSuperuser = isSuperuser(profile?.role as string);
```

### `displayRole(role)`

Use for every UI display of a user's role. Converts `superuser` → `'admin'`:

```typescript
<span>{displayRole(user.role).replace(/_/g, ' ')}</span>
```

### `canDeleteUser(currentRole, currentId, targetRole, targetId)`

Returns `{ allowed: boolean; reason?: string }`. Use before attempting any user deletion:

```typescript
const { allowed, reason } = canDeleteUser(adminRole, adminId, user.role, user.id);
if (!allowed) throw new Error(reason);
```

## RLS Function — `is_admin()`

The Supabase `is_admin()` function is used across RLS policies to grant admin-level DB access. It includes `superuser`:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role::text IN ('admin', 'moderator', 'superuser')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Middleware Checks

`middleware.ts` uses `isAdminOrMod` and `isAdminOrAbove` from `lib/roles.ts` for:

- Maintenance bypass (admin + mod + superuser bypass maintenance mode)
- Impersonation cookie validation (admin + superuser only)
- Admin path guard (`/admin/**` requires `isAdminOrMod`)
- Page visibility (admin + mod + superuser bypass page-off restrictions)

## Adding a New Role Check

1. Import the appropriate helper from `@/lib/roles` — never compare raw strings
2. If the check is "admin-only", use `isAdminOrAbove()` (includes superuser)
3. If the check is "admin or moderator", use `isAdminOrMod()` (includes superuser)
4. If you need to display a role, always pass through `displayRole()` first

## Enum Values

The `user_role` Postgres enum contains:
`student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`, `superuser`

The TypeScript type mirrors this in `lib/types.ts`:
```typescript
export type UserRole = 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin' | 'superuser';
```

Note: Supabase-generated types may lag behind — cast to `string` when comparing if TS complains about enum overlap.
