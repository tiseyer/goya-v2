# Phase 16: Upgrade CTA - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Show upgrade prompts for students and wellness practitioners to become certified teachers. Three locations: Subscriptions page (below current plan), Shop/Add-ons (Teacher Membership product visibility), and pending state display.

</domain>

<decisions>
## Implementation Decisions

### Subscriptions Page CTA
- Show below BOX 1 (base membership) if user role is student or wellness_practitioner
- Card with headline: "Ready to become a GOYA Certified Teacher?"
- Button: "Upgrade to Teacher Membership" (primary style, upward arrow icon)
- Links to /upgrade (new page built in Phase 17)

### Shop / Add-ons CTA
- Teacher Membership product visible ONLY for students and wellness practitioners
- Button label: "Upgrade" instead of "Buy"
- Links to same /upgrade page

### Pending State
- Query upgrade_requests table for user's pending request
- If pending request exists: hide upgrade CTA everywhere
- On Subscriptions page: replace CTA with info card: "Your upgrade request is pending verification. You'll be notified within 48 hours."
- In Shop: Teacher Membership product hidden (same as if they already have it)
- Teacher Membership product ID: prod_UCTigELsOhovuE

### Claude's Discretion
- Exact card styling (follow existing settings page design tokens)
- Arrow icon implementation (inline SVG or Heroicon)
- How to conditionally hide/show in Shop page

</decisions>

<code_context>
## Existing Code Insights

### Integration Points
- app/settings/subscriptions/page.tsx — add CTA below BOX 1 (after Phase 15 changes)
- app/settings/subscriptions/queries.ts — fetchSubscriptionsData already returns profile.role
- upgrade_requests table — query for pending status
- Shop pages — need to find where products are listed for non-admin users

</code_context>

<specifics>
## Specific Ideas

- Teacher Membership Stripe product ID: prod_UCTigELsOhovuE
- The CTA should feel like a natural extension of the subscriptions page, not a popup or modal

</specifics>

<deferred>
## Deferred Ideas

- The actual /upgrade page (Phase 17)
- Admin approve/reject flow (Phase 18)

</deferred>
