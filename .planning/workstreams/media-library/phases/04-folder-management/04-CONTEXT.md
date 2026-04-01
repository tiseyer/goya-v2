# Phase 4: Folder Management - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (small interactive phase — straightforward decisions)

<domain>
## Phase Boundary

Admin and moderator folder CRUD in the media library sidebar. Create, rename, reorder, and delete custom folders within buckets.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — small phase with clear requirements. Use Phase 2 FolderSidebar as the base.

Key requirements:
- FOLD-01: Create folder via modal (name + parent selector)
- FOLD-02: Rename folder inline on double-click
- FOLD-03: Reorder via drag-and-drop (updates sort_order)
- FOLD-04: Delete folder (admin only) with confirmation, warns if files exist

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- FolderSidebar.tsx in app/admin/media/ — already renders folders, needs management controls added
- actions.ts in app/admin/media/ — getFolders() exists, needs createFolder/updateFolder/deleteFolder/reorderFolders
- media_folders table with sort_order column ready for reordering
- dnd-kit already used in admin products for drag-and-drop reordering

### Integration Points
- FolderSidebar.tsx — add create (+) button, inline rename on double-click, drag handles, delete option
- actions.ts — add CRUD server actions for media_folders

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the spec.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
