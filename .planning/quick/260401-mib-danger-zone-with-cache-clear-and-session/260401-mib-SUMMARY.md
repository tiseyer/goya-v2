# Quick Task 260401-mib: Danger zone with cache clear and session invalidation

**Completed:** 2026-04-01
**Status:** Complete

## What Changed

Replaced the Danger Zone placeholder in admin Settings > General with two functional actions:

1. **Clear Cache** — calls `POST /api/admin/danger/clear-cache`, revalidates all Next.js cached paths via `revalidatePath('/', 'layout')`. Confirm dialog requires typing "CLEAR".
2. **Invalidate All Sessions** — calls `POST /api/admin/danger/invalidate-sessions`, signs out all non-admin users via Supabase Admin API (`auth.admin.signOut`). Admins preserved. Confirm dialog requires typing "INVALIDATE".

Both actions:
- Require admin role (403 if not admin)
- Show inline success/error result
- Log to audit log via `logAuditEventAction`
- Use a shared `ConfirmDialog` component with typed confirmation word

## Files Changed

- `app/admin/settings/page.tsx` — Import DangerZone, replace placeholder
- `app/admin/settings/components/DangerZone.tsx` (new) — DangerZone component with ConfirmDialog
- `app/api/admin/danger/clear-cache/route.ts` (new) — Cache clearing API route
- `app/api/admin/danger/invalidate-sessions/route.ts` (new) — Session invalidation API route
