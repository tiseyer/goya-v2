# Roadmap — v1.11 Event Form Redesign

## Phases

- [ ] **Phase 1: Database Migrations** - Add all new columns to the events table
- [ ] **Phase 2: Form UI Redesign + Status** - Modern card-based layout with role-aware status field
- [ ] **Phase 3: Multi-day Events + Registration Toggle** - End date, all-day toggle, registration control
- [ ] **Phase 4: Google Places Integration** - Format-conditional location with autocomplete
- [ ] **Phase 5: Organizers System** - Multi-organizer chips with member search

## Phase Details

### Phase 1: Database Migrations
**Goal**: All new columns exist on the events table so subsequent phases can write data without schema errors
**Depends on**: Nothing (first phase)
**Requirements**: SCHED-01, LOC-01, REG-01, REG-05, ORG-01
**Success Criteria** (what must be TRUE):
  1. Events table has `end_date` (date, nullable) and `all_day` (boolean, default false) columns
  2. Events table has `location_lat`, `location_lng`, `online_platform_name`, `online_platform_url` columns
  3. Events table has `registration_required` (boolean, default false) and `website_url` (text, nullable) columns
  4. Events table has `organizer_ids` (uuid[], default '{}') column
**Plans**: TBD

### Phase 2: Form UI Redesign + Status
**Goal**: The event form presents as a modern, card-based SaaS form with section groupings and role-aware status options
**Depends on**: Phase 1
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, STATUS-01, STATUS-02, STATUS-03
**Success Criteria** (what must be TRUE):
  1. Form renders with distinct card sections (Basic Info, Schedule, Location, Registration, Organizers) with visible borders and padding
  2. Conditional fields (added in later phases) animate in/out rather than snapping — transition infrastructure is in place
  3. Admin/moderator sees Published, Draft, Cancelled in the status dropdown; member sees only Draft and Pending Review
  4. Form layout is usable on a 375px mobile screen with no horizontal overflow
**Plans**: TBD
**UI hint**: yes

### Phase 3: Multi-day Events + Registration Toggle
**Goal**: Users can create multi-day and all-day events, and control whether registration is required with conditional field display
**Depends on**: Phase 2
**Requirements**: SCHED-02, SCHED-03, SCHED-04, REG-02, REG-03, REG-04
**Success Criteria** (what must be TRUE):
  1. User can enter an End Date alongside the Start Date; existing single-day events load and save without errors
  2. Toggling "All Day Event" hides the Start Time and End Time fields; toggling back reveals them
  3. Toggling "Registration Required" off hides Price, Total Spots, and Spots Remaining fields
  4. When Total Spots is left blank or set to 0, the field shows "Unlimited" as placeholder text
**Plans**: TBD
**UI hint**: yes

### Phase 4: Google Places Integration
**Goal**: Location input is conditional on event format — online events show platform fields, in-person/hybrid events show Google Places autocomplete
**Depends on**: Phase 3
**Requirements**: LOC-02, LOC-03, LOC-04, LOC-05
**Success Criteria** (what must be TRUE):
  1. Switching format to "Online" hides the location field and reveals Online Platform name + URL inputs
  2. Switching format to "In Person" or "Hybrid" shows a Google Places Autocomplete input in the location field
  3. The Google Maps JS library is not loaded on page load — it loads only when the autocomplete field becomes visible
  4. Selecting a place from autocomplete populates the display name and persists lat/lng to the database on save
**Plans**: TBD
**UI hint**: yes

### Phase 5: Organizers System
**Goal**: Event creators can designate up to 5 organizers from the member base, shown as removable avatar chips
**Depends on**: Phase 4
**Requirements**: ORG-02, ORG-03, ORG-04, ORG-05
**Success Criteria** (what must be TRUE):
  1. The current user appears as a non-removable organizer chip when the form opens (create or edit)
  2. Searching for a member adds them as an avatar chip; up to 4 additional organizers can be added (5 total)
  3. Admin users see all members in organizer search; non-admin users see only connections/school members
  4. Each added organizer chip shows a remove button; the creator chip has no remove button
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Migrations | 0/0 | Not started | - |
| 2. Form UI Redesign + Status | 0/0 | Not started | - |
| 3. Multi-day Events + Registration Toggle | 0/0 | Not started | - |
| 4. Google Places Integration | 0/0 | Not started | - |
| 5. Organizers System | 0/0 | Not started | - |

## Coverage

| REQ-ID | Phase |
|--------|-------|
| SCHED-01 | Phase 1 |
| LOC-01 | Phase 1 |
| REG-01 | Phase 1 |
| REG-05 | Phase 1 |
| ORG-01 | Phase 1 |
| UI-01 | Phase 2 |
| UI-02 | Phase 2 |
| UI-03 | Phase 2 |
| UI-04 | Phase 2 |
| UI-05 | Phase 2 |
| UI-06 | Phase 2 |
| STATUS-01 | Phase 2 |
| STATUS-02 | Phase 2 |
| STATUS-03 | Phase 2 |
| SCHED-02 | Phase 3 |
| SCHED-03 | Phase 3 |
| SCHED-04 | Phase 3 |
| REG-02 | Phase 3 |
| REG-03 | Phase 3 |
| REG-04 | Phase 3 |
| LOC-02 | Phase 4 |
| LOC-03 | Phase 4 |
| LOC-04 | Phase 4 |
| LOC-05 | Phase 4 |
| ORG-02 | Phase 5 |
| ORG-03 | Phase 5 |
| ORG-04 | Phase 5 |
| ORG-05 | Phase 5 |

Total: 28/28 requirements mapped
