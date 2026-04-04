# Quick Task: Admin Test User Slots

**Date:** 2026-04-04
**Task ID:** 260404-hht
**Status:** Complete (awaiting human-verify checkpoint)

## Description

Add a "Test Users" tab to Admin Settings (/admin/settings) with 3 configurable user shortcut slots, and add quick-switch buttons to the profile dropdown that open magic link sessions in new tabs.

## Solution

1. **Migration** (`supabase/migrations/20260404_admin_test_user_slots.sql`): Created `admin_test_user_slots` table with `slot_1/2/3` UUID columns referencing `profiles`, RLS policy scoped to `admin_user_id = auth.uid()`.

2. **TestUsersTab component** (`app/admin/settings/components/TestUsersTab.tsx`): 3 sortable slots with `@dnd-kit` drag-reorder, `searchMembers()` powered search input per slot, role-icon chips (GraduationCap/Flower2/Stethoscope/School/User), upsert save to DB.

3. **Admin settings page** (`app/admin/settings/page.tsx`): Added `'test-users'` to Tab union and TABS array, renders `<TestUsersTab />`.

4. **Impersonate API route** (`app/api/admin/impersonate/route.ts`): POST endpoint, verifies admin role, uses service client to `getUserById` then `generateLink({ type: 'magiclink' })`, returns `{ url }`.

5. **Header.tsx**: Added `TestSlot` interface, `testSlots` state, `fetchTestSlots()` (loads on auth state change for admins), `handleQuickSwitch()` (calls impersonate API, opens URL in new tab), `QuickSwitchRoleIcon` helper, Quick Switch section in UserMenu dropdown between theme switcher and logout.

## Notes

- Migration blocked from applying via `npx supabase db push --include-all` due to pre-existing out-of-order migration conflict (`posts` table). Apply `20260404_admin_test_user_slots.sql` directly in Supabase dashboard.
- TypeScript compiles with 0 errors.
