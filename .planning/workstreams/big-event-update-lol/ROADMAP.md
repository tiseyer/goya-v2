# Roadmap: v1.20 Event Detail & Admin Form Overhaul

**Milestone:** v1.20
**Phases:** 9
**Requirements:** 30

## Phases

### Phase 1: Database Migrations
**Goal:** Add new columns to events table + create event_attendees and event_instructors join tables
**Requirements:** DB-01, DB-02, DB-03
**Success criteria:**
1. All new columns exist on events table
2. event_attendees table created with unique constraint
3. event_instructors table created with unique constraint
4. Supabase types regenerated

### Phase 2: Admin Event Form — Registration Box Rebuild
**Goal:** Replace registration checkbox with three independent collapsible sections
**Requirements:** REG-01, REG-02, REG-03, REG-04, REG-05
**Success criteria:**
1. External registration section toggles website input
2. Free/paid section toggles price input
3. Spot availability section toggles total spots input
4. Old registration checkbox removed
5. All sections save and load correctly on edit

### Phase 3: Admin Event Form — Layout & Box Reordering
**Goal:** Reorder form boxes, add short description, reposition View Event button, make history collapsible
**Requirements:** LAYOUT-01, LAYOUT-02, LAYOUT-03, LAYOUT-04
**Success criteria:**
1. Boxes in correct order top to bottom
2. Short description field saves to DB (max 160 chars)
3. View Event button at top and bottom, inside content wrapper
4. Event History collapsed by default with smooth animation
5. History entries formatted as readable sentences

### Phase 4: Admin Event Form — Instructors & Organizers
**Goal:** Instructors box with join table + Organizers box with min-1 enforcement
**Requirements:** PEOPLE-01, PEOPLE-02, PEOPLE-03
**Success criteria:**
1. Instructors search filters to teacher/WP/school-owner only
2. Max 5 instructors with avatar chips
3. Instructors saved via replace strategy to event_instructors
4. Organizers min 1 enforced with inline validation
5. Show toggles save to events table

### Phase 5: Admin Event Form — Attendees Box
**Goal:** New attendees management box with manual add/remove and spots calculation
**Requirements:** PEOPLE-04, PEOPLE-05, PEOPLE-06
**Success criteria:**
1. Attendees display with avatar chips, X to remove
2. Member search to add any member
3. 20+ attendees truncated with expand
4. "X / Y spots filled" shown when not unlimited
5. Green checkmark confirmation on add

### Phase 6: Frontend Event Detail Page — Layout Overhaul
**Goal:** Restructure detail page with sidebar widget, join/leave flow, and expandable location
**Requirements:** DETAIL-01, DETAIL-02, DETAIL-03, DETAIL-04, DETAIL-05
**Success criteria:**
1. Main content: featured image + description only
2. Sidebar: price pill (dark blue for free), date/time, location
3. Join for Free / Get Access / Register Externally based on state
4. Joined users see "You're going!" with leave option
5. Past events show "This event has passed"

### Phase 7: Add to Calendar
**Goal:** Functional calendar dropdown with Google, .ics, and Outlook Web options
**Requirements:** CAL-01, CAL-02, CAL-03, CAL-04
**Success criteria:**
1. Dropdown with three options appears on button click
2. Google Calendar opens correct URL in new tab
3. .ics file downloads with valid iCal format
4. Outlook Web opens correct URL in new tab

### Phase 8: Edit/Delete Permission on Event Detail
**Goal:** Show edit/delete only to organizers and admin/moderators
**Requirements:** PERM-01, PERM-02
**Success criteria:**
1. Organizers see Edit and Delete buttons
2. Admin/moderators see Edit and Delete buttons
3. Instructors-only users do not see buttons
4. Non-organizer/non-instructor users do not see buttons

### Phase 9: My Events in User Settings
**Goal:** Show all events where user is organizer, not just creator
**Requirements:** MYEV-01
**Success criteria:**
1. My Events query includes events where user is in organizer_ids
2. Existing add/edit functionality unchanged

---
*Roadmap created: 2026-04-03*
