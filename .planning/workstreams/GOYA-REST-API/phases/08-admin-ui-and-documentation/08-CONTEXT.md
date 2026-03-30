# Phase 8: Admin UI & Documentation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped)

<domain>
## Phase Boundary

Admins can manage API keys through the admin panel and every API endpoint is documented. Two deliverables: an admin page for API key CRUD and a comprehensive API_DOCS.md reference.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Admin UI page: Follow existing AdminShell patterns in app/admin/. Match existing admin page styling (tables, forms, modals).
- API key management: Create, list, revoke keys. Show key value only once on creation. Display last_used and request_count.
- API_DOCS.md: Document every endpoint built in Phases 1-7 with method, path, auth, params, body, and example responses.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- AdminShell layout (app/admin/layout.tsx or similar)
- Existing admin page patterns (e.g., app/admin/shop/products/ for table + CRUD)
- api_keys table (created in Phase 1 migration)
- lib/api/middleware.ts (has key hashing logic for reference)

### Established Patterns
- Admin pages use server components with client interactive islands
- Tables follow the pattern from shop admin pages
- Forms use existing UI components from app/components/ui/

### Integration Points
- AdminShell sidebar navigation (needs new "API Keys" entry)
- api_keys table via getSupabaseService()

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow existing admin patterns.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
