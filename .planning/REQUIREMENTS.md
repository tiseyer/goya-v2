# Requirements: GOYA v2

**Defined:** 2026-04-02
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.18 Requirements

Requirements for User Profile Redesign milestone. Each maps to roadmap phases.

### Database

- [ ] **DB-01**: Migration adds cover_image_url, location_lat, location_lng, location_place_id to profiles table
- [ ] **DB-02**: Profile type in lib/types.ts updated with new columns + lineage field fix
- [ ] **DB-03**: profile-covers storage bucket created for cover images

### Infrastructure

- [ ] **INFRA-01**: Server-side privacy helper deriveProfileVisibility() gates location/map based on role and practice_format
- [ ] **INFRA-02**: PUBLIC_PROFILE_COLUMNS constant as single source of truth for service-role SELECT
- [ ] **INFRA-03**: Own-profile detection via auth.getUser() — gates edit button, hides connect/message
- [ ] **INFRA-04**: Promise.all data fetching for profile + events + courses + connections + school + faculty
- [ ] **INFRA-05**: fetchMemberEvents() and fetchMemberCourses() query functions filtered by created_by

### Hero

- [ ] **HERO-01**: Cover image behind hero banner if cover_image_url set (absolute positioned, dark overlay)
- [ ] **HERO-02**: 120px circular avatar with white ring overlapping hero bottom
- [ ] **HERO-03**: Name, role badge, intro text (250 char), location with pin icon, language pills
- [ ] **HERO-04**: Action buttons row: Connect + Message (hidden on own profile)
- [ ] **HERO-05**: Edit profile button visible on own profile only
- [ ] **HERO-06**: Completion nudge banner below hero on own profile when < 100%

### Content

- [ ] **CONT-01**: Intro video embed (YouTube/Vimeo facade — thumbnail + play click) at top of main column
- [ ] **CONT-02**: About/Bio section with full text (hidden if no bio)
- [ ] **CONT-03**: Role-specific pill sections render only when field has values
- [ ] **CONT-04**: Teacher pills: teaching styles, focus, lineage, format, teaching since, years teaching
- [ ] **CONT-05**: Student pills: practice styles, what I'm looking for, practice level, learning preference
- [ ] **CONT-06**: School pills: scope, focus, programs, lineage, delivery, established year
- [ ] **CONT-07**: Wellness pills: type, modalities, focus areas, format, years, complementary badge

### Relationships

- [ ] **REL-01**: School affiliation section for teachers (school card + faculty list)
- [ ] **REL-02**: Faculty grid for school profiles (up to 6, "View all →")
- [ ] **REL-03**: Enrolled students/community for school profiles (count + 5 avatars)

### Media

- [ ] **MED-01**: Mapbox GL JS inline map for in-person/hybrid users with location_lat/lng
- [ ] **MED-02**: Map hidden for students and online-only profiles (server-side enforced)
- [ ] **MED-03**: Events carousel reusing HorizontalCarousel + EventCard
- [ ] **MED-04**: Courses carousel reusing HorizontalCarousel + CourseCard

### Sidebar

- [ ] **SIDE-01**: Membership card with "GOYA Member since" and designation badges
- [ ] **SIDE-02**: Connect + Message action buttons (or Enroll/Follow for schools)
- [ ] **SIDE-03**: Social links icon row (website, Instagram, TikTok, Facebook, YouTube)
- [ ] **SIDE-04**: Quick stats (profile views placeholder, connections count, events count)

### Design

- [ ] **DES-01**: Pill design: rounded-full, light blue (#345c83 at 10%) with #345c83 text
- [ ] **DES-02**: Format pills: green for Online, blue for In-Person, purple for Hybrid
- [ ] **DES-03**: Two-column layout: main content left, sidebar right (stacks on mobile)

## Future Requirements

### Profile Enhancements (deferred)

- **PROF-F01**: Real profile view tracking and analytics
- **PROF-F02**: Profile editing UI redesign (settings/profile)
- **PROF-F03**: Cover image upload in settings
- **PROF-F04**: Location geocoding from address to lat/lng
- **PROF-F05**: SEO meta tags and Open Graph for profile sharing

## Out of Scope

| Feature | Reason |
|---------|--------|
| Profile editing UI | Separate milestone — this milestone is read-only display |
| Real view tracking | Placeholder "—" for now |
| Onboarding flow for new fields | Separate milestone |
| Cover image upload | Needs settings UI — deferred |
| Location geocoding | Manual lat/lng entry or future geocoding integration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | — | Pending |
| DB-02 | — | Pending |
| DB-03 | — | Pending |
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| HERO-01 | — | Pending |
| HERO-02 | — | Pending |
| HERO-03 | — | Pending |
| HERO-04 | — | Pending |
| HERO-05 | — | Pending |
| HERO-06 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| CONT-06 | — | Pending |
| CONT-07 | — | Pending |
| REL-01 | — | Pending |
| REL-02 | — | Pending |
| REL-03 | — | Pending |
| MED-01 | — | Pending |
| MED-02 | — | Pending |
| MED-03 | — | Pending |
| MED-04 | — | Pending |
| SIDE-01 | — | Pending |
| SIDE-02 | — | Pending |
| SIDE-03 | — | Pending |
| SIDE-04 | — | Pending |
| DES-01 | — | Pending |
| DES-02 | — | Pending |
| DES-03 | — | Pending |

**Coverage:**
- v1.18 requirements: 35 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 35

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02*
