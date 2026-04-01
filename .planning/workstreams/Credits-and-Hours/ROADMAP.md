# Roadmap: Credits & Hours Overhaul (v2.0)

**Created:** 2026-03-27
**Phases:** 7
**Requirements:** 37

## Phase 1: Submission Form Redesign

**Goal:** Redesign the credit submission form from 3-step radio-button flow to 5-step card-based flow with role-gated Teaching Hours.

**Requirements:** FORM-01, FORM-02, FORM-03, FORM-04, FORM-05, FORM-06, FORM-07, FORM-08, FORM-09

**Success criteria:**
1. Category selection shows full-width selectable cards with icon, title, description
2. Teaching Hours card only appears for users with `member_type === 'teacher'` (server-side prop)
3. Selected card has primary blue border and subtle tint
4. Hours input centered with +/- buttons, 0.5 step increments
5. Form flows through 5 distinct steps: Intro → Category → Hours → Date → Description
6. Red warning banner replaced with muted-blue info banner
7. Confirmation shows "Submitted for Review" copy

**Key files:**
- `app/credits/components/CreditSubmissionForm.tsx` (rewrite)
- `app/credits/page.tsx` (pass isTeacher prop)
- `app/teaching-hours/page.tsx` (pass teachingOnly + isTeacher)

---

## Phase 2: Pending Status Logic

**Goal:** Change credit submissions from auto-approved to pending, with visual feedback in credit history.

**Requirements:** STAT-01, STAT-02, STAT-03

**Success criteria:**
1. `submitCreditEntry()` action inserts with `status: 'pending'` instead of `'approved'`
2. CreditHistory shows "Pending Review" badge (neutral/muted color) for pending entries
3. Existing approved credits remain unchanged — no migration alters existing rows

**Key files:**
- `app/credits/actions.ts` (change status from 'approved' to 'pending')
- `app/credits/components/CreditHistory.tsx` (add pending badge styling)

---

## Phase 3: Admin Inbox Credits Tab

**Goal:** Add "Credits & Hours" tab to admin inbox with approve/reject workflow.

**Requirements:** INBOX-01, INBOX-02, INBOX-03, INBOX-04, INBOX-05, INBOX-06, INBOX-07

**Success criteria:**
1. Third tab "Credits & Hours" on /admin/inbox matching existing tab style
2. Pending count badge on tab
3. Table with User, Credit Type, Hours, Activity Date, Submitted, Status, Actions columns
4. Approve sets status to approved; Reject opens inline rejection reason field
5. Status filter dropdown: All / Pending / Approved / Rejected
6. Default sort: pending first, then by submitted date descending

**Key files:**
- `app/admin/inbox/page.tsx` (add tab + data fetch)
- `app/admin/inbox/CreditsTab.tsx` (new component)
- `app/admin/inbox/actions.ts` (add approve/reject credit actions)

---

## Phase 4: Credits Page Status-Driven Redesign

**Goal:** Replace static credit cards with status-driven color system using requirements + expiry awareness.

**Requirements:** CRED-01, CRED-02, CRED-03, CRED-04, CRED-05, CRED-06, CRED-07, CRED-08, CRED-09, CRED-10

**Success criteria:**
1. Each credit type card shows green/yellow/red/grey based on requirement status
2. Green: meets requirement, Yellow: meets but expiring within 60 days, Red: below requirement, Grey: no requirement
3. Cards show type name, icon, current total, requirement, status message
4. Overall banner at top reflects worst-category status
5. Only approved + non-expired credits count in totals
6. Teaching Hours card only for teachers
7. Requirements pulled from credit_requirements table

**Key files:**
- `app/credits/page.tsx` (redesign cards section)
- `lib/credits.ts` (add expiry-aware status calculation functions)
- `app/credits/components/CreditStatusCard.tsx` (new component)

---

## Phase 5: Admin Members Needing Attention

**Goal:** Add "Members Needing Attention" table to /admin/credits showing users in red/yellow credit status.

**Requirements:** ADMCR-01, ADMCR-02, ADMCR-03

**Success criteria:**
1. New section on /admin/credits below existing sections
2. Table: User name, email, credit type badges (red/yellow colored), overall status
3. Sortable columns, rows link to user detail page
4. Only shows users who are red or yellow status

**Key files:**
- `app/admin/credits/page.tsx` (add section)
- `app/admin/credits/MembersNeedingAttention.tsx` (new component)
- `lib/credits.ts` (add batch user status calculation)

---

## Phase 6: Admin Users Credit Status Filter

**Goal:** Add credit status filter to /admin/users page.

**Requirements:** ADMUF-01, ADMUF-02

**Success criteria:**
1. Dropdown filter: All / On Track / Expiring Soon / Needs Attention
2. Filtering queries same credit logic from Phase 4
3. Integrates with existing filter UI on admin users page

**Key files:**
- `app/admin/users/page.tsx` (add filter)
- `lib/credits.ts` (reuse status functions)

---

## Phase 7: Learn About Credits Page

**Goal:** Create the editorial "Learn About Credits" page and fix the broken link.

**Requirements:** LEARN-01, LEARN-02, LEARN-03, LEARN-04, LEARN-05, LEARN-06, LEARN-07, LEARN-08

**Success criteria:**
1. Page at /credits/learn with header/footer, GOYA brand tokens
2. Hero section with program intro
3. "How to Earn Credits" with Automated/Manual sub-blocks
4. "Types of Credits" with card per type including Community engagement details
5. "Credit Expiration" explanation section
6. CTA button linking to submission form
7. /credits page "Learn About Credits" button links to /credits/learn

**Key files:**
- `app/credits/learn/page.tsx` (new page)
- `app/credits/page.tsx` (update link href)

---

## Dependency Graph

```
Phase 1 (Form) ──┐
                  ├── Phase 4 (Credits Page) ── Phase 5 (Admin Attention) ── Phase 6 (Users Filter)
Phase 2 (Status) ─┤
                  └── Phase 3 (Admin Inbox)
Phase 7 (Learn Page) — independent
```

Phases 1, 2, 7 can start in parallel.
Phase 3 depends on Phase 2 (pending status).
Phase 4 depends on Phase 2 (status-driven logic).
Phase 5 depends on Phase 4 (status calculation functions).
Phase 6 depends on Phase 5 (batch status logic).

---
*Roadmap created: 2026-03-27*
