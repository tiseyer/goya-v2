# Phase 3: Password Reset Flow - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Build a password reset interception flow for migrated users (requires_password_reset: true on profiles). Middleware redirects flagged users to /account/set-password. The set-password page matches auth page styling. After setting a new password, the flag is cleared and user is redirected to dashboard.

</domain>

<decisions>
## Implementation Decisions

### Middleware Interception
- Check requires_password_reset on the user's profile after auth
- Redirect to /account/set-password for any non-exempt route
- Exempt routes: /account/set-password, /auth/*, /api/*, static assets
- Must work with existing auth middleware/proxy (check proxy.ts or middleware.ts)

### Set-Password Page
- Route: /account/set-password
- Matches auth page style: centered card, GOYA logo, no header/footer
- "Welcome to GOYA v2 — Please set a new password to continue"
- New password + confirm password fields with validation
- Submit calls supabase.auth.updateUser({ password }) then updates profile requires_password_reset to false
- Redirects to / (dashboard) on success

### Server Action
- Use server action for the password update (not API route)
- Update auth password AND clear the profile flag in one operation
- Validate password strength (minimum length)

### Claude's Discretion
- Exact password validation rules (min length, complexity)
- Whether to use existing form components or build standalone
- Error handling UX (toast vs inline errors)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Auth pages at app/auth/ — reference for styling
- proxy.ts or middleware.ts — existing auth middleware to extend
- Supabase client utilities

### Integration Points
- proxy.ts / middleware.ts — add requires_password_reset check
- app/account/set-password/page.tsx — new page
- profiles table — requires_password_reset column (added in Phase 2)

</code_context>

<specifics>
## Specific Ideas

- Keep the page simple and branded — clean card layout
- Use GOYA logo from existing auth pages

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
