# Phase 4: Courses - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure API phase — discuss skipped)

<domain>
## Phase Boundary

Callers can manage courses and track learner enrollment progress through the API. Full CRUD for courses plus enrollment sub-resources, all under `/api/v1/courses/`.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure API infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions established in Phases 1-3 to guide decisions. Follow the same patterns: createApiHandler factory, service layer in lib/api/services/, middleware chain (validateApiKey + rateLimit + requirePermission), standard response format.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/api/handler.ts` — createApiHandler factory with ApiContext
- `lib/api/middleware.ts` — validateApiKey, rateLimit, requirePermission
- `lib/api/pagination.ts` — parsePaginationParams, buildPaginationMeta, paginationToRange
- `lib/api/response.ts` — successResponse, errorResponse, paginatedResponse
- `lib/api/types.ts` — ApiResponse, PaginationMeta, ApiKeyRow
- `lib/api/services/users.ts` — reference service implementation
- `lib/api/services/events.ts` — reference service with CRUD + sub-resources pattern

### Established Patterns
- Service layer functions return `{ data, count?, error }` from Supabase queries
- Route handlers use createApiHandler with method-keyed handler map
- UUID validation regex inline in route handlers
- `as any` cast on Supabase client for tables not in generated types
- Audit logging via `ctx.logAudit()` for all write operations
- Soft-delete pattern (deleted_at timestamp)
- Sub-resource endpoints (registrations pattern from events)

### Integration Points
- Courses/lessons tables in Supabase (existing — used by app/academy/ pages)
- Course enrollments (existing enrollment tracking)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure API phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
