# Phase 14: Fix Role Display Bug - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (bug fix phase — discuss skipped)

<domain>
## Phase Boundary

Fix the Subscriptions page so admin and moderator users never show "Guest". If user role is admin → show "Admin Member". If moderator → show "Moderator Member". This is a display + logic fix only, no Stripe changes needed.

</domain>

<decisions>
## Implementation Decisions

### Role Display Logic
- Admin role → always display "Admin Member" regardless of Stripe subscription status
- Moderator role → always display "Moderator Member" regardless of Stripe subscription status
- Never show "Guest" for admin or moderator roles
- Only check Stripe subscriptions for student/teacher/wellness_practitioner roles
- The fix is in the Subscriptions page component logic, not in Stripe data

### Claude's Discretion
All implementation choices at Claude's discretion — bug fix phase. Read the current Subscriptions page, identify where the "Guest" label is computed, and add role-based override.

</decisions>

<code_context>
## Existing Code Insights

### Integration Points
- app/settings/subscriptions/ — Subscriptions page
- Role system: student, teacher, wellness_practitioner, moderator, admin
- profiles.role or profiles.member_type determines role
- profiles.subscription_status: 'member' or 'guest'

</code_context>

<specifics>
## Specific Ideas

The bug is that admins/moderators who don't have a Stripe subscription show as "Guest" because the page checks subscription_status without considering the user's admin/moderator role.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
