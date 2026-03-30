# Phase 1: Database Schema - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

All flow data structures exist in Supabase with correct constraints, indexes, and access policies — no data model decisions need to be revisited. Tables: flows, flow_steps, flow_branches, flow_responses, flow_analytics. Birthday column on profiles. RLS policies for admin/moderator write and user-own-data access.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and the user's detailed spec for table schemas. Key decisions from research:
- JSONB versioning field recommended for elements/conditions (schema_version integer DEFAULT 1)
- GIN index on flows.conditions for efficient condition evaluation
- flow_responses.responses uses jsonb with element_key as key
- Indexes on flow_steps(flow_id, position), flow_responses(user_id, flow_id), flow_analytics(flow_id, created_at)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Supabase migration pattern in supabase/migrations/
- Existing RLS patterns from chatbot_config, support_tickets tables (admin/moderator access)
- profiles table already exists — birthday column is an ALTER TABLE ADD COLUMN

### Established Patterns
- Migrations follow YYYYMMDDNN naming convention
- RLS uses auth.uid() for user-own-data, service role for admin operations
- CASCADE deletes on foreign keys for parent-child relationships

### Integration Points
- profiles table (birthday column addition, profile field mapping target)
- auth.users (foreign key references for user_id columns)

</code_context>

<specifics>
## Specific Ideas

User provided detailed table schemas in the milestone spec:
- flows: id, name, description, status, priority, display_type, modal_dismissible, modal_backdrop, trigger_type, trigger_delay_seconds, frequency, conditions jsonb, created_at, updated_at, created_by, is_template, template_name
- flow_steps: id, flow_id, position, title, elements jsonb, next_step_id, created_at
- flow_branches: id, step_id, element_key, answer_value, target_step_id
- flow_responses: id, flow_id, user_id, started_at, completed_at, last_step_id, responses jsonb, status
- flow_analytics: id, flow_id, user_id, event, step_id, created_at

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
