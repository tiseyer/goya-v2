# Phase 29: Interest & Entry Points - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous mode)

<domain>
## Phase Boundary

Teachers who do not yet own a school are prompted to register from three distinct surfaces: dashboard right sidebar widget, subscriptions page callout, and add-ons page banner. All entry points are role-gated to teachers with no principal_trainer_school_id.

</domain>

<decisions>
## Implementation Decisions

### Entry Point Locations
- Dashboard right sidebar: card with heading "You own a school?", subtext about listing on GOYA, CTA "Register Your School →" linking to /schools/create
- Settings > Subscriptions: highlighted callout below teacher subscription card with CTA "Register Your School"
- Add-Ons page (/addons): featured banner/card section with heading "Own a Yoga School?", CTA "Register Your School →"

### Visibility Rules
- Only visible to users with role = teacher (member_type = 'teacher')
- Only visible when principal_trainer_school_id is null (no existing school)
- Server-side check preferred — fetch profile data and conditionally render

### Claude's Discretion
- Visual design: follow existing card/callout patterns in the codebase
- Component structure: create reusable SchoolRegistrationCTA or inline per location
- Animation/hover states: match existing patterns

</decisions>

<code_context>
## Existing Code Insights

### Dashboard
- Dashboard page likely at app/dashboard/ or app/(main)/dashboard/
- Right sidebar pattern: check existing dashboard layout for sidebar widget slots

### Subscriptions
- Subscriptions page at app/settings/subscriptions/
- Shows teacher subscription card — callout goes below it

### Add-Ons
- Add-ons page at app/addons/ or similar
- Teachers see add-on products here

### Profile Data
- profiles table now has principal_trainer_school_id (uuid, nullable)
- User role available via auth context/session
- member_type field distinguishes teacher/student/wellness_practitioner

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the user spec — 3 locations, teacher-only, no-school-only.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
