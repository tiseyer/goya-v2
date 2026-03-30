# Phase 2: Import Script & Test Data - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Build the Node.js import script, dummy test data, migration infrastructure (gitignore, README, Supabase migration for requires_password_reset), and run the import against test data.

</domain>

<decisions>
## Implementation Decisions

### Import Script Architecture
- TypeScript script at migration/import-users.ts
- Uses @supabase/supabase-js with service role key from .env.local (SUPABASE_SERVICE_ROLE_KEY already exists)
- CLI args: --file (path or glob), --mode=skip|overwrite
- Process users sequentially to avoid rate limiting

### Profile Field Mapping (WP Export → Supabase profiles)
- wp.email → profiles.email
- wp.display_name → profiles.full_name
- wp.first_name + wp.last_name → stored in full_name if display_name is missing
- wp.profile.introduction → profiles.introduction
- wp.profile.personal_bio → profiles.biography (note: column is "biography" not "bio")
- wp.profile.influences → profiles.influences (text, may need array→text conversion)
- wp.profile.practice_level → profiles.practice_level
- wp.profile.practice_styles → profiles.practice_styles (text[])
- wp.profile.years_teaching → profiles.years_teaching
- wp.profile.teaching_styles → profiles.teaching_styles_profile
- wp.profile.teaching_focus → profiles.teaching_focus
- wp.profile.teaching_format → profiles.teaching_format
- wp.profile.video_introduction → profiles.video_intro_url
- wp.profile.lineage → profiles.lineage
- wp.profile.website → profiles.website
- wp.profile.instagram → profiles.instagram
- wp.profile.youtube → profiles.youtube
- wp.profile.city + wp.profile.country → profiles.location (concatenated)
- wp.avatar_url → profiles.avatar_url

### Subscriptions Mapping
- Store in existing stripe_orders table (type='recurring')
- wp.subscriptions[].stripe_customer_id → stripe_orders.stripe_customer_id
- wp.subscriptions[].stripe_subscription_id → stripe_orders.stripe_id
- wp.subscriptions[].status → stripe_orders.subscription_status
- wp.subscriptions[].plan_name → derive product lookup or store as metadata
- Set profiles.subscription_status = 'member' if any active subscription exists

### MRN Generation
- Use Supabase RPC or replicate generate_mrn() logic in TypeScript
- Check used_mrns table before assigning
- Insert into used_mrns after profile creation (or let trigger handle it)

### Role Mapping
- subscriber / member / no role → 'student'
- teacher (WP role or plan contains "teacher") → 'teacher'
- wellness (plan contains "wellness") → 'wellness_practitioner'
- administrator → 'admin'

### Supabase Migration Needed
- Add requires_password_reset boolean column to profiles table (default false)

### Claude's Discretion
- Whether to use glob package or manual file listing
- Error handling strategy (continue on error vs fail fast)
- Whether to batch upserts or do them one by one

</decisions>

<code_context>
## Existing Code Insights

### Database Schema
- profiles: id, email, full_name, mrn, role (user_role enum), avatar_url, bio, location, website, instagram, youtube, is_verified, introduction, biography, video_intro_url, practice_level, practice_styles, influences, years_teaching, teaching_styles_profile, teaching_format, teaching_focus, lineage, username, subscription_status
- used_mrns: id (text PK, 8-digit), created_at, status
- stripe_orders: id, stripe_id, stripe_customer_id, user_id, amount_total, currency, status, type, subscription_status, current_period_start, current_period_end
- generate_mrn() function exists as Supabase RPC

### Key Files
- supabase/migrations/001_profiles.sql — base schema
- supabase/migrations/002_*.sql — additional profile columns
- supabase/migrations/20260319*.sql — username, subscription_status
- supabase/migrations/20260340_stripe_tables.sql — stripe_orders
- supabase/migrations/20260353_mrn_used_table.sql — MRN system

### Integration Points
- migration/wp-goya-exporter/ — export JSON format (Phase 1 output)
- .env.local — SUPABASE_SERVICE_ROLE_KEY
- .gitignore — needs migration/*.json entry

</code_context>

<specifics>
## Specific Ideas

- Dummy users should have @test.goya.com emails
- Some dummy users should have credits in varied states for testing credits milestone logic

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
