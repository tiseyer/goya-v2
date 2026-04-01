# Phase 4: Admin Migration Page - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Build an admin migration page at /admin/migration with JSON file upload, mode selector, live import progress, error list, and log download. The server-side import API route reuses the import logic from migration/import-users.ts.

</domain>

<decisions>
## Implementation Decisions

### Page Structure
- Route: /admin/migration
- Add to admin sidebar under Settings section
- Client component with state management for upload, progress, and results

### Upload & Controls
- File input accepting .json files (single or multiple)
- Mode selector: "Skip existing" (default) / "Overwrite existing"
- "Start Import" button — disabled until file selected

### Progress Display
- Live progress: "Processing X of Y users..."
- Counters: success, skipped, error (updating in real-time)
- Progress bar

### Error Display
- Error list showing: email, error reason
- Displayed after import completes (or during if streaming)

### API Route
- POST /api/admin/migration/import
- Accepts multipart form data with JSON file(s) and mode parameter
- Uses Supabase service role key server-side
- Reuses import logic from migration/import-users.ts (extract core logic into shared module)
- Returns streaming response for live progress OR returns full results after completion

### Log Download
- "Download Migration Log" button after import completes
- Downloads the migration-log JSON with per-user results

### Sidebar Integration
- Add "Migration" link to AdminShell sidebar under Settings group

### Claude's Discretion
- Whether to stream progress or batch response
- Exact component structure
- Whether to extract shared import module or inline the logic

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- migration/import-users.ts — core import logic to reuse/extract
- app/admin/components/AdminShell.tsx — sidebar nav to add link
- Existing admin page patterns for layout

### Integration Points
- AdminShell.tsx — add Migration link under Settings
- app/admin/migration/page.tsx — new page
- app/api/admin/migration/import/route.ts — new API route

</code_context>

<specifics>
## Specific Ideas

No additional specifics beyond the detailed spec.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
