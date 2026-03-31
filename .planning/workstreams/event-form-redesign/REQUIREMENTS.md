# Requirements — v1.11 Event Form Redesign

## Active Requirements

### UI — Form Visual Redesign
- [ ] **UI-01**: Event form uses card-based sections with subtle borders and generous padding
- [ ] **UI-02**: Form has clear visual hierarchy with section groupings (Basic Info, Schedule, Location, Registration, Organizers)
- [ ] **UI-03**: Conditional fields animate smoothly when appearing/disappearing
- [ ] **UI-04**: Submit/Cancel buttons have clear visual hierarchy (primary CTA prominent)
- [ ] **UI-05**: Form is fully responsive on mobile
- [ ] **UI-06**: All form elements use GOYA design system tokens (primary #345c83, CSS variables)

### SCHED — Multi-day Events
- [ ] **SCHED-01**: Database has `end_date` (date, nullable) and `all_day` (boolean, default false) columns on events table
- [ ] **SCHED-02**: User can set an optional End Date alongside the existing Start Date
- [ ] **SCHED-03**: User can toggle "All Day Event" which hides Start Time and End Time fields
- [ ] **SCHED-04**: Existing single-day events continue to work without end_date

### LOC — Format-Conditional Location
- [ ] **LOC-01**: Database has `location_lat`, `location_lng` (float, nullable), `online_platform_name`, `online_platform_url` (text, nullable) columns
- [ ] **LOC-02**: When format is "Online", Location field is hidden and Online Platform name + URL fields are shown
- [ ] **LOC-03**: When format is "In Person" or "Hybrid", Location field shows Google Places Autocomplete
- [ ] **LOC-04**: Google Places library is loaded dynamically only when the autocomplete field is rendered
- [ ] **LOC-05**: Selected place stores display name, lat, and lng in separate DB columns

### REG — Registration Control
- [ ] **REG-01**: Database has `registration_required` (boolean, default false) column
- [ ] **REG-02**: User can toggle "Registration Required" on/off
- [ ] **REG-03**: When off, Price, Total Spots, Spots Remaining fields are hidden
- [ ] **REG-04**: When Total Spots is 0 or empty, "Unlimited" is displayed as placeholder
- [ ] **REG-05**: Database has `website_url` (text, nullable) column for external event link

### ORG — Organizers
- [ ] **ORG-01**: Database has `organizer_ids` (uuid[], default '{}') column
- [ ] **ORG-02**: Current user is shown as default non-removable organizer chip
- [ ] **ORG-03**: User can search and add up to 4 additional organizers (5 total)
- [ ] **ORG-04**: Admin users can search all members; non-admin users search within connections/school
- [ ] **ORG-05**: Each organizer is shown as a removable avatar chip (except the creator)

### STATUS — Role-Aware Status
- [ ] **STATUS-01**: Admin/moderator sees Published, Draft, Cancelled status options
- [ ] **STATUS-02**: Member creating sees only Draft and Pending Review options
- [ ] **STATUS-03**: Member editing sees status options appropriate to current event state

## Future Requirements

None — this is a focused workstream.

## Out of Scope

- Recurring events (weekly/monthly repeat patterns)
- Event templates
- Ticket types / tiered pricing
- Waitlist management
- Calendar sync (iCal/Google Calendar export)

## Traceability

| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| (filled by roadmapper) | | | |
