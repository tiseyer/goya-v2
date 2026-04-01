# Phase 2: Admin Media Library Page - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Full media management page in admin backend. Three-panel design: folder tree sidebar, main grid/list area, detail panel. Admins and moderators can browse, search, filter, upload, and annotate all platform media from a single page.

</domain>

<decisions>
## Implementation Decisions

### Layout & Interaction Design
- Folder sidebar: 240px fixed width, collapsible to icon-only (matches AdminShell pattern)
- Detail panel: 380px slide-in from right, push-content layout (not overlay) — matches chatbot panel sizing
- Grid cards: 180px thumbnails, show file name + type icon below — compact standard media library style
- Non-image thumbnails: File-type colored icon (PDF red, video blue, audio purple) centered in card with same dimensions as image cards

### Upload & File Handling
- Upload UX: Upload button top-right + full grid area accepts drag-and-drop with overlay indicator
- Progress: Inline card placeholder in grid with progress bar, transitions to actual thumbnail on completion
- Image dimensions: Client-side extraction via Image() object before upload, sent to server action with registration
- Multi-file: Yes — select multiple or drag multiple, queue sequentially with individual progress cards

### Data Fetching & URL State
- Pagination: Cursor-based infinite scroll with 50 items per batch — loads more as user scrolls grid
- URL state: Search params `?folder=xxx&q=search&type=images&sort=newest&view=grid` — bookmarkable, shareable
- Data fetching: Server action for initial load + client-side fetch for filter/search changes (hybrid SSR + client)
- Detail panel save: Server action with optimistic UI, explicit "Save" button click

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- AdminShell sidebar component at `app/admin/components/AdminShell.tsx` — NAV_ITEMS array for adding Media link
- PageContainer component for consistent layout widths
- Existing admin page patterns (events, courses, users) for data fetching patterns
- `getSupabaseService()` for admin-level queries
- `registerMediaItem` / `registerMediaItemAction` from Phase 1

### Established Patterns
- Admin pages use server components for initial data load
- Client components with `'use client'` for interactive elements
- URL search params for filter state (existing in admin events, admin inbox)
- localStorage for UI preference persistence (sidebar collapse, view toggles)
- Tailwind CSS with design tokens from globals.css
- Color scheme: primary-dark (#1B3A5C), slate grays, white cards with border-[#E5E7EB]

### Integration Points
- AdminShell NAV_ITEMS: Insert "Media" link between Users and Events (after first divider)
- Route: `app/admin/media/page.tsx`
- Server actions for CRUD: `app/admin/media/actions.ts`
- Supabase queries: media_items table with joins to profiles for uploader info

</code_context>

<specifics>
## Specific Ideas

- Sidebar should show All Media as top-level, then buckets (Avatars, Events, Courses, Certificates, Uploads) as categories
- Custom media_folders nested under buckets
- Admins/Mods: create folder (+), rename (double-click), drag to reorder
- Empty states with appropriate messaging per context
- Search bar: debounced 300ms, searches file_name and title
- Filters: File Type (All/Images/PDFs/Videos), Upload Date (All/Today/This week/This month), Uploaded By (All/GOYA team/Members)
- Sort: Newest first (default), Oldest first, Name A-Z, File size
- Detail panel read-only: file name, MIME type, file size (human readable), dimensions (images), upload date, uploaded by (name + role), file URL (copy button)
- Delete button admin only with confirmation modal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
