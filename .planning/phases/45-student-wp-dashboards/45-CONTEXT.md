# Phase 45: Student + Wellness Practitioner Dashboards - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-driven, no grey areas)

<domain>
## Phase Boundary

Replace the Student and Wellness Practitioner layout stubs with fully assembled dashboards using the shared components from Phase 44.

Requirements: STU-01, STU-02, STU-03, STU-04, WP-01, WP-02, WP-03, WP-04, WP-05, WP-06

</domain>

<decisions>
## Implementation Decisions

### Student Dashboard Layout (top to bottom)
1. DashboardGreeting: "Good morning, [name]. Ready to practice today?" + "Student" badge
2. Recommended teachers carousel: HorizontalCarousel with TeacherCards, header "Teachers that might suit you" + "Show all teachers →" → /members?role=teacher. Filter by teaching_styles overlap with student profile. Fallback: show recent featured teachers.
3. Courses carousel: HorizontalCarousel with CourseCards, header "Courses you might enjoy" + "Show all courses →" → /academy. Filter by tags/interests. Fallback: latest courses.
4. Events carousel: HorizontalCarousel with EventCards, header "Upcoming events" + "Show all events →" → /events. Show next 5 upcoming events.

### Wellness Practitioner Dashboard Layout (top to bottom)
1. DashboardGreeting: "Welcome back, [name]." + "Wellness Practitioner" badge
2. ProfileCompletionCard (if score < 100%): headline "Be visible to the yoga community", fields: avatar, bio, practice types, location, website/social
3. StatHero: "X people viewed your profile this week" (placeholder "—")
4. Primary CTAs (2 cards side by side on desktop, stacked mobile):
   - "Share your next event or workshop" → /settings/my-events (or /events/create if exists)
   - "Add a course or session link" → /settings/my-courses (or /academy/create if exists)
5. Suggested connections carousel: HorizontalCarousel with TeacherCards, header "Teachers and schools near you" + "Explore directory →" → /members. Filter by location.
6. Upcoming events carousel: same as student events section

### Claude's Discretion
- Exact filtering queries for recommended content (simple is fine)
- How to handle empty carousels (show empty state from HorizontalCarousel)
- Whether to use /settings/my-events or /events/create for CTA links (check what exists)

</decisions>

<code_context>
## Existing Code Insights

### From Phase 43
- app/dashboard/page.tsx — async server component, role branching, Promise.all data fetching
- app/dashboard/components/StudentLayout.tsx — stub to replace
- app/dashboard/components/WellnessLayout.tsx — stub to replace
- app/dashboard/components/types.ts — DashboardProfile, DashboardEvent, DashboardCourse, etc.
- lib/dashboard/queries.ts — fetchRecommendedTeachers, fetchUpcomingEvents, fetchRecommendedCourses, etc.

### From Phase 44
- app/dashboard/components/HorizontalCarousel.tsx — carousel wrapper
- app/dashboard/components/DashboardGreeting.tsx — greeting + badge
- app/dashboard/components/ProfileCompletionCard.tsx — completion card
- app/dashboard/components/StatHero.tsx — stat display
- app/dashboard/components/PrimaryActionCard.tsx — CTA card
- app/dashboard/components/TeacherCard.tsx, CourseCard.tsx, EventCard.tsx

</code_context>

<specifics>
## Specific Ideas

- Apple aesthetic: generous py-8 gap-8 between sections
- Mobile-first: flex-col sm:flex-row for CTA cards
- No community feed — clean, focused dashboard

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
