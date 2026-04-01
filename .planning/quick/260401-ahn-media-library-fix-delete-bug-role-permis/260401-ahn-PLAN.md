---
type: quick-task
id: 260401-ahn
name: "Media library: fix delete bug, role permissions, move files, resizable panel"
status: planned
files_modified:
  - app/admin/media/FolderSidebar.tsx
  - app/admin/media/MediaDetailPanel.tsx
  - app/admin/media/MediaPageClient.tsx
  - app/admin/media/actions.ts
  - app/admin/media/page.tsx
---

<objective>
Fix 4 issues in the admin media library: (1) folder delete auto-triggers without user confirmation, (2) role-based folder/file deletion permissions with moderator "Request Deletion" and admin password confirmation, (3) move files into folders from the detail panel, (4) resizable right preview panel with drag handle.

Purpose: Prevent accidental data loss, enforce role permissions, add missing file organization UX, improve layout flexibility.
Output: Updated media library components with all 4 fixes working.
</objective>

<context>
@app/admin/media/FolderSidebar.tsx
@app/admin/media/MediaDetailPanel.tsx
@app/admin/media/MediaPageClient.tsx
@app/admin/media/actions.ts
@app/admin/media/page.tsx
@supabase/migrations/20260374_media_library_schema.sql

Key interfaces:
- MediaFolder: Row from media_folders table (id, name, parent_id, bucket, sort_order, created_by, created_at)
- MediaItem: Row from media_items with uploader join (id, bucket, folder, file_name, file_url, file_type, file_size, width, height, title, alt_text, caption, uploaded_by, uploaded_by_role, created_at, updated_at, uploader_name)
- deleteFolder(id, force): Returns { success, fileCount?, warning?, error? }. When force=false and fileCount>0, returns warning. When force=false and fileCount=0, CURRENTLY DELETES (this is the bug).
- deleteMediaItem(id): Deletes from storage + DB
- MediaPageClient receives: isAdmin (boolean), currentUserId (string), currentUserRole (string) from page.tsx
- FolderSidebar receives: isAdmin (boolean) — used to show/hide delete button
- MediaDetailPanel receives: isAdmin (boolean) — used to show/hide file delete section
- Notifications pattern: `(serviceClient as any).from('notifications').insert({ user_id, type, title, body, link, actor_id })`
- The `folder` column on media_items is a UUID FK to media_folders.id (ON DELETE SET NULL)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix folder delete auto-trigger bug</name>
  <files>app/admin/media/FolderSidebar.tsx, app/admin/media/actions.ts</files>
  <action>
**Root cause:** In `handleDeleteRequest` (FolderSidebar.tsx lines 347-365), when a folder has 0 files, `deleteFolder(folder.id, false)` succeeds and deletes the folder immediately because `actions.ts deleteFolder()` only blocks deletion when `fileCount > 0 && !force`. For 0-file folders, it proceeds past the guard and deletes without confirmation.

**Fix in actions.ts — `deleteFolder` function:**
1. Change the logic so `force=false` ALWAYS returns without deleting — it should ONLY return the fileCount as information. Move the deletion logic to ONLY execute when `force=true`.
2. Specifically, after counting files: if `!force`, return `{ success: false, fileCount, warning: '...' }` regardless of whether fileCount is 0 or > 0. The `success: false` with fileCount tells the UI "show confirmation dialog with this count".
3. Only when `force=true`: proceed with unfoldering items (if any), re-parenting child folders, and deleting the folder. Return `{ success: true, fileCount }`.

**Fix in FolderSidebar.tsx — `handleDeleteRequest`:**
1. Remove the early-exit path on line 358-364 that handles `result.success` (which was the 0-files-auto-delete path).
2. The function should: call `deleteFolder(folder.id, false)`, set `setDeleteFileCount(result.fileCount ?? 0)`, and always show the confirmation dialog. Never auto-delete.
3. The dialog and `handleDeleteConfirm` already call `deleteFolder(deleteTarget.id, true)` correctly — no changes needed there.

**Verify the dialog itself** (DeleteConfirmDialog) does NOT have any setTimeout or auto-close logic. It currently looks clean — buttons are explicit "Cancel" and "Delete folder" with `onClick` handlers only.
  </action>
  <verify>
1. Open /admin/media in browser
2. Create a test folder (empty), click the trash icon — dialog MUST appear and stay until you click Cancel or Delete
3. Create a folder with files, click trash — dialog shows file count warning, stays open until explicit action
4. Confirm deletion works when clicking "Delete folder" button
  </verify>
  <done>Folder delete confirmation dialog always appears and never auto-dismisses. Folders are only deleted when user explicitly clicks "Delete folder" button.</done>
</task>

<task type="auto">
  <name>Task 2: Role-based folder and file deletion permissions</name>
  <files>app/admin/media/FolderSidebar.tsx, app/admin/media/MediaDetailPanel.tsx, app/admin/media/MediaPageClient.tsx, app/admin/media/actions.ts, app/admin/media/page.tsx</files>
  <action>
**Pass currentUserRole deeper into components:**
1. In `page.tsx`: already passes `currentUserRole` to MediaPageClient. No change needed.
2. In `MediaPageClient.tsx`: pass `currentUserRole` to `FolderSidebar` (add prop) and to `MediaDetailPanel` (add prop).
3. In `FolderSidebar.tsx`: add `currentUserRole: string` prop. Change the delete button visibility logic: instead of `{isAdmin && (` show trash icon, use role-based logic:
   - If `currentUserRole === 'admin'`: show trash icon (existing behavior)
   - If `currentUserRole === 'moderator'`: show a different icon — a "request" icon (e.g., a flag or mail icon) with title "Request folder deletion"
   - Neither: hide delete button entirely

**Moderator "Request Deletion" flow (FolderSidebar.tsx):**
1. When a moderator clicks the request icon, instead of showing DeleteConfirmDialog, show a simpler "Request Deletion?" dialog with a single "Submit Request" button.
2. Create a new server action `requestFolderDeletion` in `actions.ts` that:
   - Takes `{ folderId, folderName, requestedBy, requestedByName }` 
   - Finds all admin users: `SELECT id FROM profiles WHERE role = 'admin'`
   - Inserts a notification for each admin: `{ user_id: adminId, type: 'folder_deletion_request', title: 'Folder deletion requested', body: '{requestedByName} requested deletion of folder "{folderName}" (ID: {folderId})', link: '/admin/media', actor_id: requestedBy }`
   - Returns `{ success: true }`
3. After submission, show a brief success toast/message "Deletion request submitted" and close the dialog.

**Admin password confirmation for folder AND file deletion:**
1. Create a `PasswordConfirmDialog` component (can be inline in FolderSidebar.tsx or a shared component at `app/admin/media/components/PasswordConfirmDialog.tsx`). It shows:
   - A text explaining "Re-enter your password to confirm deletion"
   - Email field (pre-filled, read-only) and password input field
   - Cancel and Confirm buttons
2. Create a server action `verifyAdminPassword` in `actions.ts`:
   - Takes `{ email, password }`
   - Calls `createClient()` (browser Supabase client won't work in server action) — use the approach: create a temporary Supabase client with `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` and call `.auth.signInWithPassword({ email, password })`.
   - Actually, since this is a server action, use `createSupabaseServerActionClient()` pattern. BUT we need the user's actual password, not the session. Instead: import `createClient` from `@supabase/supabase-js` directly, create a fresh client with the public URL and anon key from env, call `signInWithPassword({ email, password })`. If it succeeds, return `{ success: true }`. If it fails, return `{ success: false, error: 'Invalid password' }`.
   - Important: this does NOT affect the existing session. It's a standalone auth check.
3. In `FolderSidebar.tsx` for admin: when admin clicks delete, show the `PasswordConfirmDialog` first. On password verify success, THEN show the existing `DeleteConfirmDialog`. Or combine them — password field in the delete dialog itself. Simpler approach: add a password input to `DeleteConfirmDialog` that only appears when `requirePassword` is true. The "Delete folder" button is disabled until password is entered. On click, first verify password, then delete.
4. In `MediaDetailPanel.tsx`: same pattern for file deletion. Add `currentUserRole` and `currentUserEmail` props. When `currentUserRole === 'admin'`, the existing delete section shows but requires password entry before "Delete permanently" works. When `currentUserRole === 'moderator'`, the delete section is hidden entirely (moderators cannot delete individual files — only request folder deletion). Update the `isAdmin` check on line 340 to handle this.
5. In `page.tsx`: also pass `user?.email` to MediaPageClient, which passes it down as `currentUserEmail`.
  </action>
  <verify>
1. Log in as moderator, go to /admin/media — folder sidebar should show "request deletion" icon instead of trash, no file delete button in detail panel
2. Click request deletion — notification should be created (check notifications table)
3. Log in as admin — trash icon visible, clicking it shows password confirmation
4. Wrong password rejects, correct password allows deletion to proceed
5. File deletion in detail panel also requires password for admin
  </verify>
  <done>Moderators see "Request Deletion" button that creates admin notifications. Admins must re-enter password before deleting folders or files. Neither role can bypass these restrictions.</done>
</task>

<task type="auto">
  <name>Task 3: Move files into folders from detail panel</name>
  <files>app/admin/media/MediaDetailPanel.tsx, app/admin/media/actions.ts, app/admin/media/MediaPageClient.tsx</files>
  <action>
**New server action in actions.ts:**
1. Add `moveMediaItem(itemId: string, folderId: string | null): Promise<{ success: boolean; error?: string }>` server action.
2. Implementation: use `getSupabaseService()` to update `media_items` set `folder = folderId` where `id = itemId`. If `folderId` is non-null, first verify the folder exists by selecting from `media_folders`. Return success/error.

**Update MediaDetailPanel props and UI:**
1. Add props: `folders: MediaFolder[]` (list of all folders for the dropdown) and `onMove: (id: string, folderId: string | null) => void` (callback after move).
2. Add a "Move to folder" section between the read-only metadata and the delete section. It contains:
   - A `<select>` dropdown with options: "No folder" (value=""), then each folder grouped by bucket. Use `<optgroup label={bucketLabel}>` for grouping. Each option: `<option value={folder.id}>{folder.name}</option>`.
   - Pre-select the current folder (match `item.folder` to a folder id, or "" if null).
   - A "Move" button that is disabled when the selected value matches the current folder.
3. On "Move" click: call `moveMediaItem(item.id, selectedFolderId || null)`. On success, call `onMove(item.id, selectedFolderId || null)` to update parent state.

**Update MediaPageClient:**
1. Pass `folders` prop to `MediaDetailPanel`.
2. Add `onMove` prop. Import `MediaFolder` type. In `handleMove` callback: update the item's folder in `items` state, and if the current view is filtered to a specific folder, optionally remove the item from the visible list (since it moved out). Call `setSelectedItem` with updated item.
3. Pass the `onMove` handler to both mobile and desktop MediaDetailPanel instances.
  </action>
  <verify>
1. Open /admin/media, select a file in the grid
2. In the detail panel, find the "Move to folder" dropdown
3. Select a different folder, click "Move" — file should move (verify in DB: media_items.folder updated)
4. Select "No folder" to unfolder a file — folder column set to null
5. The dropdown pre-selects the file's current folder correctly
  </verify>
  <done>Files can be moved between folders (or unfoldered) via a dropdown + Move button in the detail panel. The media_items.folder column is updated on the server.</done>
</task>

<task type="auto">
  <name>Task 4: Resizable right preview panel with drag handle</name>
  <files>app/admin/media/MediaPageClient.tsx, app/admin/media/MediaDetailPanel.tsx</files>
  <action>
**Add resizable panel logic to MediaPageClient.tsx:**
1. Add state: `const [panelWidth, setPanelWidth] = useState(() => { const stored = typeof window !== 'undefined' ? localStorage.getItem('media-panel-width') : null; return stored ? parseInt(stored, 10) : 380; });`
   Actually, since this is SSR, initialize to 380 and hydrate from localStorage in a useEffect (same pattern as `media-view-mode` on line 188-191).
2. Add `const [isDragging, setIsDragging] = useState(false);`
3. Constants: `const PANEL_MIN = 200; const PANEL_MAX = 600;`
4. Add mouse event handlers for the drag handle:
   ```
   const handleDragStart = useCallback((e: React.MouseEvent) => {
     e.preventDefault();
     setIsDragging(true);
     const startX = e.clientX;
     const startWidth = panelWidth;
     
     const handleMouseMove = (e: MouseEvent) => {
       // Panel is on the right, so dragging left increases width
       const delta = startX - e.clientX;
       const newWidth = Math.min(PANEL_MAX, Math.max(PANEL_MIN, startWidth + delta));
       setPanelWidth(newWidth);
     };
     
     const handleMouseUp = () => {
       setIsDragging(false);
       document.removeEventListener('mousemove', handleMouseMove);
       document.removeEventListener('mouseup', handleMouseUp);
       // Persist to localStorage
       localStorage.setItem('media-panel-width', String(panelWidth));
     };
     
     document.addEventListener('mousemove', handleMouseMove);
     document.addEventListener('mouseup', handleMouseUp);
   }, [panelWidth]);
   ```
   Note: use a ref for the current width during drag to avoid stale closure. Use `panelWidthRef.current` inside mousemove, and update both ref and state.

5. Replace the desktop panel wrapper (line 563) `<div className="hidden md:block overflow-hidden shrink-0">` with:
   ```
   <div className="hidden md:flex overflow-hidden shrink-0" style={{ width: panelWidth }}>
     {/* Drag handle */}
     <div
       onMouseDown={handleDragStart}
       className="w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors shrink-0"
       title="Drag to resize"
     />
     <MediaDetailPanel ... />
   </div>
   ```

6. Update `MediaDetailPanel.tsx`: change the hardcoded `w-[380px]` class on the outer div (line 226) to `w-full` or `flex-1` so it fills the parent container width instead of having its own fixed width. The width is now controlled by the parent wrapper's inline style.

7. Add `select-none` class to the main layout div when `isDragging` is true to prevent text selection during drag.

8. Hydrate panelWidth from localStorage in the existing useEffect (line 188):
   ```
   const storedPanelWidth = localStorage.getItem('media-panel-width');
   if (storedPanelWidth) {
     const parsed = parseInt(storedPanelWidth, 10);
     if (parsed >= 200 && parsed <= 600) setPanelWidth(parsed);
   }
   ```
  </action>
  <verify>
1. Open /admin/media, select a file to open the detail panel
2. Hover on the left edge of the panel — cursor changes to col-resize
3. Drag left to widen (up to 600px max), drag right to narrow (down to 200px min)
4. Refresh page — panel width persists from localStorage
5. No text selection issues during drag
  </verify>
  <done>Right preview panel has a drag handle for resizing between 200-600px. Width persists in localStorage across sessions. Default is 380px.</done>
</task>

</tasks>

<verification>
1. All 4 fixes work independently — no regressions in existing media library functionality
2. Upload, search, filter, sort, folder creation, folder reorder still work
3. Mobile bottom sheet detail panel unaffected (resize is desktop-only)
4. `npm run build` passes without TypeScript errors
</verification>

<success_criteria>
- Empty folder delete: dialog always shows, never auto-deletes
- Moderator: sees "Request Deletion" instead of trash, cannot delete files
- Admin: must enter password before any deletion (folder or file)
- Files can be moved between folders via detail panel dropdown
- Detail panel is resizable 200-600px with persistent width
</success_criteria>
