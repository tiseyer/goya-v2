# Phase 7: Onboarding Migration - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

All new users go through the flow player for onboarding. Hardcoded onboarding system fully removed. 3 role-based templates seeded via migration. No in-progress users disrupted.

</domain>

<decisions>
## Implementation Decisions

### Migration Strategy
- Hard cutover — remove old onboarding routes immediately after seeding templates. No feature flag.
- In-progress users: mark all as onboarding_completed=true via migration. Fresh start — they can redo via flow builder if needed.
- Seed templates via Supabase migration — templates exist on deploy, no manual admin action.
- Keep onboarding_completed field in profiles — used as a flow condition.

### Claude's Discretion
- Exact element mapping from existing onboarding questions to flow elements
- Template naming and descriptions
- Which profile fields each template step maps to
- Order of cleanup (routes first or middleware first)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/onboarding/ — existing onboarding pages to read and map
- Existing onboarding steps define the questions/fields to replicate
- lib/flows/types.ts — FlowElement types for template creation

### Established Patterns
- Supabase migrations for data seeding
- profiles table has onboarding_completed boolean

### Integration Points
- Remove app/onboarding/ directory
- Remove onboarding redirects from middleware
- Keep onboarding_completed field (used as condition)
- Templates reference existing profile field names

</code_context>

<specifics>
## Specific Ideas

From user spec:
- 3 templates: Student Onboarding, Teacher Onboarding, Wellness Practitioner Onboarding
- Each based on existing onboarding flow for that role path
- Conditions: role matches, onboarding_completed=false
- Trigger: login, Frequency: once, Display: modal (not dismissible)
- Profile field mappings set correctly for each question
- Read existing onboarding implementation CAREFULLY before creating templates

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
