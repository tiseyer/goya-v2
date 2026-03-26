# Phase 6: Analytics - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure API phase — discuss skipped)

<domain>
## Phase Boundary

Callers can retrieve aggregated platform metrics across members, memberships, revenue, engagement, and credits. Five analytics aggregation endpoints under `/api/v1/analytics/`.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure API infrastructure phase. Compute analytics from local Supabase tables only (no Stripe API calls). Follow established patterns.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Existing analytics computation functions in the admin analytics page (app/admin/shop/analytics/)
- Full API infrastructure from Phase 1
- Service layer pattern from Phases 2-5

### Integration Points
- profiles table (member counts, roles)
- stripe_subscriptions table (membership data)
- stripe_invoices table (revenue data)
- credit_entries table (credit statistics)
- Events/courses tables (engagement metrics)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure API phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
