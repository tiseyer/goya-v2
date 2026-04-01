# Phase 7: Add-ons, Admin Settings & Webhooks - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure API phase — discuss skipped)

<domain>
## Phase Boundary

Callers can manage add-on products, assign them to users, read/update admin settings, and trigger internal actions via incoming webhooks. Three consolidated areas under `/api/v1/addons/`, `/api/v1/admin/settings/`, and `/api/v1/webhooks/`.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure API infrastructure phase. Follow established patterns from Phases 1-6. Admin settings endpoints require admin role check. Webhook endpoints should validate payloads.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Full API infrastructure from Phase 1
- CRUD service pattern from Phases 2-5
- Existing add-ons/products tables (products, user_designations)
- Existing admin settings (site_settings table)

### Integration Points
- products table (add-ons are products)
- user_designations table (user-addon assignments)
- site_settings table (admin settings)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure API phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
