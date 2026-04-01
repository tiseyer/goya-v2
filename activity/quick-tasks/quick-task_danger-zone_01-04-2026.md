# Quick Task: Danger Zone

**Date:** 2026-04-01
**Status:** Complete

## Description

Implement the Danger Zone section in admin Settings > General tab with Clear Cache and Invalidate All Sessions actions.

## Solution

- Created `DangerZone.tsx` component with two actions and shared `ConfirmDialog` (typed confirmation word)
- Clear Cache: `POST /api/admin/danger/clear-cache` — `revalidatePath('/', 'layout')`
- Invalidate Sessions: `POST /api/admin/danger/invalidate-sessions` — iterates non-admin users, calls `auth.admin.signOut(userId)`
- Both routes require admin role, log to audit
