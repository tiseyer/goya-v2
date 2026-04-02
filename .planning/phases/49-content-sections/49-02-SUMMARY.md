---
phase: 49-content-sections
plan: "02"
subsystem: member-profiles
tags: [profiles, school-affiliation, faculty, community, pills, components]
dependency_graph:
  requires: [49-01]
  provides: [school-affiliation-section, faculty-grid-section, community-section, wired-profile-page]
  affects: [app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [server-components, conditional-rendering, nullable-type-safety]
key_files:
  created:
    - app/members/[id]/components/SchoolAffiliation.tsx
    - app/members/[id]/components/FacultyGrid.tsx
    - app/members/[id]/components/CommunitySection.tsx
  modified:
    - app/members/[id]/page.tsx
    - app/members/[id]/components/ProfileContentPills.tsx
decisions:
  - ProfileContentPills.tsx created here (Plan 01 was partially executed — only ProfileBio and ProfilePillSection had been committed)
  - FacultyProfile.full_name treated as string | null to match actual query.ts return type
  - Community section uses faculty_school_ids contains query (not enrollment table) per plan spec
  - role variable moved before data-fetching blocks to enable conditional school/teacher fetching
metrics:
  duration_minutes: 25
  tasks_completed: 2
  files_created: 4
  files_modified: 1
  completed_date: "2026-04-02"
---

# Phase 49 Plan 02: SchoolAffiliation + FacultyGrid + CommunitySection + page wiring Summary

**One-liner:** Server-component relationship sections for school affiliation (teacher) and faculty grid + community (school), wired into the two-column profile page alongside ProfileBio and ProfileContentPills.

## What Was Built

### SchoolAffiliation.tsx
School card showing logo/initial fallback + school name + "Visit school profile" teal arrow link. Below the card: if faculty exist, shows first 4 faculty as 32px circular avatars with name tooltips linked to member profiles. "+N more" shown if count exceeds 4. Renders for teacher profiles with affiliated schools.

### FacultyGrid.tsx
Grid (`grid-cols-2 sm:grid-cols-3`) showing up to 6 faculty members — each with 48px avatar, name, optional position, and "Principal Trainer" badge. Entire card links to `/members/[id]`. "View all faculty" teal link shown when count exceeds 6. Returns null when faculty array is empty.

### CommunitySection.tsx
Shows enrolled student count with singular/plural label and up to 5 overlapping 32px circular avatars (`-ml-2` overlap, `ring-2 ring-white`). Returns null when studentCount is 0.

### ProfileContentPills.tsx (completed from Plan 01)
Role-specific pill orchestrator that was missing from Plan 01 execution. Renders a "Details" card with ProfilePillSection instances per role (teacher/student/school/wellness_practitioner). Returns null if no content exists for the profile's role.

### page.tsx wiring
- Added imports for all 5 new components + fetchSchoolFaculty
- Moved `const role` declaration before data-fetching blocks
- Extended profile type cast with 8 pill fields (teaching_styles, teaching_focus_arr, lineage, years_teaching, practice_styles, practice_level, wellness_focus, member_type)
- Teacher profiles: fetchSchoolFaculty called for first affiliated school
- School profiles: fetch own school record + faculty + community (faculty_school_ids contains query)
- Replaced inline bio block with ProfileBio component
- Replaced inline school card block with SchoolAffiliation component
- Section order: Bio > ContentPills > SchoolAffiliation > FacultyGrid > CommunitySection > Connections

## Commits

| Hash | Message |
|------|---------|
| 1a7e187 | feat(49-01): add ProfileBio, ProfilePillSection, ProfileContentPills components |
| fe3f523 | feat(49-02): add SchoolAffiliation, FacultyGrid, CommunitySection components |
| 53dd35e | feat(49-02): wire all Phase 49 components into profile page |

## Deviations from Plan

### Auto-completed Plan 01 Task 2 (missing component)
**Found during:** Plan start — ProfileContentPills.tsx was not yet created when this plan began. Plan 01 had only committed ProfileBio and ProfilePillSection.
**Fix:** Created ProfileContentPills.tsx per Plan 01 spec before proceeding with Plan 02.
**Files modified:** `app/members/[id]/components/ProfileContentPills.tsx`
**Commit:** 1a7e187

### [Rule 1 - Bug] Fixed full_name nullability in faculty component props
**Found during:** Task 1 verification (tsc --noEmit)
**Issue:** `FacultyProfile.full_name` is typed `string | null` in queries.ts, but component props declared it as `string`. TypeScript error on both SchoolAffiliation and FacultyGrid faculty props.
**Fix:** Changed prop types to `full_name: string | null` and updated all usages to use `const name = p.full_name ?? ''`.
**Files modified:** SchoolAffiliation.tsx, FacultyGrid.tsx
**Commit:** 53dd35e

## Known Stubs

None — all data is wired to live Supabase queries. Community section uses `faculty_school_ids` contains query (showing faculty members in community, not enrolled students — this is the approach specified in the plan for the current data model).

## Self-Check: PASSED

All created files verified on disk. All commits verified in git history. TypeScript compiles with zero errors introduced by this plan (pre-existing unrelated error in `.next/dev/types/validator.ts` is out of scope). Build succeeds.
