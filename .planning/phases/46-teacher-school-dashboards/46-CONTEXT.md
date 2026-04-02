# Phase 46: Teacher + School Dashboards - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Teacher and School layout stubs with fully assembled dashboards. Teacher gets completion card, stat hero, CTAs, connections. School-owner teachers get a "View as School" toggle with school-specific layout.

Requirements: TCH-01 through TCH-05, SCH-01 through SCH-06

</domain>

<decisions>
## Implementation Decisions

### Teacher Dashboard Layout (top to bottom)
1. DashboardGreeting: "Welcome back, [name]." + "Teacher" badge
2. "View as School" toggle (only if principal_trainer_school_id exists) — button/link to ?view=school
3. ProfileCompletionCard (if < 100%): headline "Get found by the right students", 6 weighted fields
4. StatHero: "X people viewed your profile this week" (placeholder "—")
5. 2 PrimaryActionCards side-by-side: "Share your next event" + "Add a course link"
6. Recent connections list: max 3, ConnectionCard components, "View all connections →" → /settings/connections

### School Dashboard Layout (top to bottom) — activated via ?view=school
1. DashboardGreeting: "Welcome back, [school name]." + "School" badge
2. Toggle back: "View as Teacher" link
3. School ProfileCompletionCard (if < 100%): "Help students find and enroll in your school"
4. StatHero: "X students discovered your school this week" (placeholder "—")
5. 2-3 PrimaryActionCards: "Add upcoming workshops & courses" + "Manage your designations"
6. Faculty list: max 5 FacultyCards, "Manage faculty →" → /schools/[slug]/settings?section=faculty
7. Enrolled students/community: max 5 ConnectionCards (students connected to school), "View all →"

### Critical Implementation Details
- School detection: profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id) — already in page.tsx from Phase 43
- "View as School" toggle: already uses URL param ?view=school from Phase 43
- School data: fetch from schools table using principal_trainer_school_id
- Faculty data: fetch from school_faculty table joined with profiles
- School completion: different fields than teacher (school name, bio, designations, location, teaching info, documents)
- Frame language: "enrolled", "your community", "faculty" — university-like, not directory

### Claude's Discretion
- School completion field weights (similar pattern to teacher but school-specific fields)
- Exact query for "enrolled students" (students connected to school or following it)
- Whether to show FacultyCard inline or in a HorizontalCarousel

</decisions>

<code_context>
## Existing Code Insights

### From Phase 43
- app/dashboard/page.tsx — has school detection, ?view=school param, school data fetch
- app/dashboard/components/TeacherLayout.tsx — stub to replace
- app/dashboard/components/SchoolLayout.tsx — stub to replace
- app/dashboard/components/types.ts — TeacherProps, SchoolProps interfaces

### From Phase 44
- All shared components: DashboardGreeting, ProfileCompletionCard, StatHero, PrimaryActionCard, HorizontalCarousel
- ConnectionCard, FacultyCard (restored in Phase 45)

### From Phase 45
- Pattern established: layout component receives all data as props, composes shared components
- DashboardStudent and DashboardWellness as reference for layout structure

</code_context>

<specifics>
## Specific Ideas

- Teacher "View as School" toggle: subtle pill button in the greeting area, not a full nav bar
- Faculty shown as a simple list (not carousel) — max 5 with "Manage faculty →"
- Enrolled students similarly as list — max 5 with "View all →"

</specifics>

<deferred>
## Deferred Ideas

None — final phase.

</deferred>
