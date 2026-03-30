# Phase 2: Service Layer + Admin API Routes - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

All admin flow operations are available as tested API endpoints — the UI can be built against stable, validated contracts. Includes CRUD for flows, steps, elements, branches. Cycle detection on save. Kit.com integration wrapper. Condition evaluator stub. All routes protected by admin/moderator auth.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — backend infrastructure phase. Use ROADMAP phase goal, success criteria, and existing API patterns to guide decisions.

Key patterns to follow:
- Existing admin API routes at app/api/admin/ (e.g., stripe-sync/route.ts)
- createSupabaseServerClient() for auth in route handlers
- Service layer pattern in lib/api/services/ (existing services: users, events, courses, credits, etc.)
- Role check pattern from app/admin/layout.tsx (admin/moderator)

Research findings to incorporate:
- DFS cycle detection on flow save (~20 lines, must be in save API not just UI)
- Kit.com tag wrapper with graceful fallback when KITCOM_API_KEY missing
- flow_action_executions idempotency table design for Phase 4 prep (optional in this phase)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- lib/api/services/*.ts — existing service layer pattern
- lib/supabaseServer.ts — createSupabaseServerClient()
- app/api/admin/stripe-sync/route.ts — admin API route pattern

### Established Patterns
- Route handlers use NextResponse.json() for responses
- Admin auth: getUser() → profiles.role check
- Service functions take supabase client as parameter
- Error responses use consistent { error: string } shape

### Integration Points
- All new routes under app/api/admin/flows/
- New services in lib/flows/ (flow-service.ts, step-service.ts, etc.)
- Condition evaluator in lib/flows/conditions.ts

</code_context>

<specifics>
## Specific Ideas

From user spec:
- Admin API routes for full CRUD on flows, steps, branches
- Cycle detection returns HTTP 422 when branch graph has cycles
- Kit.com wrapper: POST https://api.kit.com/v4/tags/{tag}/subscribers with graceful fallback
- Condition evaluator stub that will be fully implemented in Phase 4

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
