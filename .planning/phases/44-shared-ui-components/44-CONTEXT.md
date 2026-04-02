# Phase 44: Shared UI Components - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

All reusable dashboard components exist and can be consumed by any role layout: HorizontalCarousel, DashboardGreeting, PrimaryActionCard, ProfileCompletionCard, StatHero, and 5 card types.

Requirements: INFRA-04, COMP-01 through COMP-09, DES-01, DES-02, DES-03

</domain>

<decisions>
## Implementation Decisions

### Component Visual Design
- No carousel arrow buttons — swipe/scroll only (Apple minimal aesthetic)
- Card hover: subtle shadow lift (hover:shadow-md transition-shadow)
- Progress bar: thin rounded bar with brand primary color (h-1.5 rounded-full bg-primary)
- StatHero: static number display — no count-up animation (SSR-friendly)

### Card Content & Layout
- TeacherCard: avatar (64px), name, teaching styles tags, location, "View profile" link
- CourseCard: featured image, title, teacher name, category badge, "View course" link
- EventCard: date badge (month+day), title, organizer, format badge (online/in-person), "View event" link
- ConnectionCard: avatar, name, connection type badge, "View profile" link
- FacultyCard: avatar, name, position/role text, "View profile" link
- Card width: fixed 280px on desktop, 260px on mobile

### Design System (DES requirements)
- Apple/Netflix aesthetic: large white space (py-8 gap-8 between sections), bold section headers (text-2xl font-bold), minimal color
- Mobile-first: stacked on mobile, side-by-side CTAs on desktop (flex-col sm:flex-row)
- Each carousel has "Show all →" link (text-sm text-primary hover:underline) at top right

### Claude's Discretion
- Internal carousel implementation details (embla vs pure CSS snap)
- Component prop interface naming
- Whether @utility no-scrollbar goes in globals.css or a separate file

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/dashboard/components/types.ts — DashboardProfile, DashboardEvent, DashboardCourse, DashboardConnection types (from Phase 43)
- app/dashboard/components/utils.ts — formatDate, roleLabel, roleBadgeColor helpers (from Phase 43)
- lib/dashboard/profileCompletion.ts — computeProfileCompletion() returns { score, fields } (from Phase 43)
- app/components/ui/PageContainer.tsx — max-w-7xl wrapper (per CLAUDE.md)

### Established Patterns
- 'use client' only for interactivity (carousels need client for scroll events)
- Tailwind v4 with CSS variables from ThemeProvider (v1.16)
- Lucide React for icons

### Integration Points
- app/dashboard/components/ — all new components go here
- Role layout stubs from Phase 43 will import these components in Phases 45-46

</code_context>

<specifics>
## Specific Ideas

- HorizontalCarousel: overflow-x-auto snap-x snap-mandatory, hide scrollbar via @utility no-scrollbar, skeleton state for loading
- DashboardGreeting: "Good morning/afternoon/evening, [firstName]." with role badge pill
- PrimaryActionCard: full-width or half-width card with headline, value line (Hormozi), and CTA button
- ProfileCompletionCard: prominent full-width card with headline, checklist of missing fields as links, slim progress bar
- StatHero: large centered number (text-4xl font-bold), label below, "—" for null

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
