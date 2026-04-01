---
phase: 02-sidebar-ui-query-logic
plan: "01"
subsystem: media-library
tags: [sidebar, navigation, query, buckets, lucide-react, dnd-kit]
dependency_graph:
  requires:
    - 01-01 (media_folders table with bucket + is_system columns)
  provides:
    - SIDEBAR_SECTIONS config with 3 UI sections mapped to storage buckets
    - Bucket-aware getMediaItems query logic
    - 3-section collapsible FolderSidebar component
    - activeBucketSection state management in MediaPageClient
  affects:
    - app/admin/media (all files)
tech_stack:
  added: []
  patterns:
    - SIDEBAR_SECTIONS config pattern (constants -> actions -> sidebar -> page client)
    - getSectionByKey helper for bucket resolution
    - activeBucketSection state separate from activeFolder subfolder state
key_files:
  created: []
  modified:
    - app/admin/media/constants.ts
    - app/admin/media/actions.ts
    - app/admin/media/FolderSidebar.tsx
    - app/admin/media/MediaPageClient.tsx
decisions:
  - SIDEBAR_SECTIONS added alongside MEDIA_BUCKETS (not replaced) for backward compat
  - activeBucketSection state defaults to 'media' (All Media) on first load
  - queryFolder = activeFolder ?? activeBucketSection — subfolder UUID takes priority over section key
  - deriveBucket updated to use SIDEBAR_SECTIONS storageBuckets[0] for upload targeting
  - SystemFolderItem (no DnD) for Certificates; SortableFolderItem (with DnD) for All Media
  - coerceBucket() validates URL ?bucket= param on mount
metrics:
  duration: "~25 min"
  completed: "2026-04-01"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 02 Plan 01: Sidebar UI + Query Logic Summary

**One-liner:** Bucket-based 3-section sidebar (All Media/Image, Certificates/Award, Avatars/User) with collapsible folder trees and section-key-aware getMediaItems query routing.

## What Was Built

### Task 1 — Data layer (constants.ts + actions.ts)

Added `SIDEBAR_SECTIONS` export to `constants.ts` — 3 entries mapping UI sections to storage buckets:

- `media` → storageBuckets: `['media', 'uploads']`, hasFolders: true (user-created)
- `certificates` → storageBuckets: `['upgrade-certificates']`, hasFolders: true (system)
- `avatars` → storageBuckets: `['avatars']`, hasFolders: false

Added `SidebarSectionKey` type and `getSectionByKey()` helper. `MEDIA_BUCKETS` preserved for backward compat.

Updated `getMediaItems` folder filter in `actions.ts`:
1. Section key hit → resolve `storageBuckets` → `.in('bucket', [...])` for multi-bucket or `.eq('bucket', ...)` for single
2. Legacy `MEDIA_BUCKETS` key → `.eq('bucket', folder)` (backward compat)
3. UUID → `.eq('folder', uuid)` (subfolder filter)

### Task 2 — UI rebuild (FolderSidebar.tsx + MediaPageClient.tsx)

**FolderSidebar.tsx** — full rebuild:
- Props updated: `activeBucket: SidebarSectionKey | null`, `onBucketSelect` added; old `activeFolder`/`onFolderSelect` retained for subfolder selection
- Iterates `SIDEBAR_SECTIONS` to render 3 rows with lucide-react `Image`/`Award`/`User` icons (16px)
- `ChevronDown`/`ChevronRight` from lucide-react toggle on expand/collapse
- All Media section: user folders (`bucket='media'`, `is_system=false`) rendered via existing `SortableFolderItem` with DnD, rename, delete
- Certificates section: system subfolders rendered via new `SystemFolderItem` (immutable — no DnD, no rename, no delete)
- Avatars section: no subfolder list
- Add folder (+) button only renders next to "All Media" when `activeBucket === 'media'`
- Collapsed mode: shows 3 section icons only
- Active state: `bg-primary/10 text-primary font-semibold` on selected section row; subfolder active keeps parent section expanded

**MediaPageClient.tsx** — state management updates:
- `activeBucketSection: SidebarSectionKey` state (default `'media'`, reads `?bucket=` URL param on mount)
- `handleBucketSelect`: sets section, clears `activeFolder`
- `handleFolderSelect`: sets subfolder UUID, `activeBucketSection` unchanged (parent stays highlighted)
- `queryFolder = activeFolder ?? activeBucketSection` — passed to `getMediaItems`
- `deriveBucket` updated to use `SIDEBAR_SECTIONS.storageBuckets[0]` for upload bucket targeting
- URL param `?bucket=` added (omitted when `'media'` to keep default URLs clean)
- `EmptyState` updated with `activeBucket` prop for contextual empty messages ("No files in Certificates yet.")
- Mobile dropdown: sections + indented subfolders grouped correctly; section selection calls `handleBucketSelect`

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Adjustments

1. **DnD handler signature simplified:** `handleDragEnd` previously accepted a `bucketKey` param; simplified to filter `folders` directly for `media` bucket only (matches new single-bucket DnD context).
2. **Sidebar header label:** Changed from "Folders" to "Library" to better reflect the new bucket-based navigation model.
3. **Empty subfolder state:** Added "No folders yet" / "No subfolders" text when a section is expanded but has no folders — improves clarity vs. blank space.

## Known Stubs

None. All data flows are wired:
- `activeBucketSection` state drives `queryFolder` which drives `getMediaItems`
- `deriveBucket` correctly resolves upload target for each section
- Mobile dropdown correctly maps section/folder selections

## Self-Check: PASSED

- FOUND: app/admin/media/constants.ts
- FOUND: app/admin/media/actions.ts
- FOUND: app/admin/media/FolderSidebar.tsx
- FOUND: app/admin/media/MediaPageClient.tsx
- FOUND: commit 8ffff4b (Task 1 — constants + actions)
- FOUND: commit 09ee35a (Task 2 — FolderSidebar + MediaPageClient)
