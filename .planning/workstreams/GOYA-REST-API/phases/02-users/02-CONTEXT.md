# Phase 2: Users - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (API endpoint phase — discuss skipped)

<domain>
## Phase Boundary

Build the Users API endpoints: list with filters (role, membership, date range, search), get by ID, update (role/status/membership), and sub-resource endpoints for credits, certifications, and verifications. All endpoints use the handler factory, middleware, pagination, and audit logging from Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — endpoint phase with clear spec from ROADMAP. Use Phase 1 infrastructure (createApiHandler, validateApiKey, rateLimit, parsePagination, logAudit) and existing DB schema.

Key tables:
- `profiles` — main user table with role, subscription_status, member_type, verification_status, all profile fields
- `credit_entries` — credit/teaching hours with credit_type, amount, status, activity_date, expires_at
- `products` + `user_designations` — certifications (designations purchased by user)
- Verification data is on profiles table itself (verification_status, certificate_url, certificate_is_official)

Service layer pattern: create `/lib/api/services/users.ts` with business logic functions called by route handlers.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/api/handler.ts` → `createApiHandler` — wraps handlers with API key auth, error handling, ApiContext
- `lib/api/middleware.ts` → `validateApiKey`, `rateLimit`, `requirePermission`
- `lib/api/pagination.ts` → `parsePagination`, `buildPaginationMeta`
- `lib/api/response.ts` → `successResponse`, `errorResponse`, `paginatedResponse`
- `lib/api/types.ts` → ApiResponse, PaginationMeta, ApiKeyRow
- `lib/supabase/service.ts` → `getSupabaseService()` — service role client
- `lib/audit.ts` → `logAudit(entry)` — audit trail
- `lib/types.ts` → UserRole, SubscriptionStatus, MemberType types

### Established Patterns
- Route handlers at `app/api/v1/{entity}/route.ts` for collection endpoints
- Dynamic routes at `app/api/v1/{entity}/[id]/route.ts` for individual resources
- Sub-resources at `app/api/v1/{entity}/[id]/{sub}/route.ts`
- All list endpoints support page, limit, sort, order params
- Write operations call ctx.logAudit()

### Integration Points
- Routes under `app/api/v1/users/`
- Service functions in `lib/api/services/users.ts`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — clear API spec in ROADMAP. Refer to success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
