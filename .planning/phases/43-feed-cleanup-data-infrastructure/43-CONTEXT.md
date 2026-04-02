# Phase 43: Feed Cleanup + Data Infrastructure - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Old feed safely deleted; lib/dashboard/ data layer exists; page.tsx is a working async server component with correct role branch for Student, Teacher, School (teacher+school), and Wellness Practitioner.

Requirements: INFRA-01, INFRA-02, INFRA-03, INFRA-05

</domain>

<decisions>
## Implementation Decisions

### Critical Research Findings (LOCKED)
- School is NOT a separate role — school owners have role='teacher' AND principal_trainer_school_id IS NOT NULL
- Teacher with principal_trainer_school_id can toggle "View as School" dashboard mode
- Role branching must live in page.tsx, not layout.tsx (App Router layouts don't re-run on client navigation)
- JSONB empty arrays are truthy in JS — isFieldComplete() must check v.length > 0
- Feed DB tables (posts, likes, comments) must NOT be dropped — only UI component files deleted
- All data fetching server-side via Promise.all — role layouts receive data as props
- Use getEffectiveUserId() and getEffectiveClient() for impersonation-safe auth
- profileCompletion.ts: avatar 20%, bio 20%, location 15%, teaching_styles/practice_types 15%, website/social 10%, event/course 20%

### Claude's Discretion
- Internal structure of lib/dashboard/queries.ts (function names, return types)
- How to implement the "View as School" toggle (URL param, cookie, or client state)
- grep audit approach for safe feed file deletion

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- lib/supabase/getEffectiveUserId.ts — impersonation-safe user ID
- lib/supabase/getEffectiveClient.ts — impersonation-safe Supabase client
- lib/credits.ts getUserCreditTotals() — existing stat function
- profiles table with role, avatar_url, bio, teaching_styles, location fields

### Established Patterns
- Server components for data fetching
- Promise.all for parallel queries (used in admin analytics, shop)
- getSupabaseService() for service-role queries

### Integration Points
- app/dashboard/page.tsx — complete rewrite
- app/dashboard/components/ — delete old, create new
- lib/dashboard/ — new directory for queries and profile completion

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
