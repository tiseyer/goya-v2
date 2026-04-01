# Media Library Restructure

## What This Is

Restructure the GOYA v2 admin media library sidebar from a flat folder list to bucket-based navigation with collapsible subfolder sections, bucket-aware query logic, and supporting DB schema changes.

## Core Value

Media files are organized by purpose (general media, certificates, avatars) with intuitive bucket-based navigation.

## Current Milestone: v1.16 Media Library Restructure

**Goal:** Replace the flat folder sidebar with 3 bucket sections (All Media, Certificates, Avatars), each with collapsible subfolder trees, and update query logic to filter by bucket + folder.

**Target features:**
- 3 top-level bucket sections: All Media (Image), Certificates (Award), Avatars (User)
- Collapsible subfolder trees per bucket
- "Add folder" button scoped to All Media only
- Bucket-aware media query logic
- DB migration: `bucket` and `is_system` columns on `media_folders`
- Regenerate Supabase TypeScript types

## Requirements

### Active

- [ ] Sidebar shows 3 bucket sections with lucide-react icons
- [ ] All Media toggles user-created folders (is_system=false, bucket='media')
- [ ] Certificates toggles 4 system subfolders
- [ ] Avatars has no subfolders
- [ ] Add folder button only appears under All Media
- [ ] Active/selected state highlighting on bucket and subfolder
- [ ] Subfolder selection keeps parent expanded and active
- [ ] Query filters media_items by bucket when bucket selected
- [ ] Query filters media_items by folder_id when subfolder selected
- [ ] media_folders.bucket column (text, default 'media')
- [ ] media_folders.is_system column (boolean, default false)

### Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop between buckets | Complexity — files belong to fixed buckets based on upload context |
| Member-facing media page changes | This milestone is admin sidebar only |
| New upload flows | Existing upload instrumentation unchanged |

## Context

- Builds on v1.11 Media Library workstream + quick tasks (delete permissions, move files, resizable panel, PostgREST fix)
- `media_items` already has a `bucket` column — this adds bucket awareness to `media_folders` and sidebar UI
- Existing sidebar: `FolderSidebar.tsx` with flat folder list under "All Media" header
- Three buckets in Supabase Storage: `avatars`, `uploads` (maps to "All Media"), `certificates` (maps to system folders)

## Constraints

- **Tech Stack**: Next.js App Router, Tailwind CSS, Supabase — no new frameworks
- **Icons**: lucide-react (Image, Award, User)
- **Compatibility**: Must not break existing upload flows that write to media_items

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Bucket sections instead of flat folders | Clear visual separation of file types | — Pending |
| is_system flag on folders | Distinguish admin-created vs system folders | — Pending |

---
*Last updated: 2026-04-01 after milestone v1.16 defined*
