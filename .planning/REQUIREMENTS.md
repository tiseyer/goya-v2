# Requirements: GOYA v2

**Defined:** 2026-03-31
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.10 Requirements

Requirements for Member Courses milestone. Each maps to roadmap phases.

### Database & Schema

- [ ] **CDB-01**: Courses table has `course_type` column distinguishing 'goya' vs 'member' courses
- [ ] **CDB-02**: Courses table has `created_by` FK to profiles for member-submitted courses
- [ ] **CDB-03**: Courses table has status workflow supporting draft, pending_review, published, rejected, deleted
- [ ] **CDB-04**: Courses table has `rejection_reason` text column for moderator feedback
- [ ] **CDB-05**: `course_audit_log` table tracks all course lifecycle actions with performer, role, and changes diff
- [ ] **CDB-06**: RLS: teachers/WPs/admins can INSERT own courses, SELECT own non-deleted, UPDATE own draft/pending/rejected
- [ ] **CDB-07**: RLS: moderators can SELECT all non-deleted courses, UPDATE status to published/rejected
- [ ] **CDB-08**: RLS: admins have full access including deleted courses
- [ ] **CDB-09**: RLS: public authenticated users can SELECT only published courses

### Admin Courses

- [ ] **CADM-01**: Admin courses table shows course_type badge (GOYA/Member) and type filter dropdown
- [ ] **CADM-02**: Admin courses table shows submitter name for member courses via created_by join
- [ ] **CADM-03**: Admin courses status filter includes all statuses (Published, Draft, Pending Review, Rejected, Deleted)
- [ ] **CADM-04**: Deleted courses visible to admins only, not moderators
- [ ] **CADM-05**: Course detail/edit page shows audit history timeline from course_audit_log (admin only)

### Admin Inbox

- [ ] **CINB-01**: Courses tab in admin inbox shows all pending_review courses
- [ ] **CINB-02**: Courses tab columns: title, submitted by (name+email), category, duration, submitted time ago, actions
- [ ] **CINB-03**: Approve action sets status to published, writes audit log, updates badge count
- [ ] **CINB-04**: Reject action shows modal with required rejection reason, sets status to rejected, saves reason, writes audit log
- [ ] **CINB-05**: Badge count on Courses tab shows number of pending_review courses

### My Courses

- [ ] **MYCR-01**: Settings page "My Courses" at correct path, gated to teacher/WP/admin roles
- [ ] **MYCR-02**: Empty state with icon, descriptive text, and "+ Add New Course" button
- [ ] **MYCR-03**: Courses list with title, category, status badge, status-aware actions
- [ ] **MYCR-04**: Status badges: Draft (grey), Pending Review (amber), Published (green), Rejected (red with reason)
- [ ] **MYCR-05**: Draft actions: Edit, Delete, Submit for Review
- [ ] **MYCR-06**: Pending Review actions: Delete only
- [ ] **MYCR-07**: Published actions: View, Delete
- [ ] **MYCR-08**: Rejected actions: Edit, Delete, Resubmit (clears rejection_reason, resets to pending_review)
- [ ] **MYCR-09**: First-time info modal on first "+ Add New Course" click, dismissible via localStorage
- [ ] **MYCR-10**: Course creation form with all standard fields, "Save as Draft" and "Submit for Review" buttons
- [ ] **MYCR-11**: Edit form pre-filled, only accessible for draft/rejected courses

### Public Academy

- [ ] **ACAD-01**: /academy page has type filter: All Courses, GOYA Courses, Member Courses
- [ ] **ACAD-02**: Filter uses existing UI pattern and works with existing category/progress filters
- [ ] **ACAD-03**: Only published courses shown regardless of filter

### Audit Coverage

- [ ] **CAUD-01**: Shared server utility (lib/courses/audit.ts) for all audit log writes
- [ ] **CAUD-02**: All code paths (admin create/edit/status/delete, user create/edit/submit/delete, approve, reject) write audit log

## Future Requirements

None currently deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email notifications on approval/rejection | Notification system not yet built |
| Course analytics for member submissions | Admin analytics dashboard covers overall |
| Course co-authoring / multiple instructors | Single created_by sufficient for initial release |
| Student course submissions | Students are learners, not instructors |
| Lesson/module management for member courses | Members submit course metadata only, admin manages content |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CDB-01 | Phase 22 | Pending |
| CDB-02 | Phase 22 | Pending |
| CDB-03 | Phase 22 | Pending |
| CDB-04 | Phase 22 | Pending |
| CDB-05 | Phase 22 | Pending |
| CDB-06 | Phase 22 | Pending |
| CDB-07 | Phase 22 | Pending |
| CDB-08 | Phase 22 | Pending |
| CDB-09 | Phase 22 | Pending |
| CADM-01 | Phase 23 | Pending |
| CADM-02 | Phase 23 | Pending |
| CADM-03 | Phase 23 | Pending |
| CADM-04 | Phase 23 | Pending |
| CADM-05 | Phase 23 | Pending |
| CINB-01 | Phase 24 | Pending |
| CINB-02 | Phase 24 | Pending |
| CINB-03 | Phase 24 | Pending |
| CINB-04 | Phase 24 | Pending |
| CINB-05 | Phase 24 | Pending |
| MYCR-01 | Phase 25 | Pending |
| MYCR-02 | Phase 25 | Pending |
| MYCR-03 | Phase 25 | Pending |
| MYCR-04 | Phase 25 | Pending |
| MYCR-05 | Phase 25 | Pending |
| MYCR-06 | Phase 25 | Pending |
| MYCR-07 | Phase 25 | Pending |
| MYCR-08 | Phase 25 | Pending |
| MYCR-09 | Phase 25 | Pending |
| MYCR-10 | Phase 25 | Pending |
| MYCR-11 | Phase 25 | Pending |
| ACAD-01 | Phase 26 | Pending |
| ACAD-02 | Phase 26 | Pending |
| ACAD-03 | Phase 26 | Pending |
| CAUD-01 | Phase 27 | Pending |
| CAUD-02 | Phase 27 | Pending |

**Coverage:**
- v1.10 requirements: 31 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
