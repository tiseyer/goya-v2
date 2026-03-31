# Phase 1: Database Migrations - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

All new columns exist on the events table so subsequent phases can write data without schema errors. This phase adds: end_date, all_day, location_lat, location_lng, online_platform_name, online_platform_url, registration_required, website_url, organizer_ids.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing migration pattern in `supabase/migrations/`
- Events table already has base columns from v1.9

### Established Patterns
- Supabase migrations with timestamped filenames
- `npx supabase gen types` for type regeneration
- `npx supabase db push` to apply migrations

### Integration Points
- types/supabase.ts must be regenerated after migration

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
