# Phase 47: Foundation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

DB migration (4 new profile columns + lineage type fix), profile-covers storage bucket, privacy helper, PUBLIC_PROFILE_COLUMNS constant, own-profile detection, Promise.all data fetch architecture, fetchMemberEvents/fetchMemberCourses queries.

Requirements: DB-01, DB-02, DB-03, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05

</domain>

<decisions>
## Implementation Decisions

### Critical Research Findings (LOCKED)
- Migration adds: cover_image_url (text), location_lat (double precision), location_lng (double precision), location_place_id (text) to profiles
- lineage field exists in DB but missing from lib/types.ts Profile interface — add as string[] | null
- profile-covers storage bucket: public read, authenticated write (same pattern as avatars bucket)
- PUBLIC_PROFILE_COLUMNS: explicit column list for service-role SELECT — never select('*')
- deriveProfileVisibility(): returns { showMap: boolean, showAddress: boolean, showFullAddress: boolean }
  - Students: showMap=false, showAddress=city+country only, showFullAddress=false
  - Online-only (practice_format='online'): showMap=false, showFullAddress=false
  - In-Person/Hybrid with lat/lng: showMap=true, showFullAddress=true
- Own-profile detection: supabase.auth.getUser() in page.tsx, compare with profile.id
- Current page.tsx hard-codes isOwnProfile=false — must fix
- fetchMemberEvents(userId): events where created_by = userId, status = 'published', date >= now()
- fetchMemberCourses(userId): courses where created_by = userId, status = 'published'
- Migrations applied via Supabase Management API (established project pattern)

### Claude's Discretion
- Exact column order in PUBLIC_PROFILE_COLUMNS
- Whether to create lib/members/queries.ts or extend lib/dashboard/queries.ts
- Storage bucket RLS policy details

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/members/[id]/page.tsx — current profile page (to be extended, not replaced yet)
- lib/types.ts — Profile interface to update
- lib/dashboard/queries.ts — existing query patterns
- supabase/migrations/ — migration file naming pattern

### Integration Points
- app/members/[id]/page.tsx — add auth.getUser(), Promise.all, privacy derivation
- lib/types.ts — add 4 new fields + lineage fix
- lib/members/ — new directory for profile-specific queries and helpers

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
