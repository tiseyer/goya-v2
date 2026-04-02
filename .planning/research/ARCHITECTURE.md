# Architecture Patterns: Profile Page Redesign (v1.18)

**Domain:** Public member profile page — `/members/[id]`
**Researched:** 2026-04-01
**Source confidence:** HIGH — all findings verified directly from codebase

---

## Existing Page Structure (What Gets Replaced)

`app/members/[id]/page.tsx` is a server component with `force-dynamic` that:

1. Fetches the profile via `getSupabaseService()` (service role, bypasses RLS)
2. Fetches affiliated school(s) if `principal_trainer_school_id` or `faculty_school_ids` is set
3. Renders a two-column layout: main (bio + connections) / sidebar (social links + school card + member card + ConnectButton)
4. Hero section is a fixed-height `bg-primary` banner with avatar, role badge, name, and location

**What's missing from the current page (target features for v1.18):**
- Cover image (currently a plain bg-primary background)
- Intro video embed
- Role-specific pill sections (teaching styles, languages, practice format, etc.)
- Events and courses carousels
- Mapbox inline map
- Designation badges in sidebar
- Own-profile editing nudge / completion banner
- Faculty grid for school-affiliated teachers
- Facebook/TikTok social links (stored but not rendered)

---

## Data Model: `profiles` Table

All columns verified from `lib/types.ts` and migrations `001_profiles.sql`, `002_profile_fields.sql`, `20260326_extend_onboarding.sql`, `20260355_add_wp_roles_to_profiles.sql`, `20260376_school_owner_schema.sql`.

### Identity & Display
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `email` | text | Not shown publicly |
| `full_name` | text | Fallback display name |
| `first_name` | text | Preferred — use with `last_name` |
| `last_name` | text | |
| `username` | text | Slug-style handle |
| `mrn` | text | Member registration number |
| `role` | text | `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin` |
| `avatar_url` | text | Profile photo URL |
| `bio` | text | Free-text bio |
| `introduction` | text | Short intro text (distinct from bio) |
| `created_at` | timestamptz | "Member since" date |

### Location
| Column | Type | Notes |
|--------|------|-------|
| `location` | text | Free-form location string (legacy) |
| `city` | text | Structured city |
| `country` | text | Structured country |
| `practice_format` | text | `online`, `in_person`, `hybrid` — drives map visibility |

### Social Links
| Column | Type | Notes |
|--------|------|-------|
| `website` | text | |
| `instagram` | text | Handle or full URL |
| `facebook` | text | |
| `tiktok` | text | |
| `youtube` | text | Channel handle or URL |
| `youtube_intro_url` | text | Intro/reel video URL (YouTube or Vimeo) |
| `phone` | text | Not shown publicly |

### Shared Role Fields
| Column | Type | Notes |
|--------|------|-------|
| `languages` | text[] | Spoken/teaching languages |

### Teacher-Specific
| Column | Type | Notes |
|--------|------|-------|
| `teacher_status` | text | Certification status |
| `teaching_styles` | text[] | e.g. Hatha, Vinyasa |
| `years_teaching` | text | |
| `teaching_focus_arr` | text[] | Specializations |
| `influences_arr` | text[] | Influences/lineage |
| `other_org_member` | boolean | Member of other orgs |
| `other_org_names` | text[] | |
| `certificate_url` | text | |
| `principal_trainer_school_id` | uuid | FK → schools.id; set = school owner |
| `faculty_school_ids` | uuid[] | Schools where member is faculty |

### Student-Specific
| Column | Type | Notes |
|--------|------|-------|
| `practice_level` | text | Beginner/Intermediate/Advanced |
| `practice_styles` | text[] | Yoga styles practiced |

### Wellness Practitioner-Specific
| Column | Type | Notes |
|--------|------|-------|
| `wellness_designations` | text[] | Credential types |
| `wellness_focus` | text[] | Practice focus areas |
| `wellness_org_name` | text | |
| `wellness_regulatory_body` | boolean | |

### Verification & Subscription
| Column | Type | Notes |
|--------|------|-------|
| `is_verified` | boolean | |
| `verification_status` | text | `unverified`, `pending`, `verified`, `rejected` |
| `subscription_status` | text | `member`, `guest` |

---

## School Ownership Model

**Critical:** There is no `role = 'school'`. School owners are teachers with `principal_trainer_school_id IS NOT NULL`.

```
profiles.role = 'teacher' AND profiles.principal_trainer_school_id IS NOT NULL
  → person is a school owner (Principal Trainer)

profiles.faculty_school_ids = [uuid, ...]
  → person is faculty at one or more approved schools
```

School data lives in the `schools` table. Relevant columns for the profile page:
- `id`, `name`, `slug`, `status` (must be `'approved'` to show link)
- `logo_url`, `bio`, `cover_image_url`
- `location_city`, `location_country`, `location_lat`, `location_lng`
- `course_delivery_format`, `practice_styles`, `languages`
- `established_year`, `lineage`

Faculty members live in `school_faculty` table (columns: `id`, `school_id`, `profile_id`, `position`, `is_principal_trainer`, `status`). Status must be `'active'` to show in a faculty grid.

Designation badges come from `school_designations` table (columns: `school_id`, `designation_type`, `status`). Valid types: `CYS200`, `CYS300`, `CYS500`, `CCYS`, `CPYS`, `CMS`, `CYYS`, `CRYS`.

---

## Reusable Components Already Built

### From `app/dashboard/components/`

| Component | File | What It Does | Props |
|-----------|------|--------------|-------|
| `HorizontalCarousel` | `HorizontalCarousel.tsx` | Embla + CSS snap-x carousel wrapper | `title`, `showAllHref`, `children`, `emptyState`, `loading` |
| `EventCard` | `EventCard.tsx` | 280px wide card for an `EventRow` | `event: EventRow` |
| `FacultyCard` | `FacultyCard.tsx` | 280px wide card for a `FacultyRow` — links to `/directory/[id]` | `faculty: FacultyRow` |

**NOTE:** `EventCard` depends on `EventRow` from `lib/dashboard/queries.ts`. `FacultyCard` depends on `FacultyRow` from the same file. Both types are already exported and stable.

**No `CourseCard` exists in the dashboard components.** The dashboard uses inline rendering for courses. A dedicated `CourseCard` component will need to be created for the profile page carousels.

### From `app/components/`

| Component | File | What It Does | Props |
|-----------|------|--------------|-------|
| `ConnectButton` | `ConnectButton.tsx` | Role-aware connect/request/accept flow | `memberId`, `memberName`, `memberPhoto`, `firstName`, `viewerRole`, `profileRole`, `isOwnProfile`, `isOwnSchool?` |
| `MessageButton` | `MessageButton.tsx` | Opens DM to member | (verify props) |
| `ConnectionsSection` | `ConnectionsSection.tsx` | Shows accepted connections list (own profile only currently) | `profileMemberId`, `isOwnProfile?` |
| `PageContainer` | `ui/PageContainer.tsx` | Standard max-w-7xl content width wrapper | `className?` |

### Data Fetch Utilities in `lib/dashboard/queries.ts`

All query functions are `server-only` and accept a `SupabaseClient`:

| Function | Returns | Reuse for profile page? |
|----------|---------|-------------------------|
| `fetchUpcomingEvents(supabase, limit?)` | `EventRow[]` | YES — for events carousel |
| `fetchRecentCourses(supabase, limit?)` | `CourseRow[]` | YES — for courses carousel |
| `fetchAcceptedConnections(supabase, userId, limit?)` | `AcceptedConnection[]` | YES — for connections display |
| `fetchSchoolFaculty(supabase, schoolId, limit?)` | `FacultyRow[]` | YES — for faculty grid on teacher profiles |
| `fetchUserInProgressCourses(supabase, userId, limit?)` | `InProgressCourseRow[]` | Possibly — for own profile only |

**Important:** `fetchUpcomingEvents` and `fetchRecentCourses` return platform-wide data, not member-specific data. For the profile page you need events/courses *created by* the profile owner. New query variants will be needed:
- `fetchMemberEvents(supabase, userId, limit?)` — filter by `created_by = userId` and `status = 'published'`
- `fetchMemberCourses(supabase, userId, limit?)` — filter by `created_by = userId` and `status = 'published'`

---

## Data Fetching Pattern

### Established Pattern (from `app/dashboard/page.tsx`)

The dashboard page uses server-side-only data fetching with `Promise.all`:

```typescript
// page.tsx (server component, force-dynamic)
const serviceClient = getSupabaseService()  // service role — bypasses RLS

const [profile, events, courses, faculty] = await Promise.all([
  serviceClient.from('profiles').select(...).eq('id', id).single(),
  fetchMemberEvents(serviceClient, id),
  fetchMemberCourses(serviceClient, id),
  fetchSchoolFaculty(serviceClient, schoolId),  // conditional
])
```

**Use service role client** (same as current profile page). The middleware enforces authentication. Service role avoids JWT expiry causing false 404s on shared/bookmarked profile links.

### Viewer Identity

The redesigned page needs to know the logged-in user's ID and role for:
- Showing/hiding the own-profile editing nudge
- Passing `viewerRole` and `isOwnProfile` to `ConnectButton`

Get this via `getEffectiveUserId()` and `getEffectiveClient()` from `lib/supabase/getEffectiveUserId`. These return `null` / unauthenticated client gracefully — profile pages must handle unauthenticated viewers.

```typescript
// Safe pattern for pages that are public but auth-aware
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const viewerId = user?.id ?? null
```

---

## Privacy Rules (From v1.18 Milestone Spec)

| Address visibility | Condition |
|-------------------|-----------|
| Full address hidden | `role = 'student'` — never show precise address |
| Full address hidden | `practice_format = 'online'` — no physical presence |
| City + Country only | `role = 'teacher'` with `practice_format = 'in_person'` or `'hybrid'` |
| Map shown | `practice_format = 'in_person'` or `'hybrid'`, non-student |

These rules need to be enforced server-side before passing address data to client components.

---

## Component Architecture for New Profile Page

### Recommended Layout

```
app/members/[id]/page.tsx          ← server component, all data fetching
  └─ ProfileHero                   ← new component (cover, avatar, name, badge, actions)
  └─ [2-col grid]
       ├─ Left column (lg:col-span-2)
       │    ├─ ProfileBio           ← thin wrapper around existing bio text
       │    ├─ ProfilePills         ← new component, role-specific pill sections
       │    ├─ ProfileVideo         ← new component, YouTube/Vimeo embed
       │    ├─ HorizontalCarousel   ← reuse from dashboard (events)
       │    ├─ HorizontalCarousel   ← reuse from dashboard (courses)
       │    └─ ProfileMap           ← new component (Mapbox inline map)
       └─ Sidebar (lg:col-span-1)
            ├─ MemberCard           ← existing inline markup → extract to component
            ├─ ConnectButton        ← reuse existing
            ├─ MessageButton        ← reuse existing
            ├─ DesignationBadges    ← new component
            ├─ SocialLinks          ← existing inline markup → extract, add FB/TikTok
            └─ SchoolAffiliation    ← existing inline markup → polish
```

### New Components to Build

| Component | Data Source | Role Gating |
|-----------|-------------|-------------|
| `ProfileHero` | `profile.*`, `cover_image_url` | None |
| `ProfilePills` | `teaching_styles`, `practice_styles`, `wellness_designations`, `languages`, `practice_format` | Role-branched |
| `ProfileVideo` | `youtube_intro_url` | None |
| `ProfileMap` | `city`, `country`, `practice_format` + future lat/lng | Hide for students and online-only |
| `DesignationBadges` | `user_designations` table or `school_designations` | None |
| `OwnProfileNudge` | `viewerId === profile.id`, completion score | Only own profile |
| `CourseCard` | `CourseRow` from new `fetchMemberCourses` | None |

---

## Role-Specific Pill Sections

Based on the `Profile` type and milestone spec:

| Role | Pills Section Label | Fields |
|------|--------------------|----|
| `teacher` | Teaching Styles | `teaching_styles[]` |
| `teacher` | Teaching Focus | `teaching_focus_arr[]` |
| `teacher` | Influences | `influences_arr[]` |
| `teacher` | Languages | `languages[]` |
| `student` | Practice Styles | `practice_styles[]` |
| `student` | Languages | `languages[]` |
| `wellness_practitioner` | Specialisms | `wellness_focus[]` |
| `wellness_practitioner` | Credentials | `wellness_designations[]` |
| All | Practice Format | `practice_format` (single badge) |

---

## Connection Between Profile Page and School Pages

The existing profile page already handles school affiliation display:
- If `principal_trainer_school_id` is set → fetch that school, show "Visit School" card
- If `faculty_school_ids` is set → fetch those schools (array), show one card per school

The v1.18 redesign should also show a "Faculty at" section linking to school profiles when a teacher is faculty at one or more approved schools. The existing fetch logic in `page.tsx` (lines 54–71) can be reused with minor refactoring.

---

## Integration Points Summary

| Integration | Mechanism | Status |
|-------------|-----------|--------|
| Profile data fetch | `getSupabaseService()` + `.from('profiles').select(...)` | EXISTS — extend field list |
| School affiliation | Service role fetch of `schools` table via `principal_trainer_school_id` / `faculty_school_ids` | EXISTS — reuse |
| Faculty grid | `fetchSchoolFaculty()` from `lib/dashboard/queries.ts` | EXISTS — reuse |
| Events carousel | New `fetchMemberEvents()` (mirror of `fetchUpcomingEvents` with `created_by` filter) | NEEDS CREATION |
| Courses carousel | New `fetchMemberCourses()` (mirror of `fetchRecentCourses` with `created_by` filter) | NEEDS CREATION |
| Connect button | `ConnectButton` component — needs `viewerRole` from server | EXISTS — reuse |
| Message button | `MessageButton` component | EXISTS — reuse |
| Completion nudge | `getProfileCompletion()` from `lib/dashboard/profileCompletion.ts` | EXISTS — reuse |
| Carousel wrapper | `HorizontalCarousel` from `app/dashboard/components/` | EXISTS — reuse |
| Event card | `EventCard` from `app/dashboard/components/` | EXISTS — reuse |
| Faculty card | `FacultyCard` from `app/dashboard/components/` | EXISTS — reuse |
| Course card | None exists yet | NEEDS CREATION |
| Intro video | New `ProfileVideo` component | NEEDS CREATION |
| Mapbox map | New `ProfileMap` component | NEEDS CREATION |
| Designation badges | New component querying `user_designations` or `school_designations` | NEEDS CREATION |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Checking `role === 'school'`
**What goes wrong:** There is no `'school'` value in `profiles.role`. School owners are teachers.
**Instead:** Check `profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id)`

### Anti-Pattern 2: Client-side data fetching for profile data
**What goes wrong:** Causes flash of loading state on page load, leaks service role patterns to client.
**Instead:** Fetch all profile data in `page.tsx` server component via `Promise.all`, pass as props.

### Anti-Pattern 3: Showing address or map for students or online-only profiles
**What goes wrong:** Privacy violation per product spec.
**Instead:** Gate map/address display on `practice_format !== 'online' && role !== 'student'` server-side.

### Anti-Pattern 4: Using `<img>` instead of `next/image` for avatar and cover
**What goes wrong:** Current page uses `<img>` (with eslint-disable). The redesign should move to `next/image`.
**Instead:** Use `<Image>` from `next/image` for all profile media. Add external image domains to `next.config`.

### Anti-Pattern 5: Hardcoding max-width or padding on page sections
**What goes wrong:** Misalignment with header/footer.
**Instead:** Wrap all content sections in `<PageContainer>` as per CLAUDE.md layout standard.

---

## Sources

- `app/members/[id]/page.tsx` — current page implementation (lines 1–297)
- `lib/types.ts` — Profile interface (lines 14–71)
- `lib/dashboard/queries.ts` — All query function signatures and return types
- `lib/dashboard/profileCompletion.ts` — Completion scoring logic
- `app/dashboard/page.tsx` — Server-side data fetch pattern reference
- `app/dashboard/components/HorizontalCarousel.tsx` — Carousel component API
- `app/dashboard/components/EventCard.tsx` — EventCard component API
- `app/dashboard/components/FacultyCard.tsx` — FacultyCard component API
- `app/components/ConnectButton.tsx` — ConnectButton props and role-pair logic
- `app/components/ConnectionsSection.tsx` — Connections display (own-profile only limitation)
- `supabase/migrations/002_profile_fields.sql` — Early profile columns + schools table creation
- `supabase/migrations/20260326_extend_onboarding.sql` — Extended profile columns (social, location, role-specific)
- `supabase/migrations/20260376_school_owner_schema.sql` — school_faculty, school_designations, schools extensions, profiles.faculty_school_ids
- `.planning/PROJECT.md` — v1.18 milestone spec, v1.17 dashboard redesign context
