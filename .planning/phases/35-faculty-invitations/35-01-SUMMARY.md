---
phase: 35-faculty-invitations
plan: 01
subsystem: faculty-invitations
tags: [email, faculty, registration, oauth, resend]
dependency_graph:
  requires: [school_faculty table with invite_token column, lib/email/send.ts, lib/supabase/service.ts]
  provides: [faculty_invite email template, claim endpoint, invite-aware registration]
  affects: [app/register/page.tsx, app/auth/callback/route.ts, lib/email/defaults.ts, lib/email/variables.ts]
tech_stack:
  added: []
  patterns: [fire-and-forget email, Suspense boundary for useSearchParams, service-role invite claim]
key_files:
  created:
    - app/api/faculty-invite/claim/route.ts
  modified:
    - lib/email/defaults.ts
    - lib/email/variables.ts
    - app/schools/[slug]/onboarding/actions.ts
    - app/schools/[slug]/settings/actions.ts
    - app/register/page.tsx
    - app/auth/callback/route.ts
    - docs/teacher/school-settings.md
decisions:
  - Email sending is fire-and-forget: errors are caught and logged but do not block the success response
  - Register page wraps inner component in Suspense boundary (required for useSearchParams in Next.js App Router)
  - OAuth invite claim is handled server-side in auth/callback to avoid requiring a client-side fetch after redirect
  - invited_email cleared on claim for clean state (served its purpose as routing info)
metrics:
  duration: 6 minutes
  completed: 2026-03-31
  tasks_completed: 2
  files_changed: 7
---

# Phase 35 Plan 01: Faculty Invitations Summary

**One-liner:** Faculty invitation emails via Resend with invite-token URL, auto-link on email/password and OAuth registration using service role claim endpoint.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add faculty_invite email template and send email in inviteFacultyByEmail actions | 44aa183 | lib/email/defaults.ts, lib/email/variables.ts, onboarding/actions.ts, settings/actions.ts |
| 2 | Auto-link faculty on registration via claim endpoint | 677658a | app/api/faculty-invite/claim/route.ts, app/register/page.tsx, app/auth/callback/route.ts |

## What Was Built

### Task 1 — Email Template and Sending

Added `faculty_invite` to `lib/email/defaults.ts` with subject "You've been invited to join {{schoolName}} on GOYA" and HTML content including a CTA button linking to `{{registerUrl}}`. Registered the three template variables (`schoolName`, `position`, `registerUrl`) in `lib/email/variables.ts`.

Updated both `inviteFacultyByEmail` functions (onboarding and settings variants) to call `sendEmailFromTemplate` after the successful DB insert. The `registerUrl` is `${NEXT_PUBLIC_APP_URL}/register?school=${slug}&invite=${token}`. Email is fire-and-forget: errors are caught and logged but the action still returns `{ success: true }`.

### Task 2 — Claim Endpoint and Registration Integration

Created `app/api/faculty-invite/claim/route.ts` — a `POST` endpoint that:
1. Validates the authenticated user (401 if not logged in)
2. Looks up `school_faculty` by `invite_token` where `status='pending'` and `profile_id IS NULL`
3. Updates the row: sets `profile_id`, `status='active'`, clears `invited_email`
4. Appends `school_id` to `profiles.faculty_school_ids` (idempotent — checks before appending)

Updated `app/register/page.tsx`: refactored into `RegisterPageInner` (uses `useSearchParams`) wrapped by `RegisterPage` in a `<Suspense>` boundary (required by Next.js App Router). After successful `supabase.auth.signUp`, if `inviteToken` is present, calls `POST /api/faculty-invite/claim` (non-critical). OAuth redirect URL now passes `&invite=` and `&school=` params through.

Updated `app/auth/callback/route.ts`: reads the `invite` query param; if present, uses the service role client to look up and claim the invite server-side before redirecting — handles OAuth registrations where no client-side fetch is possible post-redirect.

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria

- FAC-01: Both `inviteFacultyByEmail` actions (onboarding + settings) send faculty_invite email via Resend with `sendEmailFromTemplate` — confirmed
- FAC-02: Email contains link to `/register?school=[slug]&invite=[token]` — confirmed
- FAC-03: Email/password registration with invite token calls `/api/faculty-invite/claim`; OAuth registration is claimed server-side in auth/callback — confirmed, `profiles.faculty_school_ids` updated in both paths

## Known Stubs

None.

## Self-Check: PASSED

- app/api/faculty-invite/claim/route.ts — FOUND
- lib/email/defaults.ts — FOUND
- .planning/phases/35-faculty-invitations/35-01-SUMMARY.md — FOUND
- Commit 44aa183 — FOUND
- Commit 677658a — FOUND
