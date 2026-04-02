# School Context Switch — Research

**Date:** 2026-04-02
**Branch:** feature/school-context-switch

## 1. Database Schema

### schools table (existing)
Created in `002_profile_fields.sql`, extended in `20260335_add_schools.sql` and `20260376_school_owner_schema.sql`.

Key columns:
- `id` uuid PK
- `owner_id` uuid → auth.users(id)
- `name`, `slug` (unique), `logo_url`, `description`
- `short_bio`, `bio`, `cover_image_url`
- `status` CHECK ('pending', 'pending_review', 'approved', 'rejected', 'suspended')
- `practice_styles` text[], `programs_offered` text[], `course_delivery_format`
- `video_platform`, `video_url`
- `location_address`, `location_city`, `location_country`, `location_lat`, `location_lng`, `location_place_id`
- `lineage` text, `established_year` int, `languages` text[]
- `is_insured`, `onboarding_completed`, `onboarding_completed_at`
- `approved_at`, `approved_by`
- `website`, `instagram`, `facebook`, `youtube`, `tiktok`
- `created_at`, `updated_at`

RLS: Public read for approved, owner read/update, admin full.

### school_faculty table (existing)
Created in `20260376_school_owner_schema.sql`.

- `id` uuid PK
- `school_id` uuid → schools(id)
- `profile_id` uuid → profiles(id) (nullable)
- `invited_email` text (nullable)
- `invite_token` text UNIQUE
- `position` text
- `is_principal_trainer` boolean DEFAULT false
- `status` CHECK ('pending', 'active', 'removed')

**No `can_manage` column exists.** This needs to be added.

RLS: Public read for approved schools, owner CRUD, admin full.

### school_designations table (existing)
- `school_id`, `designation_type`, `status`, Stripe references

### profiles table — school columns (existing)
- `principal_trainer_school_id` uuid → schools(id) — identifies school owner
- `faculty_school_ids` uuid[] DEFAULT '{}' — schools where user is faculty

### conversations table
Uses `participant_1`, `participant_2` UUIDs. Messages use `sender_id`.
**No author_type or school_author_id columns exist.**

### events table
Uses `created_by` UUID, `event_type` ('goya' | 'member'), `organizer_ids` UUID[].
**No author_type or school_author_id columns exist.**

### courses table
Uses `created_by` UUID, `course_type` ('goya' | 'member').
**No author_type or school_author_id columns exist.**

### chat_messages table (AI chatbot)
Separate from DM conversations. Not relevant to context switch.

## 2. Existing School Switching Logic

### Dashboard "View as School" toggle
- **File:** `app/dashboard/page.tsx` (lines 38-45)
- URL parameter: `?view=school`
- Detection: `profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id)`
- **CRITICAL:** School is NOT a role. It's `teacher` + `principal_trainer_school_id IS NOT NULL`.
- Toggle UI: `DashboardTeacher.tsx` (amber pill → `/dashboard?view=school`), `DashboardSchool.tsx` (emerald pill → `/dashboard`)

### Header school detection
- **File:** `app/components/Header.tsx` (lines 846-848)
- Client-side: fetches school slug via `supabase.from('schools').select('slug').eq('owner_id', user.id)`
- Passes `userSchoolId={schoolSlug}` to UserMenu
- Shows "School Settings" link or "Register School" based on `userSchoolId`

## 3. Author/Creator Patterns

| Table | Attribution Field | Set In |
|-------|------------------|--------|
| events | `created_by: user.id` | `app/settings/my-events/actions.ts:73` |
| courses | `created_by: user.id` | `app/settings/my-courses/actions.ts:61` |
| messages | `sender_id: userId` | `app/actions/messaging.ts:25` |
| posts | `author_id` | `lib/feed.ts:20` |
| comments | `author_id` | `lib/feed.ts:38` |

All use the personal profile UUID. No school attribution exists yet.

## 4. Profile Dropdown (UserMenu)

**File:** `app/components/Header.tsx` lines 411-640

Structure:
1. Avatar trigger button (lines 461-480)
2. User header: avatar, name, MRN (lines 485-497)
3. Menu items: My Profile, Credits & Hours, Teaching Hours (teachers), Messages (lines 500-513)
4. Admin section: Settings + Admin Settings (lines 517-541)
5. Regular user Settings (lines 545-558)
6. School section: School Settings or Register School (lines 562-588)
7. Impersonation: Settings + Switch Back (lines 591-617)
8. Theme switcher (line 620)
9. Logout (lines 626-634)

Props received: `userName`, `userMrn`, `userInitials`, `userRole`, `userId`, `userUsername`, `userMemberType`, `userSchoolId`, `avatarUrl`, `onLogout`, impersonation props.

## 5. Middleware

**File:** `middleware.ts` (299 lines)

Current flow:
1. Maintenance mode check (TTL-cached)
2. Fast path for public paths
3. Supabase client setup for session refresh
4. Impersonation cookie security (`goya_impersonating`)
5. Auth enforcement (redirect to sign-in)
6. Logged-in root redirect → /dashboard
7. Admin path authorization
8. Page visibility enforcement

**No `goya_active_context` cookie handling exists.** Needs to be added.

## 6. Affected Files Inventory

### Must create:
- `lib/active-context.ts` — server utility for parsing context
- `hooks/useActiveContext.ts` — client hook
- `app/actions/context.ts` — server action for switching
- Migration for `school_faculty.can_manage` + author columns on events/courses/messages
- `scripts/seed-school-context-test.ts`

### Must modify:
- `middleware.ts` — read/forward/validate context cookie
- `app/components/Header.tsx` — redesign UserMenu for context switching
- `app/dashboard/page.tsx` — replace URL param toggle with cookie-based context
- `app/dashboard/components/DashboardTeacher.tsx` — remove old toggle
- `app/dashboard/components/DashboardSchool.tsx` — remove old toggle
- `app/settings/my-events/actions.ts` — check active context for attribution
- `app/settings/my-courses/actions.ts` — check active context for attribution
- `app/actions/messaging.ts` — check active context for attribution
- `app/messages/page.tsx` — filter by active context
- `lib/types.ts` — add Event/Course author_type fields

### Potentially affected:
- `app/schools/[slug]/settings/` — may need context-aware access
- `app/schools/[slug]/page.tsx` — show school-attributed content
- `app/members/[id]/page.tsx` — show school-attributed content on profiles
- `lib/messaging.ts` — conversation queries may need school context

## 7. Gap Analysis

| What Exists | What Needs Building |
|-------------|-------------------|
| schools table with full schema | `can_manage` column on school_faculty |
| school_faculty for tracking members | author_type + school_author_id on events, courses, conversations |
| Dashboard ?view=school URL toggle | Cookie-based context switch (goya_active_context) |
| Header shows School Settings link | Full context switcher UI in dropdown |
| Events/courses created_by = user.id | Context-aware attribution in server actions |
| Messages sender_id = user.id | Context-aware message attribution |
| School profile page at /schools/[slug] | School-attributed content display |
| Impersonation cookie pattern in middleware | Context cookie validation in middleware |
