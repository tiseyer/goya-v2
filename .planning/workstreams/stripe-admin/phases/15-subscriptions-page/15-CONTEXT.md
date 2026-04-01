# Phase 15: Subscriptions Page — Real Stripe Data - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the placeholder "contact support" Subscriptions page with live Stripe data. Show base membership, additional subscriptions, school membership, and designations — each in its own stacked content box. Integrate Stripe Customer Portal for subscription management. Implement soft-delete for designations.

</domain>

<decisions>
## Implementation Decisions

### Layout
- Stacked content boxes with "+" separator between each section
- BOX 1 — Base Membership (always shown): Query Stripe for active subscriptions linked to user. Identify membership type from product name containing "Membership". Display: "You're on a [Product Name]. [Price] / year." Button: "Verwalten" → Stripe Customer Portal (stripe.billingPortal.sessions.create). If no active membership and role is student/wp/teacher → show correct plan name from role. If truly no membership (guest) → show upgrade CTA placeholder (Phase 16 adds actual CTA).
- BOX 2 — Additional Teacher Pro Subscriptions (only if user has any): Show each additional recurring product beyond the base membership. Same "Verwalten" button per item.
- BOX 3 — School Membership (only if user owns a school): "You own a School. This is your school membership." "Verwalten" button.
- BOX 4 — Designations (only if user has any): "You own these Designations: [list]." "These cost you nothing to keep." Each designation has a Delete button.
- German "Verwalten" button label is intentional (user preference)

### Data Sources
- stripe_orders table for user's subscriptions (type='recurring', subscription_status='active')
- stripe_prices table for price info (unit_amount, interval)
- stripe_products table for product names
- user_designations table for one-time designation purchases (deleted_at IS NULL for active)
- schools table (owner_id = user.id) for school membership
- profiles table for user role

### Product Classification
- Products with name containing "Membership" AND recurring price → base membership
- Additional recurring products beyond base → additional subscriptions (Teacher Pro, School)
- Products with one-time price (stripe_prices.type = 'one_time') → designations
- Products with name containing "School" → school designations

### Stripe Customer Portal
- Server action using getStripe().billingPortal.sessions.create
- customer: stripe_customer_id from profiles table
- return_url: /settings/subscriptions
- Returns URL, client redirects via window.location

### Soft-Delete Designations
- DELETE button per designation in BOX 4
- Server action: UPDATE user_designations SET deleted_at = NOW() WHERE id = ? AND user_id = ?
- Does NOT cancel in Stripe or remove purchase record
- Preserves purchase_date and deleted_at for admin audit trail
- User no longer sees it after soft-delete
- No refund triggered

### Claude's Discretion
- Exact Tailwind styling within the stacked box pattern
- Loading states and error handling
- How to group/display multiple designations in the list

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/settings/subscriptions/page.tsx — current placeholder to replace
- lib/stripe/client.ts — getStripe() server-only singleton
- lib/supabase/service.ts — getSupabaseService() for server queries
- createSupabaseServerClient — for user-scoped queries

### Established Patterns
- Server component fetches data, client components for interactive elements
- 'use client' for buttons that need onClick handlers
- URL search param pattern for filters (not needed here)

### Integration Points
- Phase 14 already added admin/moderator role display fix
- Phase 16 will add upgrade CTA below BOX 1
- Phase 19 created user_designations table

### Stripe Product IDs (from live Stripe)
- Student Membership: prod_UCR1ypFlrHRfgs ($19/yr)
- Teacher Membership: prod_UCTigELsOhovuE ($39/yr)
- WP Membership: prod_UCUXhUds0BjXgJ ($39/yr)
- 12 teacher/WP designations ($10 one-time each)
- 8 school designations ($99 one-time + $40/yr)

</code_context>

<specifics>
## Specific Ideas

- "Verwalten" is the button label (German for "Manage") — not "Manage"
- The layout should feel like stacked cards, each with clear visual separation
- Each box is self-contained with its own heading

</specifics>

<deferred>
## Deferred Ideas

- Upgrade CTA (Phase 16)
- Pending upgrade state display (Phase 16)

</deferred>
