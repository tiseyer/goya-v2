# Phase 1: Foundation - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Build the entire API infrastructure layer: `api_keys` table + migration, API key validation middleware, rate limiting (100 req/min per key), consistent `{ success, data, error, meta }` response format, `/api/v1/health` endpoint, shared route handler factory, `/lib/api/` service layer pattern, pagination helpers, and audit logging integration. Every subsequent phase builds on these primitives.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key codebase patterns to follow:
- `getSupabaseService()` in `lib/supabase/service.ts` — singleton, bypasses RLS — use for all API operations
- `logAudit()` in `lib/audit.ts` — already implemented, use for write operation logging
- Middleware at `/middleware.ts` already excludes `api/` from auth — API key auth will be separate
- Existing response pattern is `NextResponse.json({ ok: true, ... })` — standardize to `{ success, data, error, meta }`
- Full DB types in `types/supabase.ts` — use `Database` generic with Supabase client

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase/service.ts` → `getSupabaseService()` — service role Supabase client (bypasses RLS)
- `lib/audit.ts` → `logAudit(entry)` — unified audit trail, silent error handling
- `types/supabase.ts` → `Database` type — generated Supabase types for all tables
- `lib/types.ts` → `UserRole`, `SubscriptionStatus`, `MemberType`, etc.
- `middleware.ts` → already excludes `api/` from auth matcher

### Established Patterns
- Route handlers use `NextResponse.json()` for all responses
- Error format: `{ error: string }` with status codes
- Cron routes check `Authorization: Bearer ${CRON_SECRET}` header
- Stripe webhook uses signature verification
- Service role client is lazy-initialized singleton

### Integration Points
- New `api_keys` table needs Supabase migration in `supabase/migrations/`
- API middleware needs to intercept `/api/v1/` routes (separate from existing middleware.ts)
- Audit log already has the `audit_log` table — just call `logAudit()`

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
