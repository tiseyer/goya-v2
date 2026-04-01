---
task_id: 260331-oyj
date: 2026-03-31
status: complete
---

# Quick Task: Admin Sidebar Docs Icon + Media Library Header Fix

## Task Description

Two small UI fixes in the admin panel:

1. **Documentation sidebar icon** — The Documentation link in the admin sidebar Settings group reused the same SVG path as the Courses icon (open-book road path). Updated to use the lucide-react `BookOpen` icon's two-path SVG so it is visually distinct from Courses.

2. **Media Library header alignment** — The FolderSidebar header used `h-12` (48px) while the MediaToolbar used `h-14` (56px), causing a visible vertical misalignment between the "Folders" text and the search/filter bar. Fixed by changing FolderSidebar header to `h-14`.

## Status

Complete.

## Solution

- `app/admin/components/AdminShell.tsx` — line 114: replaced single-path Documentation SVG with BookOpen dual-path (`M2 3h6...` + `M22 3h-6...`)
- `app/admin/media/FolderSidebar.tsx` — line 433: changed `h-12` to `h-14` on the sidebar header div

## Commits

- `b1b6efa` — fix(admin-sidebar): update Documentation icon to BookOpen paths
- `21437bd` — fix(media-library): align FolderSidebar header height to h-14
