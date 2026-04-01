# Phase 2: Sidebar UI + Query Logic - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace flat folder sidebar with 3 bucket sections (All Media, Certificates, Avatars) with collapsible subfolder trees and bucket-aware query filtering.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Structure
- 3 top-level bucket sections: All Media (Image icon), Certificates (Award icon), Avatars (User icon) — using lucide-react icons
- All Media click: selects bucket AND toggles collapsible list of user-created folders (bucket='media', is_system=false)
- Certificates click: selects bucket AND toggles 4 system subfolders (is_system=true)
- Avatars click: selects bucket only (no subfolders)
- "Add folder" button only appears when All Media is active/expanded
- Active state highlighting matches existing sidebar style
- Subfolder selection keeps parent section expanded and active

### Query Logic
- All Media selected (no subfolder) → query media_items where bucket IN ('media', 'uploads') — the "general" bucket
- All Media subfolder selected → filter by folder_id
- Certificates selected → query media_items where bucket='certificates' (or 'upgrade-certificates' matching existing bucket key)
- Certificate subfolder selected → filter by folder_id
- Avatars selected → query media_items where bucket='avatars'

### Constants Update
- MEDIA_BUCKETS in constants.ts needs restructuring to support the new 3-section model
- Current buckets (avatars, event-images, school-logos, upgrade-certificates, uploads) map to the 3 logical sections

### Claude's Discretion
- Exact mapping of existing 5 storage buckets to 3 UI sections
- Collapsible animation approach (CSS transitions or instant)
- Whether to refactor FolderSidebar entirely or adapt the existing structure

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FolderSidebar.tsx` — existing folder sidebar with dnd-kit sortable, folder CRUD, role-based delete/request
- `MediaPageClient.tsx` — orchestrates sidebar, grid, detail panel
- `MediaDetailPanel.tsx` — right panel with file details, move-to-folder dropdown
- `actions.ts` — server actions for media CRUD (folders, items, move, delete)
- `constants.ts` — MEDIA_BUCKETS array with 5 bucket definitions
- `CreateFolderModal.tsx` — existing folder creation modal

### Established Patterns
- FolderSidebar receives folders array, activeFolder state, onFolderSelect callback
- Folder selection driven by folder ID string or null (all media)
- DnD-kit used for folder reordering
- Role-based UI: isAdmin, currentUserRole props control delete vs request-deletion

### Integration Points
- `MediaPageClient.tsx` manages state and passes to sidebar/grid
- Query logic in `actions.ts` fetches media_items with bucket/folder filters
- `page.tsx` server component fetches initial data and renders MediaPageClient
- media_folders table now has `bucket` (text, default 'media') and `is_system` (boolean, default false) columns

</code_context>

<specifics>
## Specific Ideas

- Icons from lucide-react: Image for All Media, Award for Certificates, User for Avatars
- The 4 system subfolders under Certificates need to be pre-created or queried from media_folders where is_system=true and bucket='certificates'

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
