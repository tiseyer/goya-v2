# Phase 11: Endpoints Documentation - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Build a read-only auto-generated API endpoint reference in the Endpoints tab. Scan all files under `/app/api/**` to discover routes, extract method/path/auth/description, group by domain category, and display with search and filter.

</domain>

<decisions>
## Implementation Decisions

### Data Source
- Scan `/app/api/` directory structure at build/render time (server component)
- Extract HTTP methods from exported function names (GET, POST, PUT, PATCH, DELETE)
- Infer path from file system structure (e.g., `app/api/v1/users/route.ts` → `/api/v1/users`)
- Infer auth type from code patterns (validateApiKey = API key, getSupabaseService = admin, etc.)
- Generate short descriptions from file name + code comments or handler logic

### Display Structure
- Group endpoints by domain category: Auth, Users, Events, Courses, Credits, Verifications, Analytics, Add-ons, Admin, Webhooks, Health
- Each endpoint row shows: Method (colored badge), Path, Auth Type, Description
- Method badges: GET=green, POST=blue, PUT/PATCH=amber, DELETE=red
- Category headers with endpoint count

### Interaction
- Search bar at top — filters by path or description
- Category filter dropdown or pills (matching secrets tab pattern)
- No editing — purely read-only reference
- Responsive table layout

### Data Generation Approach
- Generate endpoint data as a static array at build time or as a server-side scan
- Hardcode the endpoint registry as a typed array — more maintainable than dynamic file system scanning since route structure is stable
- Each entry: { method, path, auth, description, category }

### Claude's Discretion
- Whether to scan dynamically or hardcode the endpoint registry
- Exact table styling and layout
- Whether to show request params or just the basic info
- Loading state handling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/api-keys/page.tsx` — Tab shell (renders EndpointsPlaceholder)
- `app/admin/api-keys/EndpointsPlaceholder.tsx` — Replace with real endpoints UI
- `API_DOCS.md` — Comprehensive documentation of all 49 endpoints (can be used as source)
- Category filter pill pattern from SecretsTab.tsx

### Established Patterns
- Category filter pills already implemented in SecretsTab
- Search input pattern also in SecretsTab
- Server component data loading

### Integration Points
- `app/admin/api-keys/page.tsx` — swap EndpointsPlaceholder import
- `app/admin/api-keys/EndpointsTab.tsx` — new component

</code_context>

<specifics>
## Specific Ideas

- Use API_DOCS.md as the source of truth for endpoint descriptions
- ~49 endpoints across 10 resource categories
- Method badge colors consistent with REST conventions

</specifics>

<deferred>
## Deferred Ideas

- Interactive API playground (try endpoints from UI)
- Request/response schema display per endpoint

</deferred>
