# Requirements: GOYA v2

**Defined:** 2026-03-31
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.9 Requirements

Requirements for Member Events milestone. Each maps to roadmap phases.

### Database & Schema

- [ ] **DB-01**: Events table has `event_type` column distinguishing 'goya' vs 'member' events
- [ ] **DB-02**: Events table has `created_by` FK to profiles for member-submitted events
- [ ] **DB-03**: Events table has status workflow supporting draft, pending_review, published, rejected, deleted
- [ ] **DB-04**: Events table has `rejection_reason` text column for moderator feedback
- [ ] **DB-05**: `event_audit_log` table tracks all event lifecycle actions with performer, role, and changes diff
- [ ] **DB-06**: RLS: teachers/WPs/school owners can INSERT own events, SELECT own non-deleted, UPDATE own draft/pending/rejected
- [ ] **DB-07**: RLS: moderators can SELECT all non-deleted events, UPDATE status to published/rejected
- [ ] **DB-08**: RLS: admins have full access including deleted events
- [ ] **DB-09**: RLS: public authenticated users can SELECT only published events

### Admin Events

- [ ] **ADMIN-01**: Admin events table shows event_type badge (GOYA/Member) and type filter dropdown
- [ ] **ADMIN-02**: Admin events table shows submitter name for member events via created_by join
- [ ] **ADMIN-03**: Admin events status filter includes all statuses (Published, Draft, Pending Review, Rejected, Deleted)
- [ ] **ADMIN-04**: Deleted events visible to admins only, not moderators
- [ ] **ADMIN-05**: Event detail/edit page shows audit history timeline from event_audit_log (admin only)

### Admin Inbox

- [ ] **INBOX-01**: "Events" tab (Tab 6) in admin inbox shows all pending_review events
- [ ] **INBOX-02**: Events tab columns: title, submitted by (name+email), category, date, submitted time ago, actions
- [ ] **INBOX-03**: Approve action sets status to published, writes audit log, updates badge count
- [ ] **INBOX-04**: Reject action shows modal with required rejection reason, sets status to rejected, saves reason, writes audit log
- [ ] **INBOX-05**: Badge count on Events tab shows number of pending_review events

### My Events

- [ ] **MYEV-01**: Settings page "My Events" at correct path, gated to teacher/WP/school/admin roles
- [ ] **MYEV-02**: Empty state with icon, descriptive text, and "+ Add New Event" button
- [ ] **MYEV-03**: Events list with title, date, category, status badge, status-aware actions
- [ ] **MYEV-04**: Status badges: Draft (grey), Pending Review (amber), Published (green), Rejected (red with reason)
- [ ] **MYEV-05**: Draft actions: Edit, Delete, Submit for Review
- [ ] **MYEV-06**: Pending Review actions: Delete only
- [ ] **MYEV-07**: Published actions: View, Delete
- [ ] **MYEV-08**: Rejected actions: Edit, Delete, Resubmit (clears rejection_reason, resets to pending_review)
- [ ] **MYEV-09**: First-time info modal on first "+ Add New Event" click, dismissible via localStorage
- [ ] **MYEV-10**: Event creation form with all standard fields, "Save as Draft" and "Submit for Review" buttons
- [ ] **MYEV-11**: Edit form pre-filled, only accessible for draft/rejected events

### Public Calendar

- [ ] **CAL-01**: /events page has type filter: All Events, GOYA Events, Member Events
- [ ] **CAL-02**: Filter uses existing UI pattern and works with calendar/list views
- [ ] **CAL-03**: Only published events shown regardless of filter

### Audit Coverage

- [ ] **AUDIT-01**: Shared server utility (lib/events/audit.ts) for all audit log writes
- [ ] **AUDIT-02**: All code paths (admin create/edit/status/delete, user create/edit/submit/delete, approve, reject) write audit log

## Future Requirements

None currently deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email notifications on approval/rejection | Deferred — notification system not yet built |
| Member event analytics | Admin analytics dashboard covers overall events |
| Recurring event submissions | Complexity — single events only for v1.9 |
| Event co-hosting / multiple organizers | Single created_by sufficient for initial release |
| Student event submissions | Students are attendees, not organizers |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 16 | Pending |
| DB-02 | Phase 16 | Pending |
| DB-03 | Phase 16 | Pending |
| DB-04 | Phase 16 | Pending |
| DB-05 | Phase 16 | Pending |
| DB-06 | Phase 16 | Pending |
| DB-07 | Phase 16 | Pending |
| DB-08 | Phase 16 | Pending |
| DB-09 | Phase 16 | Pending |
| ADMIN-01 | Phase 17 | Pending |
| ADMIN-02 | Phase 17 | Pending |
| ADMIN-03 | Phase 17 | Pending |
| ADMIN-04 | Phase 17 | Pending |
| ADMIN-05 | Phase 17 | Pending |
| INBOX-01 | Phase 18 | Pending |
| INBOX-02 | Phase 18 | Pending |
| INBOX-03 | Phase 18 | Pending |
| INBOX-04 | Phase 18 | Pending |
| INBOX-05 | Phase 18 | Pending |
| MYEV-01 | Phase 19 | Pending |
| MYEV-02 | Phase 19 | Pending |
| MYEV-03 | Phase 19 | Pending |
| MYEV-04 | Phase 19 | Pending |
| MYEV-05 | Phase 19 | Pending |
| MYEV-06 | Phase 19 | Pending |
| MYEV-07 | Phase 19 | Pending |
| MYEV-08 | Phase 19 | Pending |
| MYEV-09 | Phase 19 | Pending |
| MYEV-10 | Phase 19 | Pending |
| MYEV-11 | Phase 19 | Pending |
| CAL-01 | Phase 20 | Pending |
| CAL-02 | Phase 20 | Pending |
| CAL-03 | Phase 20 | Pending |
| AUDIT-01 | Phase 21 | Pending |
| AUDIT-02 | Phase 21 | Pending |

**Coverage:**
- v1.9 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
