# Phase 1: Database & Storage Foundation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Every file uploaded on the platform is tracked in media_items, with correct permissions enforced at the database level. This includes creating the media_items and media_folders tables, RLS policies per role, ensuring storage buckets exist, regenerating TypeScript types, and instrumenting all 8 existing upload flows to write media_items rows.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from user spec:
- Map to existing bucket names (avatars, event-images, school-logos, upgrade-certificates, chatbot-avatars, post-images/post-videos/post-audio)
- Do NOT break any existing upload flows — only add the media_items insert after successful storage upload
- All Storage operations via server actions or API routes — no client-side service role key
- After migration: regenerate types via `npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts`
- Run `npx tsc --noEmit` after — must pass

</decisions>

<code_context>
## Existing Code Insights

### Upload Call Sites (8 total)
1. `app/api/avatar/route.ts:27` — avatars bucket, profile pictures (server-side Buffer upload)
2. `app/admin/events/components/EventForm.tsx:91` — event-images bucket, admin event banners (client-side)
3. `app/settings/my-events/MyEventsClient.tsx:114` — event-images bucket, member event images (client-side)
4. `app/upgrade/actions.ts:31` — upgrade-certificates bucket, teacher cert uploads (server action)
5. `app/schools/create/onboarding/page.tsx:157` — school-logos bucket, school creation (client-side)
6. `app/schools/[id]/settings/SchoolSettingsClient.tsx:168` — school-logos bucket, school settings (client-side)
7. `app/admin/chatbot/chatbot-actions.ts:101` — chatbot-avatars bucket, chatbot avatar (server action)
8. `lib/feed.ts:359` — post-images/post-videos/post-audio buckets, feed posts (client-side)

### Established Patterns
- Supabase client via `@/lib/supabase` (client-side) and `createSupabaseServerClient` / `getSupabaseService` (server-side)
- Service role client for admin operations: `getSupabaseService()`
- Existing tables use gen_random_uuid() for PKs, timestamptz for dates
- RLS patterns established in member_events_rls.sql and member_courses_rls.sql migrations

### Integration Points
- Client-side uploads use `supabase.storage.from(bucket).upload()` then `.getPublicUrl()`
- Server-side uploads use effective client or service client
- Types at `types/supabase.ts` — regenerated after migrations

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Follow existing migration patterns (sequential numbering in supabase/migrations/).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
