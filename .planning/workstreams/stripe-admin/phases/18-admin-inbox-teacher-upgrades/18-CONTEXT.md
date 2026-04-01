# Phase 18: Admin Inbox — Teacher Upgrades - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Add "Teacher Upgrades" tab to /admin/inbox with approve/reject workflow. Approve captures Stripe payment, creates subscription, changes user role. Reject cancels payment intent. Same design pattern as existing School Registrations tab.

</domain>

<decisions>
## Implementation Decisions

### Tab Design
- New "Teacher Upgrades" tab in /admin/inbox (same pattern as "School Registrations" tab)
- Sub-tabs within: Pending | Approved | Rejected
- Match existing admin inbox styling

### Request Card Content
- User name, email, current role, member since
- Submitted certificate files (downloadable/viewable links from Supabase Storage)
- Stripe Payment Intent ID + authorized amount ($39.00)
- Submission date

### Approve Action
- Capture Stripe Payment Intent: stripe.paymentIntents.capture(paymentIntentId)
- Create Teacher Membership subscription: stripe.subscriptions.create with customer + price_1TE4kfDLfij4i9P9sUpSD2Si
- Update user role in profiles: student/wp → teacher
- Update upgrade_request: status='approved', reviewed_at=now(), reviewed_by=admin.id, stripe_subscription_id
- If user had WP or Student designations: keep them (they're one-time purchases, no migration needed)
- Send notification to user (existing notifications table)
- Card moves to Approved sub-tab

### Reject Action
- Cancel Stripe Payment Intent: stripe.paymentIntents.cancel(paymentIntentId)
- Update upgrade_request: status='rejected', rejection_reason=text, reviewed_at=now(), reviewed_by=admin.id
- Send notification to user with rejection reason
- User's role stays unchanged
- Upgrade CTA reappears for them (pending state cleared since status != 'pending')
- Card moves to Rejected sub-tab
- Rejection reason captured via text input modal

### Claude's Discretion
- Exact modal styling for rejection reason input
- How to display certificate file previews/links
- Tab routing pattern (URL params vs client state)
- Card layout details within the existing admin inbox pattern

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/admin/inbox/ — existing inbox with School Registrations tab (COPY THIS PATTERN)
- lib/stripe/client.ts — getStripe() for payment intent capture/cancel
- lib/supabase/service.ts — getSupabaseService() for admin queries
- upgrade_requests table (Phase 19)
- notifications table — for user notifications

### Integration Points
- Phase 17 creates upgrade_request records with status 'pending'
- Phase 16 checks hasPendingUpgrade — status changes here affect CTA visibility
- Stripe payment intent IDs stored in upgrade_requests.stripe_payment_intent_id

</code_context>

<specifics>
## Specific Ideas

- Teacher Membership price ID: price_1TE4kfDLfij4i9P9sUpSD2Si
- Teacher Membership product ID: prod_UCTigELsOhovuE
- Follow the School Registrations tab pattern exactly for consistency

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase of v1.3.

</deferred>
