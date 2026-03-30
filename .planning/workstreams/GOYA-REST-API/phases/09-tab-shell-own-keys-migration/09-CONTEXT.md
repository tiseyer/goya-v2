# Phase 9: Tab Shell & Own Keys Migration - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Convert the flat `/admin/api-keys` page into a three-tab interface (Own Keys, Third Party Keys, Endpoints). Move existing API key management into the Own Keys tab. Third Party Keys and Endpoints tabs render placeholder content for now (implemented in Phases 10 and 11).

</domain>

<decisions>
## Implementation Decisions

### Tab Pattern
- Use URL-based tab switching via `searchParams` — matches existing pattern in `/admin/inbox/page.tsx`
- Tab values: `keys` (default), `secrets`, `endpoints`
- Default tab is Own Keys (no query param = keys tab)

### Tab UI
- Build inline tab bar matching admin design tokens from globals.css
- Follow the same visual style as the inbox tabs pattern
- Use existing design tokens (colors, spacing, radii) from the project

### Own Keys Migration
- Extract current `ApiKeysTable` + create button into an `OwnKeysTab` wrapper component
- Keep all existing server actions, data fetching, and state management intact
- No refactoring beyond wrapping in the tab shell

### Claude's Discretion
- Exact tab styling details (hover states, active indicator, transition)
- Whether to create a reusable Tabs component or inline the tab bar
- Component file organization within the api-keys directory

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/api-keys/page.tsx` — current flat page with ApiKeysTable
- `app/admin/inbox/page.tsx` — URL-based tab pattern reference
- `app/admin/components/AdminShell.tsx` — sidebar layout wrapper
- `app/components/ui/` — Badge, Button, Card components

### Established Patterns
- Admin pages use server components with `searchParams` for tab state
- Tab switching via URL params (`?tab=value`)
- Admin layout wraps all pages via `app/admin/layout.tsx`

### Integration Points
- `app/admin/api-keys/page.tsx` is the entry point to modify
- Tab content components will be imported by the page

</code_context>

<specifics>
## Specific Ideas

- Tab labels: "Own Keys", "Third Party Keys", "Endpoints"
- Placeholder content for Phases 10/11 tabs should be clean "Coming soon" or empty state

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
