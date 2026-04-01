# Phase 16: Database Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

All DB schema changes needed for the Member Events milestone. Add event_type, created_by, status workflow columns to events table. Create event_audit_log table. Implement RLS policies for teacher/WP/school/moderator/admin/public roles. Regenerate TypeScript types. Must pass tsc --noEmit.

IMPORTANT — inspect before planning:
- Check types/supabase.ts: does the `profiles` table have a `moderator` role?
- Check types/supabase.ts: does the `events` table have `event_type`, `created_by`, `status`, `rejection_reason` columns?
- Check app/admin/events/ to understand the current event data model
- Report findings at the start before writing any migrations

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Specific schema requirements from user:
- Add `event_type text NOT NULL DEFAULT 'goya' CHECK (event_type IN ('goya', 'member'))` to events if not present
- Add `created_by uuid REFERENCES profiles(id) ON DELETE SET NULL` to events if not present
- Add or extend `status` column: must support 'draft', 'pending_review', 'published', 'rejected', 'deleted'
- Add `rejection_reason text` to events if not present
- Create `event_audit_log` table: id uuid PK, event_id uuid FK → events(id) ON DELETE CASCADE, action text (created|edited|status_changed|deleted), performed_by uuid FK → profiles(id) ON DELETE SET NULL, performed_by_role text, changes jsonb, created_at timestamptz DEFAULT now()
- RLS policies:
  - Teachers/WPs/School owners: INSERT own events, SELECT own events (all statuses except deleted), UPDATE own events if status is draft/pending_review/rejected, soft-delete own events
  - Moderators: SELECT all non-deleted events, UPDATE status to published/rejected, set rejection_reason
  - Admins: full access including deleted events
  - Public authenticated: SELECT only published events
  - event_audit_log: authenticated INSERT, admin-only SELECT
- After migration: regenerate types → `npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts`
- Run `npx tsc --noEmit` — must pass before proceeding

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the schema specs above — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
