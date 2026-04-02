# Requirements: GOYA v2

**Defined:** 2026-04-02
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.17 Requirements

Requirements for Dashboard Redesign milestone. Each maps to roadmap phases.

### Infrastructure

- [ ] **INFRA-01**: Dashboard page.tsx is an async server component with parallel data fetching via Promise.all
- [ ] **INFRA-02**: Role branching renders Student, Teacher, School, or Wellness Practitioner layout based on profile role + school ownership
- [ ] **INFRA-03**: Teacher with principal_trainer_school_id can switch to "View as School" dashboard mode
- [ ] **INFRA-04**: HorizontalCarousel component with snap-x scrolling, swipeable on mobile, hidden scrollbar on desktop
- [ ] **INFRA-05**: Old dashboard feed UI (FeedView, PostComposer, etc.) safely deleted after import audit

### Shared Components

- [ ] **COMP-01**: DashboardGreeting shows time-of-day greeting, user name, and role badge
- [ ] **COMP-02**: ProfileCompletionCard with checklist, progress bar, and deep links to settings (shown when < 100%)
- [ ] **COMP-03**: StatHero displays a single large metric with placeholder "—" when no data
- [ ] **COMP-04**: PrimaryActionCard with value line and CTA button (Hormozi principle)
- [ ] **COMP-05**: TeacherCard for recommended teachers carousel
- [ ] **COMP-06**: CourseCard for courses carousel
- [ ] **COMP-07**: EventCard for upcoming events carousel
- [ ] **COMP-08**: ConnectionCard for recent connections list
- [ ] **COMP-09**: FacultyCard for school faculty list

### Student Dashboard

- [ ] **STU-01**: Greeting + "Ready to practice today?"
- [ ] **STU-02**: Recommended teachers carousel with style-tag matching + "Show all teachers →"
- [ ] **STU-03**: Courses carousel with interest matching + "Show all courses →"
- [ ] **STU-04**: Upcoming events carousel + "Show all events →"

### Teacher Dashboard

- [ ] **TCH-01**: Greeting + teacher role badge
- [ ] **TCH-02**: Profile completion card (when < 100%) with 6 weighted fields
- [ ] **TCH-03**: Stat hero showing weekly profile views (placeholder)
- [ ] **TCH-04**: Primary CTAs: "Share your next event" + "Add a course link"
- [ ] **TCH-05**: Recent connections list (max 3) + "View all connections →"

### School Dashboard

- [ ] **SCH-01**: Greeting with school name + "School" badge
- [ ] **SCH-02**: Profile completion card for school fields
- [ ] **SCH-03**: Stat hero showing weekly school discovery (placeholder)
- [ ] **SCH-04**: Primary CTAs: "Add workshops & courses" + "Manage designations"
- [ ] **SCH-05**: Faculty list (max 5) + "Manage faculty →"
- [ ] **SCH-06**: Enrolled students list (max 5) + "View all →"

### Wellness Practitioner Dashboard

- [ ] **WP-01**: Greeting + WP role badge
- [ ] **WP-02**: Profile completion card with WP-specific fields
- [ ] **WP-03**: Stat hero (placeholder)
- [ ] **WP-04**: Primary CTAs: "Share your next event" + "Add a course"
- [ ] **WP-05**: Suggested connections (teachers/schools nearby) + "Explore directory →"
- [ ] **WP-06**: Upcoming events carousel

### Design

- [ ] **DES-01**: Apple/Netflix aesthetic — large white space, bold headers, minimal color, no clutter
- [ ] **DES-02**: Mobile-first responsive layout — stacked on mobile, side-by-side CTAs on desktop
- [ ] **DES-03**: Each carousel has "Show all →" link at top right leading to relevant directory page

## Future Requirements

### Dashboard Enhancements (deferred)

- **DASH-F01**: Real profile view analytics (track views, show actual numbers)
- **DASH-F02**: Content recommendation algorithm (beyond simple tag matching)
- **DASH-F03**: Netflix-style content library with categories
- **DASH-F04**: Notification feed on dashboard
- **DASH-F05**: Teacher schedule/calendar widget

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real view tracking / analytics | Placeholder "—" for now — analytics wired up in future milestone |
| Recommendation algorithm | Simple tag matching sufficient for v1.17 |
| Netflix-style content library | Phase 2 feature |
| Community feed on dashboard | Explicitly removed per spec — no feed |
| Dark mode dashboard | Covered by ThemeProvider (v1.16), not dashboard-specific |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| COMP-04 | — | Pending |
| COMP-05 | — | Pending |
| COMP-06 | — | Pending |
| COMP-07 | — | Pending |
| COMP-08 | — | Pending |
| COMP-09 | — | Pending |
| STU-01 | — | Pending |
| STU-02 | — | Pending |
| STU-03 | — | Pending |
| STU-04 | — | Pending |
| TCH-01 | — | Pending |
| TCH-02 | — | Pending |
| TCH-03 | — | Pending |
| TCH-04 | — | Pending |
| TCH-05 | — | Pending |
| SCH-01 | — | Pending |
| SCH-02 | — | Pending |
| SCH-03 | — | Pending |
| SCH-04 | — | Pending |
| SCH-05 | — | Pending |
| SCH-06 | — | Pending |
| WP-01 | — | Pending |
| WP-02 | — | Pending |
| WP-03 | — | Pending |
| WP-04 | — | Pending |
| WP-05 | — | Pending |
| WP-06 | — | Pending |
| DES-01 | — | Pending |
| DES-02 | — | Pending |
| DES-03 | — | Pending |

**Coverage:**
- v1.17 requirements: 38 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 38

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02*
