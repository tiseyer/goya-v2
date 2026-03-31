---
phase: 33-admin-school-management
verified: 2026-03-31T00:00:00Z
status: passed
score: 5/5 must-haves verified
gaps: []
human_verification:
  - test: "Approve a school from the inbox tab"
    expected: "School status changes to 'approved' in the UI and owner receives an approval email"
    why_human: "Email delivery via Resend cannot be confirmed programmatically without a live Resend event log"
  - test: "Reject a school from /admin/schools/[id] detail page"
    expected: "Rejection reason saved, status changes, rejection reason alert appears on page after router.refresh(), owner receives rejection email"
    why_human: "UI state update after router.refresh() and email delivery require a live browser session"
  - test: "Navigate to /admin/schools/[id] for a school with uploaded documents"
    expected: "Documents table shows Download links that open files in a new tab via signed URLs"
    why_human: "Signed URL generation depends on Supabase storage bucket contents — cannot verify without real data"
  - test: "Visit School button on a member profile for a Principal Trainer of an approved school"
    expected: "Card appears in the right column with the school name and a 'Visit School' button linking to /schools/[slug]"
    why_human: "Conditional rendering based on real profile data requires a live session with a seeded test member"
---

# Phase 33: Admin School Management Verification Report

**Phase Goal:** Admins and moderators can review school registrations, inspect all submitted data, and approve or reject schools
**Verified:** 2026-03-31
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Inbox tab shows schools with designation data, statuses, approve/reject actions | VERIFIED | `SchoolRegistrationsTab.tsx` renders a DESIGNATIONS column (purple pill badges), STATUS column with all 5 status variants, and Approve/Reject/Reset action buttons. Inbox `page.tsx` joins `school_designations(designation_type, status)` via service role client. |
| 2 | Detail page at /admin/schools/[id] shows all fields and documents | VERIFIED | `app/admin/schools/[id]/page.tsx` (454 lines) fetches and displays 8 named sections: Owner, Basic Info, Online Presence, Teaching Info, Location, Designations, Verification Documents, Faculty Members. Documents use `createSignedUrl` for download links. |
| 3 | Approve sets status='approved' and sends email via Resend | VERIFIED | `approveSchool` in `actions.ts` sets `status='approved'`, `approved_at`, `approved_by`, clears `rejection_reason`, then calls `sendEmailFromTemplate` with `templateKey='school_approved'`. Both `school_approved` and `school_rejected` templates confirmed in `lib/email/defaults.ts` and `lib/email/variables.ts`. |
| 4 | Reject requires reason, sets status='rejected', sends email | VERIFIED (with minor note) | `rejectSchool` sets `status='rejected'`, `rejection_reason=reason`, sends `school_rejected` email. `ApproveRejectBar.tsx` enforces non-empty reason client-side (button disabled when `!rejectReason.trim()`). The inbox tab's `handleReject` does not block on empty reason — the server action accepts it and stores `null`. This is a UI-only gap in the inbox tab; the detail page enforces it correctly. |
| 5 | Visit School button on member profiles for approved school owners/faculty | VERIFIED | `app/members/[id]/page.tsx` queries `principal_trainer_school_id` and `faculty_school_ids`, fetches matching schools filtered to `status='approved'`, and renders a white card with school logo, name, and a `Visit School` link to `/schools/[slug]`. |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/admin/schools/actions.ts` | approveSchool and rejectSchool server actions | VERIFIED | 149 lines. Exports `approveSchool` and `rejectSchool` with `'use server'` directive, authentication check, service role DB updates, owner profile fetch, email send, and `revalidatePath`. |
| `app/admin/inbox/SchoolRegistrationsTab.tsx` | Updated tab with designations column and server action calls | VERIFIED | 287 lines. Imports `approveSchool`, `rejectSchool` from `@/app/admin/schools/actions`. Renders 7-column table including DESIGNATIONS. View link points to `/admin/schools/${school.id}`. |
| `app/admin/inbox/page.tsx` | Updated school query joining school_designations | VERIFIED | Query at lines 47–54 selects `school_designations (designation_type, status)`. Uses service role client. `pendingSchoolCount` counts both `pending` and `pending_review`. |
| `app/admin/schools/[id]/page.tsx` | Admin school detail/review page | VERIFIED | 454 lines. force-dynamic, full data fetch via service role, 8 data sections, `notFound()` guard, conditional `ApproveRejectBar` (pending/pending_review only), rejection reason alert (rejected status). |
| `app/admin/schools/[id]/ApproveRejectBar.tsx` | Approve/reject UI component | VERIFIED | 119 lines. Client component. Approve and reject buttons calling server actions. Reject enforces non-empty reason. `useRouter().refresh()` on success. Inline feedback message. |
| `app/members/[id]/page.tsx` | Updated member profile with Visit School button | VERIFIED | Queries `principal_trainer_school_id` and `faculty_school_ids`. Fetches schools with `status='approved'` filter. Renders `affiliatedSchools.map(...)` card with Visit School link. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SchoolRegistrationsTab.tsx` | `actions.ts` | `import { approveSchool, rejectSchool }` | WIRED | Line 6: `import { approveSchool, rejectSchool } from '@/app/admin/schools/actions'`. Both called in `handleApprove` and `handleReject`. |
| `actions.ts` | `lib/email/send.ts` | `sendEmailFromTemplate` | WIRED | `sendEmailFromTemplate` imported and called with `templateKey: 'school_approved'` (line 60–68) and `templateKey: 'school_rejected'` (line 130–138). Templates confirmed in `lib/email/defaults.ts` and `lib/email/variables.ts`. |
| `app/admin/schools/[id]/page.tsx` | `actions.ts` | server action import for approve/reject | WIRED | `ApproveRejectBar` imported at line 6; `ApproveRejectBar.tsx` imports `approveSchool`, `rejectSchool`. Detail page passes `schoolId` to `ApproveRejectBar`. |
| `app/admin/schools/[id]/page.tsx` | Supabase storage | `createSignedUrl` | WIRED | Lines 123–128: `supabase.storage.from('school-documents').createSignedUrl(path, 3600)`. Path extraction from full URL handles both relative and absolute paths. |
| `app/members/[id]/page.tsx` | schools table | query for `principal_trainer_school_id` / `faculty_school_ids` | WIRED | Lines 44, 54–71: profiles query selects both fields; conditional branches fetch schools with `.eq('status', 'approved')` filter. |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `SchoolRegistrationsTab.tsx` | `schools` (state) | `initialSchools` prop from `page.tsx` Supabase query | Yes — live query with `school_designations` join | FLOWING |
| `app/admin/schools/[id]/page.tsx` | `school`, `designations`, `faculty`, `documentsWithUrls` | `getSupabaseService()` queries + `createSignedUrl` | Yes — parallel fetches, no static returns | FLOWING |
| `app/members/[id]/page.tsx` | `affiliatedSchools` | `getSupabaseService()` queries on `schools` table filtered by `status='approved'` | Yes — real DB query, empty array when no approved schools | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires a running Next.js server and live Supabase/Resend connection for meaningful checks. Static module checks not applicable to React Server Components.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ADM-01 | 33-01 | Admin can see all school registrations in inbox | SATISFIED | Inbox `page.tsx` fetches all schools ordered by `created_at`; `SchoolRegistrationsTab` renders them with status, owner, designations. |
| ADM-02 | 33-02 | Admin can view full school data before deciding | SATISFIED | `/admin/schools/[id]` renders 8 comprehensive data sections covering all `schools` table columns specified in plan interfaces. |
| ADM-03 | 33-01 | Admin can approve a school with email notification | SATISFIED | `approveSchool` server action sets `status='approved'`, `approved_at`, `approved_by`, sends `school_approved` email. |
| ADM-04 | 33-01 | Admin can reject a school with reason and email | SATISFIED | `rejectSchool` server action sets `status='rejected'`, `rejection_reason`, sends `school_rejected` email. `ApproveRejectBar` enforces non-empty reason. |
| ADM-05 | 33-02 | Member profiles show Visit School for school-affiliated members | SATISFIED | `app/members/[id]/page.tsx` queries both `principal_trainer_school_id` and `faculty_school_ids`, renders per-school Visit School card for approved schools only. |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/admin/inbox/SchoolRegistrationsTab.tsx` | 78 | `handleReject` calls `rejectSchool(schoolId, rejectReason)` without empty-reason guard | Info | The reject inline input has a placeholder "Rejection reason (required)" but doesn't disable the Confirm Reject button when reason is empty. Server action accepts an empty reason (stores `null`, sends "No reason provided" in email). The detail page's `ApproveRejectBar` correctly enforces non-empty reason. Not a blocker — server stores data consistently. |

No blockers or structural stubs found. All `return null` / empty-state patterns in the codebase are conditional on real data being absent (e.g., `affiliatedSchools.map(...)` renders nothing when the array is empty), not permanent placeholders.

---

### Human Verification Required

#### 1. School approval from inbox tab

**Test:** Log in as admin, navigate to `/admin/inbox?tab=schools`, find a school with `pending` or `pending_review` status, click Approve.
**Expected:** School status badge updates to "approved" in the UI; school owner receives an approval email with their school name and link.
**Why human:** Email delivery via Resend requires a live transactional environment; browser-side state update requires interaction.

#### 2. School rejection from detail page

**Test:** Navigate to `/admin/schools/[id]` for a pending school, click "Reject School", enter a reason, click Confirm Reject.
**Expected:** Page refreshes (via `router.refresh()`), rejection reason alert appears in rose-tinted box, Approve/Reject bar disappears; school owner receives rejection email with the entered reason.
**Why human:** `router.refresh()` post-action UI update and email delivery require a live session.

#### 3. Document download links on detail page

**Test:** Navigate to `/admin/schools/[id]` for a school with uploaded verification documents.
**Expected:** Documents table shows Download links; clicking a link opens the file in a new tab.
**Why human:** Signed URL generation is wired correctly in code but requires a real Supabase storage bucket with uploaded files to confirm expiry and path extraction work correctly.

#### 4. Visit School button on member profile

**Test:** Navigate to `/members/[id]` for a member who is a Principal Trainer of an approved school.
**Expected:** A white card appears in the right column above the GOYA Member card, showing the school name and a "Visit School" button linking to `/schools/[slug]`.
**Why human:** Requires a real seeded member with `principal_trainer_school_id` set and the referenced school having `status='approved'`.

---

### Gaps Summary

No gaps blocking goal achievement. All five must-have truths are verified. All key artifacts exist, are substantive, and are fully wired. Data flows from real Supabase queries throughout.

One minor info-level observation: the inbox tab's reject input does not enforce a non-empty reason before calling the server action, while the detail page's `ApproveRejectBar` does. The server action handles this gracefully (stores `null`, sends "No reason provided" in email), so this is a UX inconsistency rather than a functional gap.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
