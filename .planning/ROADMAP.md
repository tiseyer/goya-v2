# Roadmap: GOYA v2

## Milestones

- ✅ **v1.0 User Settings** - Phases 1-3 (shipped 2026-03-23)
- ✅ **v1.1 Connections & Inbox** - Phases 4-7 (shipped 2026-03-24)
- ✅ **v1.2 Stripe Admin & Shop** - Phases 8-13 (shipped 2026-03-24)
- ✅ **v1.3 Subscriptions & Teacher Upgrade** - Phases 14-15 (shipped 2026-03-26)
- ✅ **v1.6 Open Gates REST API** - Phases 1-8 (shipped 2026-03-27)
- ✅ **v1.7 API Settings Page** - Phases 9-11 (shipped 2026-03-27)
- ✅ **v1.8 AI Support System** - Phases 12-15 (shipped 2026-03-30)
- ✅ **v1.9 Member Events** - Phases 16-21 (shipped 2026-03-31)
- 🚧 **v1.10 Member Courses** - Phases 22-27 (in progress)

## Phases

### ✅ v1.9 Member Events (Shipped 2026-03-31)

- [x] **Phase 16: Database Foundation** - Event type, status workflow, audit log, and RLS policies
- [x] **Phase 17: Admin Events List Updates** - Type badge/filter, submitter column, extended status filter, audit history
- [x] **Phase 18: Admin Inbox Events Tab** - Pending review queue with approve/reject workflow
- [x] **Phase 19: My Events Settings Page** - Member event CRUD with status-aware actions and submission flow
- [x] **Phase 20: Public Calendar Type Filter** - All/GOYA/Member filter on public events page
- [x] **Phase 21: Audit Log Complete Coverage** - Shared audit utility wired to all code paths

### 🚧 v1.10 Member Courses (In Progress)

**Milestone Goal:** Enable teachers, wellness practitioners, and admins to submit courses for admin/moderator review before publication in the Academy.

- [ ] **Phase 22: Database Foundation** - Course type, status workflow, audit log, and RLS policies
- [ ] **Phase 23: Admin Courses List Updates** - Type badge/filter, submitter column, extended status filter, audit history
- [ ] **Phase 24: Admin Inbox Courses Tab** - Pending review queue with approve/reject workflow
- [ ] **Phase 25: My Courses Settings Page** - Member course CRUD with status-aware actions and submission flow
- [ ] **Phase 26: Public Academy Type Filter** - All/GOYA/Member filter on public academy page
- [ ] **Phase 27: Audit Log Complete Coverage** - Shared audit utility wired to all code paths

## Phase Details (v1.10)

### Phase 22: Database Foundation
**Goal**: The database supports member-submitted courses with a full status workflow, audit logging, and role-scoped access control
**Depends on**: Nothing (first phase of milestone)
**Requirements**: CDB-01, CDB-02, CDB-03, CDB-04, CDB-05, CDB-06, CDB-07, CDB-08, CDB-09
**Success Criteria** (what must be TRUE):
  1. Courses have a course_type column ('goya' or 'member') and a created_by FK to profiles
  2. Courses move through statuses: draft, pending_review, published, rejected, deleted — with rejection_reason text stored
  3. All course lifecycle actions write a row to course_audit_log with performer, role, and diff
  4. RLS enforces per-role access: member insert/read-own, moderator read-all/update-status, admin full, public published-only
**Plans**: TBD

### Phase 23: Admin Courses List Updates
**Goal**: Admins and moderators can see course type, submitter identity, and full status history in the admin courses UI
**Depends on**: Phase 22
**Requirements**: CADM-01, CADM-02, CADM-03, CADM-04, CADM-05
**Success Criteria** (what must be TRUE):
  1. The admin courses table shows a GOYA/Member type badge and a type filter dropdown
  2. Member courses show the submitter's name resolved from the created_by join
  3. The status filter includes all statuses: Published, Draft, Pending Review, Rejected, Deleted
  4. Deleted courses are visible only to admins — moderators cannot see them
  5. The course detail/edit page shows a chronological audit history timeline visible to admins only
**Plans**: TBD
**UI hint**: yes

### Phase 24: Admin Inbox Courses Tab
**Goal**: Admins and moderators can review, approve, and reject member-submitted courses from a dedicated inbox tab
**Depends on**: Phase 22
**Requirements**: CINB-01, CINB-02, CINB-03, CINB-04, CINB-05
**Success Criteria** (what must be TRUE):
  1. The admin inbox has a "Courses" tab listing all pending_review courses with a badge showing the count
  2. Each row shows title, submitter name and email, category, duration, time since submission, and action buttons
  3. Approving a course sets status to published, writes an audit log entry, and updates the tab badge count
  4. Rejecting a course requires a reason typed into a modal; reason saved to rejection_reason, status set to rejected, audit log entry written
**Plans**: TBD
**UI hint**: yes

### Phase 25: My Courses Settings Page
**Goal**: Teachers, WPs, and admins can create, manage, and submit their own courses from their Settings area
**Depends on**: Phase 22
**Requirements**: MYCR-01, MYCR-02, MYCR-03, MYCR-04, MYCR-05, MYCR-06, MYCR-07, MYCR-08, MYCR-09, MYCR-10, MYCR-11
**Success Criteria** (what must be TRUE):
  1. A "My Courses" settings page exists at the correct path and is accessible only to teacher/WP/admin roles
  2. An empty state with icon, description, and "+ Add New Course" is shown when user has no courses
  3. The courses list shows title, category, and colour-coded status badge; rejected courses show the rejection reason
  4. Status-aware action buttons: Draft gets Edit/Delete/Submit; Pending Review gets Delete only; Published gets View/Delete; Rejected gets Edit/Delete/Resubmit
  5. First-time click on "+ Add New Course" shows a dismissible info modal (localStorage flag)
  6. The creation form has all standard course fields with "Save as Draft" and "Submit for Review" buttons; edit form pre-filled for draft/rejected only
**Plans**: TBD
**UI hint**: yes

### Phase 26: Public Academy Type Filter
**Goal**: Visitors and members can filter the public academy to see GOYA courses, member courses, or all courses
**Depends on**: Phase 22
**Requirements**: ACAD-01, ACAD-02, ACAD-03
**Success Criteria** (what must be TRUE):
  1. The /academy page shows a type filter with options: All Courses, GOYA Courses, Member Courses
  2. The filter uses the existing UI pattern and works with existing category/progress filters
  3. Regardless of which filter is selected, only published courses are returned
**Plans**: TBD
**UI hint**: yes

### Phase 27: Audit Log Complete Coverage
**Goal**: Every code path that changes a course writes to the audit log through a single shared server utility
**Depends on**: Phase 23, Phase 24, Phase 25
**Requirements**: CAUD-01, CAUD-02
**Success Criteria** (what must be TRUE):
  1. A shared server utility at lib/courses/audit.ts handles all writes to course_audit_log
  2. Every action — admin create/edit/status change/delete, user create/edit/submit/delete, approve, reject — writes an audit log entry
**Plans**: TBD

## Progress

**Execution Order:** 22 → 23 → 24 → 25 → 26 → 27

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 22. Database Foundation | 0/TBD | Not started | - |
| 23. Admin Courses List Updates | 0/TBD | Not started | - |
| 24. Admin Inbox Courses Tab | 0/TBD | Not started | - |
| 25. My Courses Settings Page | 0/TBD | Not started | - |
| 26. Public Academy Type Filter | 0/TBD | Not started | - |
| 27. Audit Log Complete Coverage | 0/TBD | Not started | - |
