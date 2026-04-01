---
phase: 35-faculty-invitations
verified: 2026-03-31T00:00:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 35: Faculty Invitations Verification Report

**Phase Goal:** School owners can invite non-GOYA members to join as faculty, and new registrants with valid invite links are automatically linked to the school
**Verified:** 2026-03-31
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | When a school owner invites a non-member by email, an invitation email is sent via Resend | VERIFIED | Both `onboarding/actions.ts` (line 440) and `settings/actions.ts` (line 298) call `sendEmailFromTemplate` with `templateKey: 'faculty_invite'` after the DB insert, fire-and-forget with error catch |
| 2 | The invitation email contains a link to /register?school=[slug]&invite=[token] | VERIFIED | `registerUrl` is constructed as `` `${appUrl}/register?school=${schoolSlug}&invite=${inviteToken}` `` in both actions and passed as the `registerUrl` variable to the `faculty_invite` template, which renders it as the CTA href |
| 3 | A new member registering with a valid invite token is automatically linked as faculty to the school | VERIFIED | Email/password path: `register/page.tsx` calls `POST /api/faculty-invite/claim` after `signUp` succeeds (uses `createBrowserClient` which sets cookie synchronously, so session is present for the server route). OAuth path: `auth/callback/route.ts` reads `invite` param and claims server-side via service role. Both paths update `school_faculty.profile_id`, `status=active`, and `profiles.faculty_school_ids`. |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `lib/email/defaults.ts` | `faculty_invite` email template | VERIFIED | Template present at lines 111–120. Subject: "You've been invited to join {{schoolName}} on GOYA". CTA button links to `{{registerUrl}}`. Contains `schoolName`, `position`, `registerUrl` variables. |
| `lib/email/variables.ts` | `faculty_invite` template variable definitions | VERIFIED | Entry present at lines 58–62 with `schoolName`, `position`, `registerUrl` keys, labels, and examples. |
| `app/api/faculty-invite/claim/route.ts` | POST endpoint to claim invite token | VERIFIED | Exports `POST`. Validates auth (401), parses `invite_token`, looks up `school_faculty` by token where `status='pending'` and `profile_id IS NULL`, updates `profile_id`/`status`/`invited_email`, appends `school_id` to `profiles.faculty_school_ids`, returns `{ success: true, school_id }`. |
| `app/register/page.tsx` | Reads school+invite params, calls claim after signup | VERIFIED | Refactored into `RegisterPageInner` + `RegisterPage` (Suspense wrapper). Reads `inviteSchool` and `inviteToken` via `useSearchParams`. After successful `signUp`, conditionally calls `POST /api/faculty-invite/claim` (lines 385–395). OAuth redirect URL appended with `&invite=` and `&school=` params (line 98). |
| `app/schools/[slug]/onboarding/actions.ts` | `inviteFacultyByEmail` sends email | VERIFIED | Imports `sendEmailFromTemplate` (line 5). Calls it after insert (lines 437–451). Constructs `registerUrl` with slug and token. Fire-and-forget pattern with `console.error` on failure. |
| `app/schools/[slug]/settings/actions.ts` | `inviteFacultyByEmail` sends email | VERIFIED | Same pattern as onboarding variant. Import at line 4, call at lines 294–308. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `onboarding/actions.ts` | `lib/email/send.ts` | `sendEmailFromTemplate` with `faculty_invite` key | WIRED | Import confirmed line 5; call with `templateKey: 'faculty_invite'` confirmed lines 440–448 |
| `settings/actions.ts` | `lib/email/send.ts` | `sendEmailFromTemplate` with `faculty_invite` key | WIRED | Import confirmed line 4; call with `templateKey: 'faculty_invite'` confirmed lines 298–306 |
| `app/register/page.tsx` | `app/api/faculty-invite/claim/route.ts` | `fetch POST` after `supabase.auth.signUp` | WIRED | `fetch('/api/faculty-invite/claim', { method: 'POST', ... })` at lines 387–394, inside `if (inviteToken)` guard, after `signUp` succeeds |
| `app/api/faculty-invite/claim/route.ts` | `school_faculty` table | service role update: `profile_id`, `status=active` | WIRED | Lines 52–59: `.from('school_faculty').update({ profile_id: user.id, status: 'active', invited_email: null }).eq('id', faculty.id)` |
| `app/api/faculty-invite/claim/route.ts` | `profiles` table | service role append to `faculty_school_ids` | WIRED | Lines 68–85: fetch current array, idempotent append, `.from('profiles').update({ faculty_school_ids: [...currentIds, schoolId] })` |
| `app/auth/callback/route.ts` | `school_faculty` + `profiles` tables | service role claim on OAuth callback | WIRED | Lines 24–71: reads `invite` param, service role lookup, update `school_faculty`, update `profiles.faculty_school_ids` |

---

### Data-Flow Trace (Level 4)

Not applicable — no rendering artifacts in this phase. All artifacts are server actions, API routes, and a registration form. Data flows are traced via key links above.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable server to test API endpoints against. Key logic verified statically above.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| FAC-01 | 35-01-PLAN.md | Invitation email via Resend when owner adds non-member faculty by email | SATISFIED | `sendEmailFromTemplate` called in both `inviteFacultyByEmail` actions after DB insert; uses Resend via `lib/email/send.ts` |
| FAC-02 | 35-01-PLAN.md | Email links to /register?school=[slug]&invite=[token] | SATISFIED | `registerUrl` constructed as `${appUrl}/register?school=${schoolSlug}&invite=${inviteToken}` and passed as template variable; template renders it as CTA href |
| FAC-03 | 35-01-PLAN.md | Auto-link profile to school faculty on registration with valid invite token | SATISFIED | Email/password: claim fetch in `register/page.tsx`; OAuth: server-side claim in `auth/callback/route.ts`; both paths set `profile_id`, `status=active`, update `faculty_school_ids` |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/register/page.tsx` | 385–395 | No response status check on `/api/faculty-invite/claim` fetch | Info | Claim failure is silent — user proceeds to step 3 even if linking failed. Acceptable per plan's "non-critical" decision: owner can re-link manually. Not a blocker. |

No TODOs, placeholders, or empty implementations found in any phase artifact. The "NOTE: deferred to Phase 35" comments confirmed removed from both action files and replaced with live email-sending code.

---

### Human Verification Required

#### 1. End-to-end invite email delivery

**Test:** As a school owner, invite a non-member email address from the school's faculty settings. Check the inbox for the invitation email.
**Expected:** Email arrives from Resend with subject "You've been invited to join [School Name] on GOYA", body includes faculty position and a "Create Your Account" button linking to `/register?school=[slug]&invite=[token]`.
**Why human:** Email delivery and Resend integration can only be confirmed in a live environment with valid API keys.

#### 2. Invite claim on email/password registration

**Test:** Click the invite link from the email, complete registration with email/password. Check `school_faculty` and `profiles` tables in Supabase.
**Expected:** `school_faculty` row has `profile_id` set, `status='active'`, `invited_email=null`. Corresponding `profiles` row has `faculty_school_ids` array containing the school's UUID.
**Why human:** Requires a live Supabase instance and a valid invite token in the database.

#### 3. Invite claim on OAuth registration

**Test:** Click the invite link, choose Google/Apple OAuth on the register page. Complete OAuth. Verify DB state as above.
**Expected:** `auth/callback/route.ts` reads the `invite` param passed via OAuth redirect URL and claims the invite server-side. Same DB outcome as email/password path.
**Why human:** OAuth flow requires a live environment; server-side redirect handling cannot be exercised statically.

---

### Gaps Summary

No gaps. All three must-have truths are verified, all six artifacts are substantive and wired, all six key links are confirmed in the code. The only notable item is the silent failure on claim fetch (non-critical by design decision).

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
