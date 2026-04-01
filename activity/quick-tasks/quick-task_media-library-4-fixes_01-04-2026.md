# Quick Task: Media Library — 4 Fixes

**Task ID:** 260401-ahn
**Date:** 2026-04-01
**Status:** Complete

## Task Description

Fix 4 issues in the admin media library at `/admin/media`:

1. Folder delete auto-triggers without user confirmation
2. Role-based deletion permissions missing (moderator / admin distinction)
3. No way to move files between folders
4. Right preview panel has fixed width, not resizable

## Solution

### Fix 1: Folder delete auto-trigger

Changed `deleteFolder` in `actions.ts` so `force=false` ALWAYS returns `{ success: false, fileCount }` — never deletes. Removed early-exit auto-delete path in `FolderSidebar.handleDeleteRequest`. Dialog now always shows.

### Fix 2: Role-based deletion

- Moderators: see a flag icon on folders — clicking opens a "Request Deletion" dialog that notifies all admins via the notifications table (`requestFolderDeletion` action).
- Admins: see trash icon — clicking opens a password-confirmation dialog (`PasswordConfirmDialog`). Password verified via a standalone `verifyAdminPassword` action (does not affect existing session).
- File deletion in the detail panel: only visible to admins, also requires password entry.

### Fix 3: Move files into folders

Added `moveMediaItem` server action. Added "Move to folder" dropdown in the detail panel (folders grouped by bucket using `<optgroup>`). Move button disabled when no change. On success updates item state in grid and panel.

### Fix 4: Resizable right panel

Added `panelWidth` state (200–600px, default 380px) with a 1px drag handle on the left edge of the desktop panel. Uses a ref to avoid stale closure during mousemove. `select-none` class prevents text selection during drag. Width persists in localStorage.

## Files Modified

- `app/admin/media/actions.ts` — fixed deleteFolder guard, added requestFolderDeletion, verifyAdminPassword, moveMediaItem
- `app/admin/media/FolderSidebar.tsx` — role-based icons, PasswordConfirmDialog, RequestDeletionDialog
- `app/admin/media/MediaDetailPanel.tsx` — admin-only delete with password, move-to-folder section, flex-1 width
- `app/admin/media/MediaPageClient.tsx` — panelWidth + drag handle, new props propagation, handleMove callback
- `app/admin/media/page.tsx` — fetch full_name + email, pass currentUserEmail + currentUserName

## Commits

- `39e969e` — fix: folder delete confirmation always shows, never auto-deletes
- `b8568a7` — feat: role-based deletion, move files, password confirmation
- `e6a2fcb` — feat: resizable right preview panel with drag handle
