# Phase 3: Member Media Library in Settings - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Read-only member media page in user Settings. Teachers, wellness practitioners, and admins see their own uploaded files. No upload, no delete — only viewing. Reuses visual patterns from the admin media library but with stripped-down controls.

</domain>

<decisions>
## Implementation Decisions

### Layout
- Simplified folder sidebar: list of categories (Avatars, Certificates, Uploads) — no folder management controls, no create/rename/reorder
- Same grid/list toggle and search as admin, filtered to uploaded_by = current user
- Detail panel: same as admin but no delete button, no "Uploaded by" field

### Role Gating
- Visible to: teacher, wellness_practitioner, admin roles (same as My Events)
- Students do not see the Media link in Settings sidebar

### Empty State
- "No media files yet. Files you upload (like certificates and profile photos) will appear here."

### Claude's Discretion
- Reuse admin media components where possible (MediaGrid, MediaList, MediaDetailPanel variants or props)
- Route at `app/settings/media/page.tsx`

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- SettingsShell.tsx at `app/settings/components/SettingsShell.tsx` — NAV_ITEMS array, role-gated items pattern
- Admin media components: MediaGrid, MediaList, MediaToolbar, MediaDetailPanel, FolderSidebar
- mediaUtils.ts helpers (getFileTypeColor, formatFileSize, etc.)
- getMediaItems server action (add filter for uploaded_by)

### Established Patterns
- Settings pages are server components wrapping client components
- Role gating via `roles` array on NAV_ITEMS (see My Events entry)
- SettingsShell passes `userRole` prop

### Integration Points
- SettingsShell NAV_ITEMS: Add "Media" after My Events with roles: ['teacher', 'wellness_practitioner', 'admin']
- Server-side user role check in page.tsx (same pattern as my-events)

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the spec — follow Phase 2 admin patterns adapted for read-only member view.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
