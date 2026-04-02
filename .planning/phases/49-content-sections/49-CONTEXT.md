# Phase 49: Content Sections - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-driven)

<domain>
## Phase Boundary

Bio section, role-specific pill sections (Teacher, Student, School, Wellness Practitioner), school affiliation for teachers, faculty grid and community section for schools.

Requirements: CONT-02 through CONT-07, REL-01 through REL-03

</domain>

<decisions>
## Implementation Decisions

### Bio Section
- Section header: "About"
- Full bio text (no truncation)
- Hidden entirely when bio is null/empty (no empty state placeholder)

### Pill Sections (ProfilePillSection reusable component)
- Each section: label + array of pill badges
- Only renders if field has values (non-null, non-empty array)
- Pill style: rounded-full bg-[#345c83]/10 text-[#345c83] px-3 py-1 text-sm
- Format pills: Online=#10B981/10 text-#10B981, In-Person=#3B82F6/10 text-#3B82F6, Hybrid=#8B5CF6/10 text-#8B5CF6

### Teacher Pills
- teaching_styles (text[]) → "Teaching styles"
- teaching_focus_arr (text[]) → "Teaching focus"
- lineage (string[]) → "Lineage"
- practice_format → "Teaching format" (single format pill)
- years_teaching → "Teaching since [year]" (plain text)
- Calculated: "X years teaching" (current year - years_teaching)

### Student Pills
- practice_styles (text[]) → "Practice styles"
- yoga_goals or similar → "What I'm looking for"
- practice_level → "Practice level" (single pill)
- learning_preference or similar → "How I prefer to learn" (single pill)

### School Pills
- teaching_styles (from school data) → "Our scope"
- teaching_focus_arr → "Teaching focus"
- programs (text[]) → "Programs offered"
- lineage → "Lineage"
- course_delivery_format → "Course delivery" (format pill)
- established_year → "Established [year]"

### Wellness Practitioner Pills
- wellness_type or practitioner_type → "Practitioner type" (single pill)
- modalities or wellness_designations → "Modalities"
- wellness_focus → "Focus areas"
- practice_format → "Practice format" (format pill)
- years_practicing → "Years in practice"
- complementary_to_yoga boolean → "Works alongside yoga practitioners" badge

### School Affiliation (REL-01 — Teacher only)
- SchoolAffiliation.tsx component
- Shows school avatar + name + teacher's position title
- "Visit school profile →" link to /schools/[slug]
- List of other faculty (first 4 small avatars + "View all")

### Faculty Grid (REL-02 — School only)
- FacultyGrid.tsx component
- Grid of teacher cards: avatar, name, position, link to profile
- Show up to 6, "View all faculty →" link

### Community Section (REL-03 — School only)
- Show count of enrolled students
- Small avatars of latest 5 students
- Language: "enrolled", "our community"

### Claude's Discretion
- Exact field names for student-specific pills (yoga_goals, practice_level — verify against schema)
- Whether to use Profile fields or School fields for school pill sections
- Component splitting between ProfilePills, SchoolAffiliation, FacultyGrid

</decisions>

<code_context>
## From Phase 47-48
- app/members/[id]/page.tsx — two-column layout, passes profile + school + faculty as props
- app/members/[id]/components/ProfileHero.tsx — reference for component pattern
- lib/types.ts — Profile interface with all fields
- lib/members/queries.ts — fetchMemberEvents, fetchMemberCourses

</code_context>

<specifics>
No additional specifics.
</specifics>

<deferred>
None.
</deferred>
