# Phase 34: Public School Profile - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Public school profile at /schools/[slug] (approved schools only). Hero with logo, name, designation badges, location. Body with about/teaching info left column, sidebar with details/faculty right. Member directory integration with School filter type and school cards.

</domain>

<decisions>
## Implementation Decisions

### Public Profile Page (PUB-01, PUB-02, PUB-03)
- Route: /schools/[slug] — server component
- Only accessible for schools with status='approved' (404 for others)
- Hero section (GOYA blue #345c83, left-aligned, same pattern as member profiles):
  - School logo (or placeholder)
  - School name
  - Designation badges (e.g. CYS200, CMS)
  - Location (city, country) if in-person/hybrid, "Online School" if online only
- Left column (main):
  - About section (full bio)
  - Practice Styles (pills)
  - Programs Offered (pills)
  - Languages (pills)
  - Lineage (pills)
  - Video intro (embedded iframe if set)
- Right sidebar:
  - Established year
  - Course delivery format
  - "GOYA Verified" badge
  - Website/social links (icons)
  - Faculty section: Principal Trainer + other faculty with positions and links to their GOYA profiles

### Member Directory Integration (PUB-04)
- In Members Directory (/members):
  - Add filter: "Member Type" — All / Teachers / Schools / Wellness Practitioners
  - Schools shown with different card style (school logo, designation badges, location)
  - Clicking school card goes to /schools/[slug]

### Claude's Discretion
- Exact card design for schools in directory
- Hero layout details
- Pills/badges visual treatment
- Faculty section layout

</decisions>

<code_context>
## Existing Code Insights

### Member Profile Pattern
- app/members/[id]/page.tsx — reference for hero section pattern
- Uses GOYA blue hero, left-aligned content

### Member Directory
- app/members/page.tsx — existing directory with filters
- Has MemberCard component for individual member cards
- Filter system to reference

### Schools Data
- schools table with all fields, joined with school_designations, school_faculty
- Faculty members link to profiles (profile_id)

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the user spec.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
