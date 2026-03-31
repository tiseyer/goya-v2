# Roadmap: GOYA v2

## Milestones

- ✅ **v1.0 User Settings** - Phases 1-3 (shipped 2026-03-23)
- ✅ **v1.1 Connections & Inbox** - Phases 4-7 (shipped 2026-03-24)
- ✅ **v1.2 Stripe Admin & Shop** - Phases 8-13 (shipped 2026-03-24)
- ✅ **v1.3 Subscriptions & Teacher Upgrade** - Phases 14-15 (shipped 2026-03-26)
- ✅ **v1.6 Open Gates REST API** - Phases 1-8 (shipped 2026-03-27)
- ✅ **v1.7 API Settings Page** - Phases 9-11 (shipped 2026-03-27)
- ✅ **v1.8 AI Support System** - Phases 12-15 (shipped 2026-03-30)
- 🚧 **v1.9 Member Events** - Phases 16-21 (in progress)

## Phases

### 🚧 v1.9 Member Events (In Progress)

**Milestone Goal:** Enable teachers, wellness practitioners, and school owners to submit events for admin/moderator review before publication on the public calendar.

- [ ] **Phase 16: Database Foundation** - Event type, status workflow, audit log, and RLS policies
- [ ] **Phase 17: Admin Events List Updates** - Type badge/filter, submitter column, extended status filter, audit history
- [ ] **Phase 18: Admin Inbox Events Tab** - Pending review queue with approve/reject workflow
- [ ] **Phase 19: My Events Settings Page** - Member event CRUD with status-aware actions and submission flow
- [ ] **Phase 20: Public Calendar Type Filter** - All/GOYA/Member filter on public events page
- [ ] **Phase 21: Audit Log Complete Coverage** - Shared audit utility wired to all code paths

## Phase Details

### Phase 16: Database Foundation
**Goal**: The database supports member-submitted events with a full status workflow, audit logging, and role-scoped access control
**Depends on**: Nothing (first phase of milestone)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09
**Success Criteria** (what must be TRUE):
  1. Events have an event_type column ('goya' or 'member') and a created_by FK to profiles
  2. Events move through statuses: draft, pending_review, published, rejected, deleted — with rejection_reason text stored
  3. All event lifecycle actions (create, edit, submit, approve, reject, delete) write a row to event_audit_log with performer, role, and diff
  4. A teacher/WP/school owner can insert and read only their own non-deleted events; a moderator can read all non-deleted events and update status; an admin has full unrestricted access; public authenticated users see only published events
**Plans**: TBD

### Phase 17: Admin Events List Updates
**Goal**: Admins and moderators can see event type, submitter identity, and full status history in the admin events UI
**Depends on**: Phase 16
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):
  1. The admin events table shows a GOYA/Member type badge and a type filter dropdown that narrows the list
  2. Member events show the submitter's name resolved from the created_by join
  3. The status filter includes all five statuses: Published, Draft, Pending Review, Rejected, Deleted
  4. Deleted events are visible only when the viewer is an admin — moderators cannot see them
  5. The event detail/edit page shows a chronological audit history timeline visible to admins only
**Plans**: TBD
**UI hint**: yes

### Phase 18: Admin Inbox Events Tab
**Goal**: Admins and moderators can review, approve, and reject member-submitted events from a dedicated inbox tab
**Depends on**: Phase 16
**Requirements**: INBOX-01, INBOX-02, INBOX-03, INBOX-04, INBOX-05
**Success Criteria** (what must be TRUE):
  1. The admin inbox has an "Events" tab (Tab 6) listing all pending_review events with a badge showing the count
  2. Each row shows title, submitter name and email, category, event date, time since submission, and action buttons
  3. Approving an event sets its status to published, writes an audit log entry, and updates the tab badge count
  4. Rejecting an event requires a reason typed into a modal; the reason is saved to rejection_reason, status set to rejected, and an audit log entry written
**Plans**: TBD
**UI hint**: yes

### Phase 19: My Events Settings Page
**Goal**: Teachers, WPs, and school owners can create, manage, and submit their own events from their Settings area
**Depends on**: Phase 16
**Requirements**: MYEV-01, MYEV-02, MYEV-03, MYEV-04, MYEV-05, MYEV-06, MYEV-07, MYEV-08, MYEV-09, MYEV-10, MYEV-11
**Success Criteria** (what must be TRUE):
  1. A "My Events" settings page exists at the correct path and is accessible only to teacher/WP/school owner/admin roles
  2. An empty state with icon, description, and "+ Add New Event" is shown when the user has no events
  3. The events list shows each event's title, date, category, and a colour-coded status badge; rejected events show the rejection reason
  4. Status-aware action buttons appear per status: Draft gets Edit/Delete/Submit; Pending Review gets Delete only; Published gets View/Delete; Rejected gets Edit/Delete/Resubmit
  5. First-time click on "+ Add New Event" shows a dismissible info modal (localStorage flag); subsequent clicks skip it
  6. The creation form has all standard event fields with "Save as Draft" and "Submit for Review" buttons; the edit form is pre-filled and accessible only for draft/rejected events
**Plans**: TBD
**UI hint**: yes

### Phase 20: Public Calendar Type Filter
**Goal**: Visitors and members can filter the public events calendar to see GOYA events, member events, or all events
**Depends on**: Phase 16
**Requirements**: CAL-01, CAL-02, CAL-03
**Success Criteria** (what must be TRUE):
  1. The /events page shows a type filter with options: All Events, GOYA Events, Member Events
  2. The filter uses the existing UI pattern and works in both calendar and list views
  3. Regardless of which filter is selected, only published events are returned
**Plans**: TBD
**UI hint**: yes

### Phase 21: Audit Log Complete Coverage
**Goal**: Every code path that changes an event writes to the audit log through a single shared server utility
**Depends on**: Phase 17, Phase 18, Phase 19
**Requirements**: AUDIT-01, AUDIT-02
**Success Criteria** (what must be TRUE):
  1. A shared server utility at lib/events/audit.ts handles all writes to event_audit_log
  2. Every action — admin create/edit/status change/delete, user create/edit/submit/delete, approve, reject — writes an audit log entry without any code path being skipped
**Plans**: TBD

## Progress

**Execution Order:** 16 → 17 → 18 → 19 → 20 → 21

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 16. Database Foundation | 0/TBD | Not started | - |
| 17. Admin Events List Updates | 0/TBD | Not started | - |
| 18. Admin Inbox Events Tab | 0/TBD | Not started | - |
| 19. My Events Settings Page | 0/TBD | Not started | - |
| 20. Public Calendar Type Filter | 0/TBD | Not started | - |
| 21. Audit Log Complete Coverage | 0/TBD | Not started | - |
