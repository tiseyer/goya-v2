# Phase 1: Database Schema - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Add bucket and is_system columns to media_folders, apply migration, regenerate types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing migration files in `supabase/migrations/`
- TypeScript types at `types/supabase.ts`
- `media_folders` table already exists with id, name, parent_id, created_by, etc.

### Established Patterns
- Migrations use timestamped filenames: `YYYYMMDD_description.sql`
- Types regenerated via `npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts`

### Integration Points
- `media_folders` queried in FolderSidebar.tsx and media actions.ts
- New columns must be compatible with existing folder CRUD operations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
