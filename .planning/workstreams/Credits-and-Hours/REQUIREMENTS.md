# Requirements: Credits & Hours Overhaul

**Defined:** 2026-03-27
**Core Value:** Members can submit, track, and manage their professional credits with clear status visibility and admin oversight.

## v1 Requirements

### Submission Form

- [ ] **FORM-01**: User sees card-based category selection (CE Credits, Karma Hours, Practice Hours, Teaching Hours) instead of radio buttons
- [ ] **FORM-02**: Teaching Hours category card only appears for users with Teacher role (server-side check)
- [ ] **FORM-03**: Each category card shows icon, bold title, and one-line description
- [ ] **FORM-04**: Selected card has GOYA primary blue border + subtle background tint
- [ ] **FORM-05**: Hours input is a centered large number field with increment/decrement buttons, minimum 0.5, steps of 0.5
- [ ] **FORM-06**: Activity date picker enforces within-last-2-years constraint with helper text
- [ ] **FORM-07**: Form split into 5 steps: Intro → Category → Hours → Date → Description
- [ ] **FORM-08**: Red warning banner replaced with neutral muted-blue info banner ("Submissions are reviewed within 5 business days")
- [ ] **FORM-09**: Confirmation step shows "Submitted for Review" with pending approval copy

### Status Logic

- [ ] **STAT-01**: New credit submissions have status "pending" by default (not "approved")
- [ ] **STAT-02**: Pending credits appear in user's Credit History with "Pending Review" badge (neutral/muted color)
- [ ] **STAT-03**: Existing approved credits remain unchanged and functional

### Admin Inbox

- [ ] **INBOX-01**: "Credits & Hours" tab added to /admin/inbox matching existing tab style
- [ ] **INBOX-02**: Tab shows pending count badge
- [ ] **INBOX-03**: Table displays: User (name+avatar), Credit Type, Hours, Activity Date, Submitted date, Status, Actions
- [ ] **INBOX-04**: Approve action sets status to approved (credits count toward totals)
- [ ] **INBOX-05**: Reject action opens inline text field for rejection reason, stores in DB
- [ ] **INBOX-06**: Status filter: All / Pending / Approved / Rejected
- [ ] **INBOX-07**: Pending submissions shown first by default

### Credits Page

- [ ] **CRED-01**: Credit type cards use status-driven colors: green (on track), yellow (expiring soon), red (below requirement), grey (no requirement)
- [ ] **CRED-02**: Green status shows "X / Y required — You're on track"
- [ ] **CRED-03**: Yellow status shows "X / Y required — Credits expiring soon" when credits expiring within 60 days would drop below requirement
- [ ] **CRED-04**: Red status shows "X / Y required — Action needed" when below requirement
- [ ] **CRED-05**: Grey status shows "X earned — No minimum required" when admin set requirement to 0
- [ ] **CRED-06**: Each card shows credit type name, icon, current total, requirement amount, status color, status message
- [ ] **CRED-07**: Overall status banner at top: green/yellow/red based on worst category status
- [ ] **CRED-08**: Requirements pulled from admin-configured credit_requirements table
- [ ] **CRED-09**: Only approved, non-expired credits count toward totals (activity_date + 365 days >= today)
- [ ] **CRED-10**: Teaching Hours card only shown to Teacher role users

### Admin Credits

- [ ] **ADMCR-01**: "Members Needing Attention" section on /admin/credits showing users in red/yellow status
- [ ] **ADMCR-02**: Table columns: User name, email, credit type badges (colored red/yellow), overall status
- [ ] **ADMCR-03**: Table is sortable and links to user detail page

### Admin Users Filter

- [ ] **ADMUF-01**: Credit Status filter dropdown on /admin/users: All, On Track, Expiring Soon, Needs Attention
- [ ] **ADMUF-02**: Filter queries based on same credit status logic as credits page

### Learn About Credits

- [ ] **LEARN-01**: Page at /credits/learn with header/footer, GOYA brand tokens
- [ ] **LEARN-02**: Hero section: "Welcome to the GOYA Credits Program" with intro paragraph
- [ ] **LEARN-03**: "How to Earn Credits" section with Automated and Manual sub-blocks
- [ ] **LEARN-04**: "Types of Credits" section with card per type (CE, Karma, Practice, Teaching, Community)
- [ ] **LEARN-05**: Community Engagement Credits card includes point values per action and conversion rule
- [ ] **LEARN-06**: "Credit Expiration" section with expiration explanation
- [ ] **LEARN-07**: CTA button "Submit Credits" linking to submission form
- [ ] **LEARN-08**: "Learn About Credits" button on /credits page updated to link to /credits/learn

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email notification on approve/reject | Deferred — requires email template setup |
| Bulk approve/reject in admin | Deferred — single-item workflow first |
| Credit type CRUD by admin | Categories are code-defined, not dynamic |
| Community Credits manual submission | Auto-awarded only per spec |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | Phase 1 | Pending |
| FORM-02 | Phase 1 | Pending |
| FORM-03 | Phase 1 | Pending |
| FORM-04 | Phase 1 | Pending |
| FORM-05 | Phase 1 | Pending |
| FORM-06 | Phase 1 | Pending |
| FORM-07 | Phase 1 | Pending |
| FORM-08 | Phase 1 | Pending |
| FORM-09 | Phase 1 | Pending |
| STAT-01 | Phase 2 | Pending |
| STAT-02 | Phase 2 | Pending |
| STAT-03 | Phase 2 | Pending |
| INBOX-01 | Phase 3 | Pending |
| INBOX-02 | Phase 3 | Pending |
| INBOX-03 | Phase 3 | Pending |
| INBOX-04 | Phase 3 | Pending |
| INBOX-05 | Phase 3 | Pending |
| INBOX-06 | Phase 3 | Pending |
| INBOX-07 | Phase 3 | Pending |
| CRED-01 | Phase 4 | Pending |
| CRED-02 | Phase 4 | Pending |
| CRED-03 | Phase 4 | Pending |
| CRED-04 | Phase 4 | Pending |
| CRED-05 | Phase 4 | Pending |
| CRED-06 | Phase 4 | Pending |
| CRED-07 | Phase 4 | Pending |
| CRED-08 | Phase 4 | Pending |
| CRED-09 | Phase 4 | Pending |
| CRED-10 | Phase 4 | Pending |
| ADMCR-01 | Phase 5 | Pending |
| ADMCR-02 | Phase 5 | Pending |
| ADMCR-03 | Phase 5 | Pending |
| ADMUF-01 | Phase 6 | Pending |
| ADMUF-02 | Phase 6 | Pending |
| LEARN-01 | Phase 7 | Pending |
| LEARN-02 | Phase 7 | Pending |
| LEARN-03 | Phase 7 | Pending |
| LEARN-04 | Phase 7 | Pending |
| LEARN-05 | Phase 7 | Pending |
| LEARN-06 | Phase 7 | Pending |
| LEARN-07 | Phase 7 | Pending |
| LEARN-08 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after initial definition*
