# Requirements: GOYA v2 — Event Detail & Admin Form Overhaul

**Defined:** 2026-04-03
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.20 Requirements

### Database

- [ ] **DB-01**: Events table has short_description, show_organizers, show_instructors, external_registration, event_website, unlimited_spots columns
- [ ] **DB-02**: event_attendees join table exists with event_id + profile_id unique constraint
- [ ] **DB-03**: event_instructors join table exists with event_id + profile_id unique constraint

### Admin Form — Registration

- [ ] **REG-01**: Registration box has three independent collapsible sections (External Registration, Price, Spot Availability)
- [ ] **REG-02**: External registration checkbox toggles event_website input field
- [ ] **REG-03**: "This event is free" checkbox toggles price input
- [ ] **REG-04**: "Unlimited spots" checkbox toggles total spots input
- [ ] **REG-05**: Old "Registration required" checkbox removed

### Admin Form — Layout

- [ ] **LAYOUT-01**: Form boxes ordered: Basic Info → Schedule → Location → Details → Registration → Instructors → Organizers → Attendees → Buttons
- [ ] **LAYOUT-02**: Short description field in Details box (max 160 chars)
- [ ] **LAYOUT-03**: View Event button inside content wrapper at top (header) and bottom (button row)
- [ ] **LAYOUT-04**: Event History section is collapsible, default collapsed, with formatted log entries

### Admin Form — People

- [ ] **PEOPLE-01**: Instructors box with member search (teacher/WP/school-owner only), max 5, avatar chips, show toggle
- [ ] **PEOPLE-02**: Instructors saved to event_instructors join table with replace strategy
- [ ] **PEOPLE-03**: Organizers box with role-filtered search, min 1 enforced, show toggle
- [ ] **PEOPLE-04**: Attendees box displays event_attendees with avatar chips, X to remove
- [ ] **PEOPLE-05**: Attendees box has member search to manually add any member
- [ ] **PEOPLE-06**: Auto-calculated "X / Y spots filled" display (when not unlimited)

### Frontend Detail Page

- [ ] **DETAIL-01**: Main content shows featured image + description only (date/time/location moved to sidebar)
- [ ] **DETAIL-02**: Sidebar card with price pill (dark blue for free), date/time, expandable location, action buttons
- [ ] **DETAIL-03**: Join/Leave flow: "Join for Free" / "Get Access" / "Register Externally" based on event state
- [ ] **DETAIL-04**: Joined state shows "You're going!" with leave option and notification text
- [ ] **DETAIL-05**: Past events show "This event has passed" with no join button

### Calendar Integration

- [ ] **CAL-01**: Add to Calendar dropdown with Google Calendar, Apple/Outlook (.ics), Outlook Web options
- [ ] **CAL-02**: Google Calendar opens pre-filled event in new tab
- [ ] **CAL-03**: .ics file downloads with correct iCal format
- [ ] **CAL-04**: Outlook Web opens pre-filled compose in new tab

### Permissions

- [ ] **PERM-01**: Edit/Delete buttons visible only to organizers + admin/moderator on event detail page
- [ ] **PERM-02**: Instructors-only users cannot see Edit/Delete

### My Events

- [ ] **MYEV-01**: My Events shows all events where user is organizer, not just events they created

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment processing for paid events | Deferred — "Payment coming soon" toast for now |
| Email notifications on join/leave | Not in this milestone |
| Recurring events | Separate feature |
| Waitlist when spots full | Future enhancement |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| REG-01 | Phase 2 | Pending |
| REG-02 | Phase 2 | Pending |
| REG-03 | Phase 2 | Pending |
| REG-04 | Phase 2 | Pending |
| REG-05 | Phase 2 | Pending |
| LAYOUT-01 | Phase 3 | Pending |
| LAYOUT-02 | Phase 3 | Pending |
| LAYOUT-03 | Phase 3 | Pending |
| LAYOUT-04 | Phase 3 | Pending |
| PEOPLE-01 | Phase 4 | Pending |
| PEOPLE-02 | Phase 4 | Pending |
| PEOPLE-03 | Phase 4 | Pending |
| PEOPLE-04 | Phase 5 | Pending |
| PEOPLE-05 | Phase 5 | Pending |
| PEOPLE-06 | Phase 5 | Pending |
| DETAIL-01 | Phase 6 | Pending |
| DETAIL-02 | Phase 6 | Pending |
| DETAIL-03 | Phase 6 | Pending |
| DETAIL-04 | Phase 6 | Pending |
| DETAIL-05 | Phase 6 | Pending |
| CAL-01 | Phase 7 | Pending |
| CAL-02 | Phase 7 | Pending |
| CAL-03 | Phase 7 | Pending |
| CAL-04 | Phase 7 | Pending |
| PERM-01 | Phase 8 | Pending |
| PERM-02 | Phase 8 | Pending |
| MYEV-01 | Phase 9 | Pending |

**Coverage:**
- v1.20 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after initial definition*
