# Phase 28: Database Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The database fully supports the school owner system — extended schema, all new tables, role-scoped access, and TypeScript types passing.

Extend existing schools table with new columns (bio, video, presence, teaching info, location, onboarding state). Create school_designations, school_faculty, and school_verification_documents tables. Extend profiles with principal_trainer_school_id and faculty_school_ids. Implement RLS policies for owner/public/admin access patterns. Regenerate TypeScript types.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from user spec:
- Schools table already exists with basic columns — ALTER TABLE, not CREATE TABLE
- Schools status CHECK must include: 'pending', 'pending_review', 'approved', 'rejected', 'suspended'
- school_designations designation_type CHECK: 'CYS200','CYS300','CYS500','CCYS','CPYS','CMS','CYYS','CRYS'
- school_faculty allows null profile_id (for non-member invites via email)
- school_verification_documents document_type CHECK: 'business_registration','qualification_certificate','insurance','other'
- video_platform CHECK: 'youtube', 'vimeo'
- course_delivery_format CHECK: 'in_person', 'online', 'hybrid'
- Teachers can only own one school (enforce via profiles.principal_trainer_school_id)

</decisions>

<code_context>
## Existing Code Insights

### Existing Schools Table (types/supabase.ts)
- Already has: id, name, owner_id, slug, status, description, logo_url, street_address, city, state, zip, country, website, instagram, facebook, youtube, tiktok, is_featured, rejection_reason, created_at, updated_at
- Missing: short_bio, bio (replacing description), video_platform, video_url, practice_styles, programs_offered, course_delivery_format, location_address, location_city, location_country, location_lat, location_lng, location_place_id, lineage, established_year, languages, is_insured, onboarding_completed, onboarding_completed_at, approved_at, approved_by, cover_image_url

### Migration Pattern
- Migrations in supabase/migrations/ with timestamp prefix
- RLS follows existing patterns: owner SELECT/UPDATE, public SELECT approved, admin/mod full
- Types regenerated via npx supabase gen types

### Integration Points
- profiles table needs principal_trainer_school_id and faculty_school_ids columns
- Existing school_registrations admin inbox tab queries schools table

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow the exact schema from user spec.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
