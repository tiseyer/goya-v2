# Phase 35: Faculty Invitations - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode — infrastructure/backend phase)

<domain>
## Phase Boundary

When a school owner adds a non-member faculty by email: send invitation email via Resend, email links to /register?school=[slug]&invite=[token], on registration with valid invite token auto-link profile to school faculty.

</domain>

<decisions>
## Implementation Decisions

### Email Sending (FAC-01)
- When inviteFacultyByEmail is called (already exists from Phase 31/32)
- If the email is NOT an existing GOYA member: send invitation email via Resend
- Email template: "You've been added as faculty at [School Name] on GOYA. Create your account to join."
- Email contains link to /register?school=[slug]&invite=[token]
- Token is the invite_token from school_faculty table (already has invite_token column)

### Invite Link (FAC-02)
- URL format: /register?school=[slug]&invite=[token]
- Token is a unique UUID stored in school_faculty.invite_token
- Token should be generated when creating the faculty record with invited_email

### Auto-Link on Registration (FAC-03)
- On registration (/register or sign-up flow), check for school and invite query params
- If valid: after creating the user profile, update school_faculty record:
  - Set profile_id to the new user's ID
  - Clear invited_email (or keep for audit)
  - Set joined_at to now()
- Update the new user's faculty_school_ids array on profiles

### Claude's Discretion
- Where to hook into the registration flow (middleware, callback, server action)
- Email template styling (follow existing Resend patterns)
- Token validation approach

</decisions>

<code_context>
## Existing Code Insights

### Faculty Invite Actions
- Phase 31: app/schools/[slug]/onboarding/actions.ts has inviteFacultyByEmail
- Phase 32: app/schools/[slug]/settings/actions.ts may have similar
- school_faculty table has invite_token column (uuid)

### Email Infrastructure
- lib/email/ — Resend email sending
- Existing email templates in lib/email/defaults.ts

### Registration Flow
- Check app/register/ or app/auth/ for registration page
- Supabase auth for sign-up
- Post-registration hook or callback to process invite tokens

</code_context>

<specifics>
## Specific Ideas

- Simple, backend-focused phase
- Invitation email + registration auto-link

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
