# Phase 6: Analytics + User Management - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can measure flow performance and control any user's flow state without needing a developer. Per-flow analytics dashboard with event counts, completion rate, step drop-off chart, and time filters. Per-user flow management on admin user edit page with reset, force-assign, and mark-complete actions.

</domain>

<decisions>
## Implementation Decisions

### Analytics Dashboard
- Analytics as a tab in the flow editor — keeps context, avoids separate page
- Recharts for step drop-off chart (already installed, used for shop analytics)
- Date range picker with presets (Today/Yesterday/This Week/This Month/This Year/Custom)

### User Flow Management
- New section within existing admin user edit page (not a separate tab)
- Force-assign: dropdown to select flow + "Assign" button
- Reset: inline confirm dialog — "Reset will show this flow again on next login. Continue?"

### Claude's Discretion
- Exact chart colors and styling
- Analytics API response shape
- Completion rate calculation method (completed / shown or completed / started)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Recharts already installed (used in app/admin/shop/analytics/)
- Existing admin user edit page at app/admin/users/[id]/page.tsx
- flow_analytics table and flow_responses table for data
- /api/admin/flows/stats/route.ts (basic stats from Phase 3)

### Established Patterns
- Admin analytics page pattern from app/admin/shop/analytics/
- User edit page uses URL search params for tabs (?tab=connections)
- Service layer pattern in lib/api/services/

### Integration Points
- Flow editor: add "Analytics" tab alongside existing editor tabs
- User edit page: add "Flows" section
- New API routes for analytics data and user flow management

</code_context>

<specifics>
## Specific Ideas

From user spec:
- Metrics: total shown, started, completed, skipped, dismissed + completion rate %
- Step drop-off: bar chart showing how many users reached each step
- Time filter: Today | Yesterday | This Week | This Month | This Year | Custom range
- Per-user: list flows interacted with (status, started_at, completed_at)
- Actions: Reset (delete response → shows again), Force Assign (create in_progress response), Mark Complete (set completed without going through)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
