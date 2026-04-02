# Architecture Research

**Domain:** Dashboard redesign — role-specific layouts, server-side data fetching, carousel components
**Researched:** 2026-04-02
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## How the New Dashboard Integrates With the Existing Architecture

This document maps every integration point between the new v1.17 dashboard and the existing codebase: what gets deleted, what gets modified, what is new, and the order in which pieces must be built.

---

## System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router                                                 │
│                                                                        │
│  app/dashboard/                                                        │
│  ├── page.tsx             REPLACE: server component, role-branch       │
│  ├── FeedView.tsx         DELETE: no community feed in new design      │
│  ├── FeedPostCard.tsx     DELETE                                       │
│  ├── PostComposer.tsx     DELETE                                       │
│  ├── PostActionsMenu.tsx  DELETE                                       │
│  ├── CommentDeleteButton.tsx DELETE                                    │
│  └── components/          NEW directory                                │
│      ├── DashboardStudent.tsx   NEW: student layout                    │
│      ├── DashboardTeacher.tsx   NEW: teacher layout                    │
│      ├── DashboardSchool.tsx    NEW: school owner layout               │
│      ├── DashboardWellness.tsx  NEW: wellness practitioner layout      │
│      ├── HorizontalCarousel.tsx NEW: reusable snap-x carousel          │
│      ├── TeacherCard.tsx        NEW: teacher profile card for carousel │
│      ├── CourseCard.tsx         NEW: course card for carousel          │
│      ├── EventCard.tsx          NEW: event card for carousel           │
│      ├── ProfileCompletionCard.tsx NEW: checklist + progress bar       │
│      └── StatHero.tsx           NEW: weekly profile views hero         │
└────────────────────────────┬───────────────────────────────────────────┘
                             │ Supabase server client
┌────────────────────────────▼───────────────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)                                           │
│                                                                        │
│  profiles          READ: full_name, avatar_url, role, bio,            │
│                          location, website, instagram, youtube,        │
│                          username, teaching_styles,                    │
│                          principal_trainer_school_id                   │
│  courses           READ: published courses for carousels               │
│  events            READ: upcoming published events for carousels       │
│  connections       READ: accepted connections for lists                │
│  credit_entries    READ: approved credits for stat heroes              │
│  user_course_progress READ: in-progress courses                        │
│  schools           READ: school name/slug for school owner greeting    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## What Gets Deleted

The entire `app/dashboard/` directory except `page.tsx` is community-feed infrastructure that has no place in the new design.

| File | Why Deleted |
|------|------------|
| `FeedView.tsx` | Community feed is removed entirely per v1.17 spec |
| `FeedPostCard.tsx` | Feed post rendering, no longer needed |
| `PostComposer.tsx` | Feed post creation, no longer needed |
| `PostActionsMenu.tsx` | Feed post actions, no longer needed |
| `CommentDeleteButton.tsx` | Feed comment management, no longer needed |

`page.tsx` is completely rewritten, not modified. The only value it contributes is the `COMPLETION_FIELDS` constant (8 fields) and the `getCompletion()` function, which are superseded by the new 6-field weighted scoring.

---

## The Core Architectural Shift

**Before (current):** `app/dashboard/page.tsx` is `'use client'`. It fetches the authenticated user and profile via `supabase.auth.getUser()` in a `useEffect`, stores state locally, and renders a 3-column layout with a community feed in the center column. Data for events, connections, and recently active members is all hardcoded placeholder data.

**After (new):** `app/dashboard/page.tsx` becomes an `async` Server Component (no `'use client'`). It uses `getEffectiveUserId()` and `getEffectiveClient()` — the existing impersonation-aware helpers — to authenticate and fetch the user profile server-side. Based on `profile.role`, it renders one of four role-specific layout components, passing fully-loaded data as props. The role layouts are `'use client'` only where they need interactivity (carousel drag/swipe); the static sections are Server Components.

This follows the exact pattern established in `app/settings/layout.tsx`:

```typescript
// app/settings/layout.tsx (reference pattern)
export default async function SettingsLayout({ children }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return <SettingsShell userRole={profile?.role}>{children}</SettingsShell>;
}
```

The new `app/dashboard/page.tsx` is the same pattern but also fetches role-specific content before branching.

---

## Impersonation Compatibility

The current dashboard already handles impersonation by checking `ImpersonationContext` and calling `/api/me` when impersonating. This is the **wrong pattern** — it uses a client-side context to conditionally fetch from an API route.

The new server component must use `getEffectiveUserId()` and `getEffectiveClient()` from `lib/supabase/getEffectiveUserId.ts`. These already handle impersonation correctly server-side:

```typescript
// lib/supabase/getEffectiveUserId.ts — ALREADY EXISTS, USE AS-IS
export async function getEffectiveUserId(): Promise<string>
export async function getEffectiveClient(): Promise<SupabaseClient>
```

`getEffectiveClient()` returns the service client (bypasses RLS) when the impersonation cookie is present, or the normal server client otherwise. No changes needed to this file.

---

## Data Flow: Server-Side Fetching

### page.tsx: What Gets Fetched at the Top Level

All fetches happen in `app/dashboard/page.tsx` before role branching. The result is passed as props to the role layout component. This avoids duplicate fetches and keeps the role components as presentational.

```typescript
// app/dashboard/page.tsx (new, pseudocode)
export default async function DashboardPage() {
  const userId = await getEffectiveUserId()      // handles impersonation
  const supabase = await getEffectiveClient()    // handles impersonation

  // Core: profile (always needed)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url, role, bio, location,
             website, instagram, youtube, teaching_styles,
             principal_trainer_school_id')
    .eq('id', userId)
    .single()

  if (!profile) redirect('/sign-in')

  // Role-branch data (fetch all in parallel with Promise.all)
  const [courses, events, connections, creditTotals] = await Promise.all([
    fetchUpcomingCourses(supabase),
    fetchUpcomingEvents(supabase),
    fetchAcceptedConnections(supabase, userId),
    getUserCreditTotals(userId, supabase),     // lib/credits.ts — already exists
  ])

  // School data (teachers/school owners only)
  let school = null
  if (profile.role === 'teacher' || profile.role === 'admin') {
    if (profile.principal_trainer_school_id) {
      const { data } = await supabase
        .from('schools')
        .select('id, name, slug')
        .eq('id', profile.principal_trainer_school_id)
        .single()
      school = data
    }
  }

  // Branch to role layout
  switch (profile.role) {
    case 'teacher':
      return <DashboardTeacher profile={profile} courses={courses}
               events={events} connections={connections}
               creditTotals={creditTotals} school={school} />
    case 'wellness_practitioner':
      return <DashboardWellness ... />
    case 'student':
    default:
      return <DashboardStudent ... />
  }
}
```

### Data Fetch Functions (New, in lib/dashboard/)

These are thin query functions, `'server-only'`, following the pattern of `lib/supabase/queries.ts` (subscriptions) and `lib/credits.ts`.

**`lib/dashboard/queries.ts`** (NEW FILE):

```typescript
// Upcoming published events — capped at 8 for carousels
export async function fetchUpcomingEvents(supabase, limit = 8)

// Published courses — most recent, capped at 8
export async function fetchRecentCourses(supabase, limit = 8)

// Accepted connections for current user, with profile data joined
export async function fetchAcceptedConnections(supabase, userId, limit = 12)

// Faculty members for a school (teachers/school dashboard)
export async function fetchSchoolFaculty(supabase, schoolId, limit = 8)

// In-progress courses for current user
export async function fetchUserInProgressCourses(supabase, userId, limit = 4)
```

`getUserCreditTotals()` is already in `lib/credits.ts`. Import and reuse it directly — no duplicate.

### Profile Completion Scoring

The current dashboard has 8 fields, all weighted equally. The new spec calls for **6 weighted fields**. This is a pure computation function — no DB query.

```typescript
// lib/dashboard/profileCompletion.ts (NEW FILE)
const WEIGHTED_FIELDS = [
  { key: 'avatar_url',    weight: 25, label: 'Profile photo',  href: '/settings' },
  { key: 'bio',           weight: 20, label: 'Bio',            href: '/settings' },
  { key: 'full_name',     weight: 20, label: 'Full name',      href: '/settings' },
  { key: 'location',      weight: 15, label: 'Location',       href: '/settings' },
  { key: 'teaching_styles', weight: 10, label: 'Teaching styles', href: '/settings' },
  { key: 'instagram',     weight: 10, label: 'Instagram',      href: '/settings' },
]

export function getProfileCompletion(profile: ProfileData): {
  score: number        // 0–100
  missing: { key, label, href }[]
  complete: string[]
}
```

This replaces the current `getCompletion()` function in `page.tsx`.

---

## Component Boundaries: New vs Modified

### REPLACED: app/dashboard/page.tsx

**From:** `'use client'`, 3-column feed layout, placeholder data, client-side auth.
**To:** `async` server component, role-branch, server-side data fetch, impersonation-aware.

No `'use client'` directive. No `useState`. No `useEffect`. No `supabase.auth.getUser()` in the browser.

### NEW: app/dashboard/components/HorizontalCarousel.tsx

`'use client'` — needs touch events and scroll state.

The codebase has no existing carousel component. The design spec calls for Netflix/Apple-style snap-x scrolling. The right approach for this codebase (Tailwind CSS 4, no component library) is native CSS scroll snap:

```typescript
// HorizontalCarousel.tsx
'use client'

export function HorizontalCarousel({ title, href, children }) {
  return (
    <section>
      <header>
        <h2>{title}</h2>
        <Link href={href}>Show all →</Link>
      </header>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory
                      scrollbar-none pb-2 -mx-4 px-4">
        {children}
      </div>
    </section>
  )
}
```

Each child (TeacherCard, CourseCard, EventCard) applies `snap-start shrink-0` and a fixed width (`w-56 sm:w-64`).

**No npm install needed.** This is pure Tailwind. `scrollbar-none` is a Tailwind utility (available in v4).

### NEW: Card Components

All three cards are server-renderable (no interactivity). They accept plain data objects as props.

```
TeacherCard  — avatar, name, role badge, location, designation tags
CourseCard   — thumbnail (gradient), title, instructor, duration, category color
EventCard    — date pill, title, location/format badge, price
```

These are `function` components in `app/dashboard/components/`, no `'use client'` directive. They can receive serialized props from the Server Component parent.

### NEW: ProfileCompletionCard.tsx

`'use client'` — needs animated progress bar (CSS transition on width).

Receives `{ score, missing, complete }` from the server component as a serializable prop. Renders:
- Circular SVG progress (same pattern as current `page.tsx`)
- Checklist of remaining fields with deep links to `/settings`
- "Edit Profile" button

### NEW: StatHero.tsx

Server Component (no interactivity). Receives `creditTotals: CreditTotals` from page.tsx. Displays CE Hours, Community, Karma, Practice as stat tiles. Replaces the current placeholder "Membership Activity" widget with real data from `credit_entries` via `getUserCreditTotals()`.

Weekly profile views stat is a **placeholder** (displays "—") until analytics is wired. Do not block the milestone on this.

### NEW: Role Layout Components

Each role layout is a thin **presentational** component. It receives fully-fetched data as props and composes the carousel, stat hero, and list sections into a layout specific to that role.

| Component | Role | Unique Sections |
|-----------|------|-----------------|
| `DashboardStudent.tsx` | student | Courses carousel, Events carousel, Connections list, Profile Completion |
| `DashboardTeacher.tsx` | teacher | Connections list (peer/mentorship), Courses carousel, Events carousel, Faculty list, School CTA (if no school) |
| `DashboardSchool.tsx` | teacher + school | Faculty carousel, Courses carousel, Events carousel, School stats |
| `DashboardWellness.tsx` | wellness_practitioner | Events carousel, Courses carousel, Connections list, Profile Completion |

`DashboardSchool.tsx` is rendered when `profile.role === 'teacher'` AND `profile.principal_trainer_school_id !== null`. The teacher without a school gets `DashboardTeacher.tsx` with the School Registration CTA.

All four layout components should be `'use client'` to allow carousel interactivity. They receive props only from the server page — no internal data fetching.

---

## Integration Points With Existing Code

| Existing System | How v1.17 Touches It | Risk |
|----------------|----------------------|------|
| `lib/credits.ts` → `getUserCreditTotals()` | Called directly in `page.tsx`. No changes to the function. | NONE |
| `lib/supabase/getEffectiveUserId.ts` | `getEffectiveUserId()` and `getEffectiveClient()` are the auth entry point. No changes. | NONE |
| `lib/supabaseServer.ts` → `createSupabaseServerClient()` | Used inside `getEffectiveClient()`. No changes. | NONE |
| `app/components/ui/PageContainer.tsx` | New dashboard must wrap all content sections with `<PageContainer>` per CLAUDE.md standard. Already correct pattern — just import and use. | NONE |
| `ImpersonationContext` | **No longer used in dashboard.** The server component replaces the client-side impersonation check. The context still exists for other pages. | LOW — remove import from dashboard, don't delete context |
| `app/components/SchoolRegistrationCTA.tsx` | Already renders in the current sidebar for teachers without a school. Reused in `DashboardTeacher.tsx`. No changes to the component. | NONE |
| `lib/types.ts` → `Course`, `Event` types | Carousel cards need `id`, `title`, `status`, `created_at` from courses; `id`, `title`, `date`, `location`, `is_online` from events. Already typed. | NONE |
| `connections` table | `fetchAcceptedConnections()` queries `connections` joined with `profiles`. Same join pattern used in `ConnectionsContext.tsx`. | NONE |
| `credit_entries` table | Queried via existing `getUserCreditTotals()`. RLS allows users to read own entries. | NONE |
| `schools` table | Dashboard reads `name`, `slug` for the school greeting. RLS: school is readable by its owner and faculty members. | LOW — verify RLS allows owner read without service client |

---

## File Structure: What Gets Added and Removed

```
app/dashboard/
├── page.tsx                         REPLACE — async server component
├── FeedView.tsx                     DELETE
├── FeedPostCard.tsx                 DELETE
├── PostComposer.tsx                 DELETE
├── PostActionsMenu.tsx              DELETE
├── CommentDeleteButton.tsx          DELETE
└── components/                      NEW directory
    ├── DashboardStudent.tsx         NEW
    ├── DashboardTeacher.tsx         NEW
    ├── DashboardSchool.tsx          NEW
    ├── DashboardWellness.tsx        NEW
    ├── HorizontalCarousel.tsx       NEW
    ├── TeacherCard.tsx              NEW
    ├── CourseCard.tsx               NEW
    ├── EventCard.tsx                NEW
    ├── ProfileCompletionCard.tsx    NEW
    └── StatHero.tsx                 NEW

lib/dashboard/                       NEW directory
├── queries.ts                       NEW — server-only data fetch functions
└── profileCompletion.ts             NEW — pure computation, profile scoring
```

No migrations required. No schema changes. All data already exists in Supabase.

---

## Build Order

Dependencies are strict: the server page cannot be written before the data-fetch helpers, and the role layouts cannot be written before the card components they compose.

| Step | Work | Depends On | Blocks |
|------|------|-----------|--------|
| 1 | `lib/dashboard/profileCompletion.ts` — weighted scoring function | — | 6, 7, 8, 9 |
| 2 | `lib/dashboard/queries.ts` — 5 server-only fetch functions | — | 3 |
| 3 | `app/dashboard/page.tsx` — async server component, role branch | 2 | 6, 7, 8, 9 |
| 4 | `HorizontalCarousel.tsx` — snap-x scroll container | — | 6, 7, 8, 9 |
| 5 | `TeacherCard.tsx`, `CourseCard.tsx`, `EventCard.tsx` — presentational cards | — | 6, 7, 8, 9 |
| 6 | `DashboardStudent.tsx` — student layout | 1, 3, 4, 5 | — |
| 7 | `DashboardTeacher.tsx` — teacher layout | 1, 3, 4, 5 | — |
| 8 | `DashboardSchool.tsx` — school owner layout | 1, 3, 4, 5 | — |
| 9 | `DashboardWellness.tsx` — wellness layout | 1, 3, 4, 5 | — |
| 10 | `ProfileCompletionCard.tsx` | 1 | — |
| 11 | `StatHero.tsx` | — | — |
| 12 | Delete feed files | 3 (once page.tsx no longer imports them) | — |

Steps 1 and 2 are pure TypeScript with no UI. Steps 4 and 5 are small isolated components. Steps 6–9 can be built in any order once their deps are done. Step 12 is the final cleanup.

**Recommended implementation order:** 1 → 2 → 3 (with stubs for role components) → 4 → 5 → 10 → 11 → 6 → 7 → 8 → 9 → 12.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Keeping the dashboard as a client component

**What people do:** Add `'use client'` to `page.tsx` and keep `useEffect` data fetching because the current code does it.
**Why it's wrong:** Client-side fetching means layout shift, loading spinners, and SEO gap. The server component pattern is established in `app/settings/layout.tsx`, `app/schools/[slug]/page.tsx`, and multiple admin pages.
**Do this instead:** Async server component. Auth via `getEffectiveUserId()`. Data via `await` queries. Pass serializable props to client components.

### Anti-Pattern 2: Fetching data inside role layout components

**What people do:** Each role layout (`DashboardTeacher.tsx`, etc.) fetches its own data via `useEffect` or `getEffectiveUserId()`.
**Why it's wrong:** N separate client-side waterfall fetches. Role layouts cannot easily be server components because they include `HorizontalCarousel` which needs `'use client'`.
**Do this instead:** All fetching happens once in the server `page.tsx`. Role layouts receive complete data as props. They are purely presentational.

### Anti-Pattern 3: Using a third-party carousel library

**What people do:** Install `react-slick`, `embla-carousel`, or `keen-slider` for carousel functionality.
**Why it's wrong:** Adds a dependency, increases bundle size, and introduces a version-pinning maintenance burden (see `Recharts 3.8.0` pinning in PROJECT.md as an example). The existing codebase uses no React UI component library.
**Do this instead:** CSS scroll snap via Tailwind. `overflow-x-auto snap-x snap-mandatory` on the container, `snap-start shrink-0` on each card. This is native-browser scroll behavior — smooth on iOS, keyboard-accessible, zero JS.

### Anti-Pattern 4: Inline role-specific JSX in page.tsx

**What people do:** Write all four role layouts as if/else branches directly inside `page.tsx`.
**Why it's wrong:** `page.tsx` becomes a 500+ line file. Role-specific UI cannot be modified without touching the root page file.
**Do this instead:** `page.tsx` handles auth, data fetching, and role branching. Each role gets its own named component file. `page.tsx` stays under 80 lines.

### Anti-Pattern 5: Fetching all published teachers for the carousel from profiles

**What people do:** `SELECT * FROM profiles WHERE role = 'teacher' LIMIT 8` — returns potentially inactive or incomplete profiles.
**Why it's wrong:** Teachers without avatars, bios, or public profiles will show as empty cards. The carousel looks broken.
**Do this instead:** Filter to `WHERE avatar_url IS NOT NULL AND bio IS NOT NULL AND role = 'teacher'`, ordered by some engagement signal (e.g., `connections count`, or `created_at DESC` as a fallback). The query can be tightened over time as real data accumulates.

---

## Scaling Considerations

None of these are concerns at GOYA's current user count. Documented for reference.

| Concern | At Current Scale | If Needed |
|---------|-----------------|-----------|
| Dashboard query time | 5–6 parallel Supabase queries, each indexed and low-cardinality | Combine into a single RPC function |
| Connections list query | `OR (requester_id = $uid OR recipient_id = $uid)` — needs compound index on both columns | Index already exists from v1.1 migration |
| Credit totals | Full scan of `credit_entries` per user on each dashboard load | Cache via Next.js `unstable_cache` keyed by userId |

---

## Sources

- `app/dashboard/page.tsx` — current dashboard (inspected directly)
- `app/settings/layout.tsx` — reference pattern for server component auth + role fetch
- `app/schools/[slug]/page.tsx` — reference pattern for `getSupabaseService()` in server component
- `lib/supabase/getEffectiveUserId.ts` — impersonation-aware auth helpers
- `lib/supabaseServer.ts` — server client factory
- `lib/credits.ts` — `getUserCreditTotals()`, `CreditTotals` type
- `app/settings/subscriptions/queries.ts` — reference for `'server-only'` query file pattern
- `app/settings/my-events/actions.ts` — reference for `'use server'` Server Action pattern
- `app/context/ConnectionsContext.tsx` — connections table shape, join pattern
- `app/components/ui/PageContainer.tsx` — required width wrapper
- `app/components/SchoolRegistrationCTA.tsx` — reusable school CTA component
- `.planning/PROJECT.md` — v1.17 feature spec, role definitions

---
*Architecture research for: GOYA v2 v1.17 Dashboard Redesign*
*Researched: 2026-04-02*
