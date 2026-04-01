---
phase: 2
plan: 3
subsystem: admin-media-library
tags: [admin, media, detail-panel, upload, delete, drag-drop, progress-cards]
dependency_graph:
  requires: [media-02-01, media-02-02]
  provides: [ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14, ADMIN-15, ADMIN-16, ADMIN-17]
  affects: [admin-media-page, phase-3-member-upload]
tech_stack:
  added: []
  patterns:
    - forwardRef + useImperativeHandle for cross-component file picker trigger
    - base64 file encoding (FileReader) for File transfer through server action boundary
    - Client-side image dimension extraction via new Image() + URL.createObjectURL
    - Sequential multi-file upload queue with per-file progress cards
    - Push-content detail panel (not overlay) — 380px shrinks grid
    - Optimistic UI on save with rollback on error
key_files:
  created:
    - app/admin/media/MediaDetailPanel.tsx
    - app/admin/media/MediaUploader.tsx
  modified:
    - app/admin/media/actions.ts (3 new server actions: updateMediaItem, deleteMediaItem, uploadMediaItem)
    - app/admin/media/MediaPageClient.tsx (wired panel + uploader, added isAdmin/user props)
    - app/admin/media/MediaToolbar.tsx (added uploadSlot prop)
    - app/admin/media/page.tsx (fetches user role server-side, passes to client)
decisions:
  - "Upload button uses forwardRef/useImperativeHandle so toolbar button can trigger file input inside MediaUploader without ref drilling"
  - "File transfer to server action uses base64 encoding via FileReader — avoids multipart FormData complexity with server actions"
  - "deleteMediaItem fetches the row first to get bucket+file_path for storage deletion, then deletes the DB row regardless of storage result"
  - "isAdmin/currentUserId/currentUserRole fetched server-side in page.tsx and passed as props — avoids client round-trip and matches admin layout pattern"
metrics:
  duration: "~35 minutes"
  completed: "2026-03-31"
  tasks: 3
  files: 6
---

# Phase 2 Plan 3: Detail Panel, Upload & Delete Summary

**One-liner:** 380px push-content detail panel with editable metadata + Save, admin delete confirmation, and multi-file upload via toolbar button or drag-drop with per-file progress cards.

## What Was Built

### app/admin/media/actions.ts — 3 new server actions

**updateMediaItem(id, updates):**
- Patches `title`, `alt_text`, `caption` + `updated_at` on `media_items` row
- Returns `{ success, error? }`

**deleteMediaItem(id):**
- Fetches row for `bucket` + `file_path`
- Removes from Supabase Storage (proceeds to DB delete even if storage remove fails — file may already be gone)
- Deletes row from `media_items`

**uploadMediaItem(params):**
- Accepts `fileData` as base64 string (encoded client-side via `FileReader`)
- Decodes to `Uint8Array` and uploads to Supabase Storage with `contentType`
- Gets public URL, then calls `registerMediaItem()` from `lib/media/register.ts` (Phase 1 utility)
- Fetches the newly inserted row (with profile join) and returns full `MediaItem`

### app/admin/media/MediaDetailPanel.tsx

- 380px push-content panel — no z-index, just renders at fixed width causing grid reflow
- Preview: `<img>` with `object-contain` for images; large (w-20 h-20) colored file-type icon for non-images
- Editable fields: Title, Alt Text, Caption — textareas with `isDirty` tracking vs. original item values
- Save button: disabled when not dirty or saving; shows "Saving…"; calls `updateMediaItem`, then `onUpdate` for optimistic update
- Read-only metadata: file name, MIME type, human-readable size, dimensions (images only), formatted upload date, uploader name + role
- Copy URL: truncated monospace URL with copy button; switches to check icon for 1.5s
- Delete section (admin only): first shows "Delete file" button; then inline confirmation with "Cancel" + "Delete permanently" buttons; calls `deleteMediaItem` + `onDelete`

### app/admin/media/MediaUploader.tsx

- `forwardRef` component exposing `openFilePicker()` via `useImperativeHandle`
- Hidden `<input type="file" multiple accept="...">` inside component
- Drag-drop wrapper: `onDragEnter/Leave/Over/Drop` handlers with `isDragOver` state; shows full-area overlay with dashed border + "Drop files to upload" text
- MIME type filter: rejects unsupported types silently (console.warn)
- Size filter: rejects files > 50 MB silently (console.warn)
- Per-file sequential pipeline: generate UUID → `onUploadStart` → extract image dimensions → read as base64 → `onUploadProgress(30)` → `uploadMediaItem` server action → `onUploadProgress(100)` → `onUploadComplete`
- `UploadProgressCard`: aspect-square card with pulse animation, file name, and animated progress bar

### app/admin/media/MediaPageClient.tsx (updated)

- New props: `isAdmin`, `currentUserId`, `currentUserRole`
- `uploaderRef = useRef<MediaUploaderHandle>()` — allows toolbar Upload button to call `uploaderRef.current?.openFilePicker()`
- `uploadCards` state: added/updated/cleared via `handleUploadStart`, `handleUploadProgress`, `handleUploadComplete`
- `handleUpdate(updatedItem)` — replaces item in `items` array and updates `selectedItem`
- `handleDelete(id)` — filters item from `items`, clears `selectedItem`
- `MediaDetailPanel` renders when `selectedItem` is set — pushes grid left
- Upload cards (pending only) shown at top of grid above real items

### app/admin/media/MediaToolbar.tsx (updated)

- Added `uploadSlot?: ReactNode` prop
- Renders a divider + the slot right-aligned at the end of the toolbar

### app/admin/media/page.tsx (updated)

- Fetches current user + profile role server-side (parallel with `getFolders()`)
- Passes `isAdmin`, `currentUserId`, `currentUserRole` to `MediaPageClient`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Design adjustment] Upload button via forwardRef instead of render prop**
- **Found during:** Task 3 implementation
- **Issue:** Plan described rendering the upload button inside `MediaUploader` (which wraps the content area), but the toolbar is a sibling — the button cannot be a child of both
- **Fix:** Used `forwardRef` + `useImperativeHandle` to expose `openFilePicker()`. Toolbar renders its own `<UploadButton>` that calls `uploaderRef.current?.openFilePicker()`. Cleaner separation than render props.
- **Files modified:** MediaUploader.tsx, MediaPageClient.tsx, MediaToolbar.tsx

**2. [Rule 2 - Missing field] deleteMediaItem does not require filePath as param**
- **Found during:** Task 1 implementation
- **Issue:** Plan specified `deleteMediaItem(id, filePath)` signature, but the bucket is also needed for storage deletion and not available to callers
- **Fix:** Changed to `deleteMediaItem(id)` — fetches `bucket + file_path` from the DB row internally. Callers don't need to pass these fields. `MediaDetailPanel` updated accordingly.
- **Files modified:** actions.ts, MediaDetailPanel.tsx

**3. [Rule 2 - Security] isAdmin derived server-side**
- **Found during:** Task 3 implementation
- **Issue:** Plan suggested deriving `isAdmin` from `supabase.auth.getUser()` in a client-side `useEffect`, which is less secure and adds a loading flash
- **Fix:** Fetched role server-side in `page.tsx` (same pattern as `AdminLayout`) and passed as prop. No client round-trip needed.
- **Files modified:** page.tsx, MediaPageClient.tsx

## Notes for Phase 3 (Member Media Library)

- `uploadMediaItem` server action in `actions.ts` is admin-facing. Phase 3 may need a separate action (or the same one with relaxed bucket constraints) for member uploads to the `uploads` bucket only.
- `registerMediaItem()` from `lib/media/register.ts` is the canonical insert function — Phase 3 should use it too.
- `MediaDetailPanel` is admin-only. Phase 3 members likely get read-only file info or a simpler picker — do not reuse this panel directly.
- The `UploadProgressCard` component is exported from `MediaUploader.tsx` and can be reused in Phase 3 if a similar grid-inline progress pattern is needed.

## Known Stubs

None. All editable fields, metadata rows, delete flow, and upload flow are fully wired to real data.

## Self-Check: PASSED

All 6 files verified present. All 3 task commits found:
- `c4e85c7` feat(02-03): add updateMediaItem, deleteMediaItem, uploadMediaItem server actions
- `c8df3e2` feat(02-03): add MediaDetailPanel component
- `4a285e9` feat(02-03): wire MediaUploader + MediaDetailPanel into MediaPageClient
