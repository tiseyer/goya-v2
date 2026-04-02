# Domain Pitfalls

**Domain:** Role-specific dashboards with carousels, profile completion scoring, and personalized content added to an existing Next.js 16 + Supabase platform
**Researched:** 2026-04-02
**Confidence:** HIGH (codebase inspection of actual `app/dashboard/page.tsx`, `supabase/migrations/`, and `app/components/` + verified external sources)

---

## Critical Pitfalls

### Pitfall 1: `overflow-x: hidden` on the Carousel Container Makes It Unscrollable

**What goes wrong:**
The instinct to hide the horizontal scrollbar is to add `overflow-x: hidden` to the carousel container. This does hide the scrollbar — but it also prevents any horizontal scrolling entirely. The carousel becomes a static display, not interactive. On mobile, swipe gestures produce no movement. On desktop, the overflow clips card edges visually but no scrolling is possible.

**Why it happens:**
Developers confuse "hide scrollbar visually" with "hide overflow." They are different operations. `overflow-x: hidden` disables the scroll entirely. Scrollbar visual hiding requires keeping `overflow-x: scroll` (or `overflow-x: auto`) and suppressing the scrollbar UI separately via `::-webkit-scrollbar { display: none }` + `scrollbar-width: none`.

**Consequences:**
Carousel is non-functional. Cards are clipped. On mobile, swipe does nothing.

**Prevention:**
Use the scrollbar-hiding pattern that preserves scroll functionality:

```css
/* On the carousel track element */
overflow-x: auto;
scrollbar-width: none;           /* Firefox */
-ms-overflow-style: none;        /* IE/Edge */
```
```css
/* With webkit pseudo-element (CSS-in-JS or global stylesheet) */
.carousel-track::-webkit-scrollbar {
  display: none;
}
```

In Tailwind CSS 4 with the `scrollbar-hide` plugin or utility this is: `overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]`. Never use `overflow-x-hidden` on a scroll container.

**Detection:**
Swipe left on the carousel in mobile viewport. If it does not scroll, the container has `overflow-x: hidden`.

**Phase to address:**
HorizontalCarousel component phase. Apply correct CSS from the first implementation — this is not a refinement, it is the fundamental requirement.

---

### Pitfall 2: Scroll Snap Without `scroll-snap-type` on the Container Does Nothing

**What goes wrong:**
Developers add `scroll-snap-align: start` (or Tailwind's `snap-start`) to each card but forget to add `scroll-snap-type: x mandatory` (or `snap-x snap-mandatory`) to the scroll container. Result: the carousel scrolls freely without snapping — it feels loose on mobile and does not land on a clean card boundary.

**Why it happens:**
Snap alignment is set on children (cards). Snap type must be set on the parent (scroll container). This split ownership is non-obvious.

**Consequences:**
Carousel scrolls but cards do not snap to clean positions. On mobile, a fast swipe often leaves the view between two cards.

**Prevention:**
The scroll container needs **both**:
- `scroll-snap-type: x mandatory` (Tailwind: `snap-x snap-mandatory`)
- `overflow-x: auto` (must be set; browsers ignore snap on non-scrolling containers)

Each card item needs:
- `scroll-snap-align: start` (Tailwind: `snap-start`)
- `flex-shrink: 0` (Tailwind: `shrink-0`) to prevent cards from collapsing

Also add `overscroll-behavior-x: contain` (Tailwind: `overscroll-x-contain`) to prevent the carousel scroll from bubbling to the page and triggering a browser back gesture.

**Detection:**
Swipe-scroll the carousel. If it doesn't land cleanly on a card boundary, snap-type is missing from the container.

**Phase to address:**
HorizontalCarousel component phase.

---

### Pitfall 3: Profile Completion Scores 100% Due to Empty String Fields

**What goes wrong:**
The existing `getCompletion()` function in the current dashboard uses the truthiness check `profile?.[f.key]`. In JavaScript, an empty string `""` is falsy — so this check works correctly for empty strings. However, some profile fields are pre-populated with empty strings by the registration trigger or onboarding flow rather than `NULL`. More critically, JSONB array fields (`practice_styles`, `teaching_styles_profile`, `teaching_focus`) default to `'[]'::jsonb` in the DB — an empty array serializes to `[]`, which is truthy in JavaScript. A user with no teaching styles set could score those fields as "complete."

The `full_name` field is also set to `coalesce(new.raw_user_meta_data->>'full_name', '')` in the auth trigger — users who sign up without providing a name get `full_name = ''`, which is falsy and scores correctly. But users who signed up via OAuth may get a placeholder name from the provider that satisfies the truthy check even though it's a provider-generated value the user never personally reviewed.

**Why it happens:**
DB-level defaults (`'[]'::jsonb`, `''`) diverge from semantic emptiness. A field being non-NULL does not mean the user has meaningfully filled it in.

**Consequences:**
Profile completion shows 70–80% for newly registered users who have not done anything, undermining the CTA to complete their profile. Trust in the metric is lost.

**Prevention:**
Adjust the completion check to account for semantic emptiness:

```typescript
function isFieldComplete(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return Boolean(value)
}
```

For JSONB array fields (e.g. `practice_styles`), parse the Supabase response and check `.length > 0`, not just truthiness.

**Detection:**
Register a new test account via email. The profile completion score should be close to 0% before the user fills anything in. If it shows 30%+, there are false positives.

**Phase to address:**
ProfileCompletionCard phase. Also audit the 6 chosen weighted fields before writing the scoring function — choose fields where DB-level defaults cannot inflate the score.

---

### Pitfall 4: Role Check in Layout Prevents Re-verification on Navigation

**What goes wrong:**
Doing the role-branching check (which dashboard layout to render — Student, Teacher, School, WP) inside the `/dashboard/layout.tsx` instead of `/dashboard/page.tsx` means the role is only read once when the layout first mounts. Due to Next.js App Router's partial rendering, layout server components do not re-run on client-side navigations within the same layout subtree. If an admin impersonates a different user (GOYA has an impersonation system), or if a user upgrades their role mid-session, the wrong layout stays rendered.

**Why it happens:**
Putting auth/role logic in layouts feels natural — it's "above" all content pages. But in Next.js 15+, the official guidance is explicit: "Be careful when doing checks in Layouts as these don't re-render on navigation. Auth checks should be done close to your data source."

**Consequences:**
Teacher who upgrades to School owner mid-session sees the Teacher layout until they hard-refresh. Admin impersonating a Student sees the Teacher layout if they were previously impersonating a Teacher.

**Prevention:**
Put role-branching logic in `page.tsx`, not `layout.tsx`. Read the user's profile in the page's Server Component fetch. Impersonation context resolves at the page level, not the layout level. Pattern:

```typescript
// app/dashboard/page.tsx (Server Component)
const profile = await getProfile(userId) // reads cookies/session fresh on every request
if (profile.role === 'teacher' && profile.principal_trainer_school_id) {
  return <SchoolDashboard profile={profile} ... />
}
if (profile.role === 'teacher') {
  return <TeacherDashboard profile={profile} ... />
}
```

**Detection:**
Admin impersonates a student, then navigates to `/dashboard`. Layout should reflect student role, not admin role. If it shows the admin/wrong layout, role check is in the layout.

**Phase to address:**
Dashboard page architecture phase (first phase of the build). This structural decision must be made before any role-specific layout components are written.

---

### Pitfall 5: N+1 Queries Across 4 Role Layouts Due to Per-Section Data Fetching

**What goes wrong:**
Each dashboard section (ProfileCompletionCard, StatHero, ConnectionsList, FacultyList, UpcomingEventsCarousel, RecommendedCoursesCarousel) fetches its own data independently. In a Server Component tree, if these are sequential `await` calls (not parallelised), each fetch blocks the next. A teacher dashboard with 6 sections that each make 1 Supabase call takes 6× the latency of a single batched query.

The current dashboard already exhibits this — it fetches `supabase.auth.getUser()` then `supabase.from('profiles').select('*')` sequentially in a `useEffect`, not in parallel.

**Why it happens:**
Component-level data fetching feels clean. Each component "owns" its data. But without `Promise.all()` or a single page-level fetch that passes data down as props, each component adds its own round-trip to the waterfall.

**Consequences:**
Dashboard TTFB increases linearly with the number of sections. On a slow connection, users see the page load progressively in sections, each appearing ~100–200ms apart.

**Prevention:**
Fetch all dashboard data in a single Server Component at the page level, using `Promise.all` for independent queries:

```typescript
// app/dashboard/page.tsx
const [profile, connections, upcomingEvents, courses] = await Promise.all([
  getProfile(userId),
  getConnections(userId),
  getUpcomingEvents({ limit: 6 }),
  getEnrolledCourses(userId, { limit: 6 }),
])
```

Pass data as props to layout components. Only use per-component data fetching for sections behind `<Suspense>` boundaries where streaming makes sense (e.g. a slow personalized recommendations section).

**Detection:**
Check the Vercel function logs or add timing instrumentation. If total server render time is 800ms+ for a dashboard with 4 independent sections, queries are sequential.

**Phase to address:**
Data fetching architecture phase. Establish the page-level parallel fetch pattern before building individual section components.

---

### Pitfall 6: Deleting the Existing Dashboard Code Breaks FeedView and Related Components

**What goes wrong:**
The existing `app/dashboard/page.tsx` imports `FeedView`, `PostComposer`, `FeedPostCard`, `PostActionsMenu`, and `CommentDeleteButton` — all of which live inside `app/dashboard/`. When the dashboard is rebuilt from scratch and these imports are removed from the page, the components themselves still exist as files. They are not dead until removed. If they are also imported anywhere else (other pages, tests), removing them without a grep audit will break those imports.

Additionally, `FeedView.tsx` uses `supabase` client-side with posts/likes/comments queries. If any of these tables are referenced elsewhere (admin panel, API routes), they are unrelated to the dashboard delete and must be preserved.

**Why it happens:**
"Delete existing dashboard UI" scoped to the page component. The co-located component files and their dependencies are not part of the same delete scope in the developer's mental model.

**Consequences:**
Build fails on next `vercel build` due to broken imports from non-dashboard pages that reference the deleted components.

**Prevention:**
Before deleting any file in `app/dashboard/`:
1. Run a codebase-wide grep for each component name: `FeedView`, `FeedPostCard`, `PostComposer`, `PostActionsMenu`, `CommentDeleteButton`.
2. If referenced only from `app/dashboard/page.tsx` → safe to delete with the page.
3. If referenced from other pages → extract to `app/components/` before deleting from `app/dashboard/`.
4. The feed database tables (`posts`, `likes`, `comments`) are referenced in the admin panel and potentially the REST API — those tables must not be dropped.

**Detection:**
`npx next build` after deletion. Any `Module not found` error reveals an orphaned import.

**Phase to address:**
Deletion/cleanup phase before new dashboard build begins. This is the first action — not the last.

---

## Moderate Pitfalls

### Pitfall 7: Apple/Netflix Aesthetic Becomes Bland Without Depth Cues

**What goes wrong:**
Apple and Netflix use massive whitespace effectively because their content (product photography, movie posters) provides visual density and hierarchy. A dashboard with text-only stat cards and minimal content becomes aesthetically empty — it reads as an unfinished wireframe rather than a refined interface.

**Why it happens:**
Developers apply "lots of whitespace, minimal color" without the image content that makes those designs work. The visual weight of a Netflix carousel comes from the poster art, not the surrounding chrome.

**Prevention:**
- Ensure every carousel card has an image (course thumbnails, event cover photos, member avatars). If data has no image, generate consistent color-coded initials avatars (as the existing dashboard already does for FOLLOWING_PLACEHOLDERS).
- Use typography contrast as the depth cue: a large bold number (stat hero value) next to a small subdued label creates hierarchy without adding color.
- Surface colors should not all be `bg-white` — use `bg-slate-50` for the page background and `bg-white` for cards so cards visually lift off the surface.
- Cards should have subtle `shadow-sm` and `border border-slate-100` to separate from the background. Removing all borders/shadows in the name of "minimalism" makes all sections merge into one flat layer.

**Detection:**
Screenshot the dashboard on a `bg-white` page background with `bg-white` cards and no images. If it looks like a skeleton loader, it needs depth cues.

**Phase to address:**
Visual design/card component phase. Establish the surface/card/shadow hierarchy in the base Card component before building all layouts.

---

### Pitfall 8: Horizontal Carousel on iOS Safari — Touch Momentum Scroll Triggers Page Back Navigation

**What goes wrong:**
On iOS Safari, a horizontal swipe near the left edge of the screen triggers the browser's "back" gesture (a system-level gesture, not scroll). When a carousel is positioned at the left edge of the viewport (full-width sections), users attempting to scroll the carousel left accidentally navigate away from the page.

Also, iOS 15+ has a bug where scrolling within an embedded element causes the browser toolbar to resize/jump, which shifts the viewport height mid-scroll.

**Why it happens:**
iOS Safari interprets horizontal swipe gestures at the viewport edge as navigation intent, competing with the carousel's scroll event.

**Prevention:**
- Add `overscroll-behavior-x: contain` to the carousel container. This tells the browser: horizontal scroll is "contained" to this element and should not propagate to browser-level navigation.
- Add `-webkit-overflow-scrolling: touch` for iOS momentum scrolling (still needed on older iOS).
- Carousel should have `touch-action: pan-x` so the browser knows this element handles horizontal gestures.
- For the iOS toolbar resize issue: use `dvh` (dynamic viewport height) instead of `100vh` in any section using full-height layouts.

**Detection:**
Test on a real iPhone (not Chrome DevTools device emulation). Swipe left hard from the left side of the carousel. If the browser navigates back, `overscroll-behavior-x: contain` is missing.

**Phase to address:**
HorizontalCarousel component phase. Test on iOS Safari before marking carousel complete.

---

### Pitfall 9: Profile Completion Score Changes Between Renders Due to Client-Side State

**What goes wrong:**
The existing dashboard calculates completion score on the client inside a `useEffect` after `setProfile(data)`. The score flickers: the page renders with 0% (before data loads), then snaps to the real percentage. If the new dashboard is a Server Component that calculates completion server-side and passes it as a prop, this flicker disappears — but if the ProfileCompletionCard is a Client Component that re-derives the score from local state, any state update (even unrelated) can trigger a re-render and a brief flash of an intermediate value.

**Why it happens:**
Computing derived state (the score) outside of `useMemo` or server-side in places where re-renders are frequent.

**Prevention:**
Calculate the profile completion score exactly once, server-side, when the page fetches the profile. Pass the computed `{ pct: number, missingFields: string[] }` as props to `ProfileCompletionCard`. Never re-derive the score in the client component. If the card needs to "update" after the user saves settings in another tab, that requires a full page refresh or a server action revalidation — not real-time client recalculation.

**Detection:**
Hard refresh the dashboard page. If the profile completion percentage visibly counts up from 0% to the real value, the calculation is happening client-side after data loads.

**Phase to address:**
ProfileCompletionCard phase. Decide server-vs-client derivation at the start.

---

### Pitfall 10: "School" Role Is Not a Separate `role` Value — Schools Are a Teacher Sub-State

**What goes wrong:**
PROJECT.md describes 4 dashboard layouts including a "School" layout. But in the GOYA schema, `profiles.role` has values: `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`. There is no `school` role. A teacher who owns a school is identified by `profiles.principal_trainer_school_id IS NOT NULL` (a FK to the schools table), not by a distinct role value.

If the dashboard role-branching code checks `profile.role === 'school'`, it will never match — the School dashboard will never render.

**Why it happens:**
Product language ("4 role-specific layouts including School") does not align with the DB schema language (`role = 'teacher'` + `principal_trainer_school_id IS NOT NULL`).

**Consequences:**
School owners always see the Teacher dashboard. The School-specific sections (FacultyList, school management CTA) never appear.

**Prevention:**
The branching condition for the School layout must be:

```typescript
const isSchoolOwner = profile.role === 'teacher' && 
                      Boolean(profile.principal_trainer_school_id)
```

Not `profile.role === 'school'`. Confirm this by checking `supabase/migrations/20260376_school_owner_schema.sql` for the actual column name used to link teachers to schools.

**Detection:**
Log in as a teacher with an approved school. Check `profile.role` — it will be `'teacher'`, not `'school'`. The School dashboard renders only when `principal_trainer_school_id` is also checked.

**Phase to address:**
Role branching architecture phase. Inspect the profiles schema before writing any role-gate condition.

---

### Pitfall 11: Carousel Cards Without `flex-shrink-0` Collapse to Zero Width

**What goes wrong:**
In a horizontal flexbox carousel (`display: flex`, `overflow-x: auto`), flex children try to fit within the container by default (`flex-shrink: 1`). Cards shrink to fill the available width instead of maintaining their designed fixed width. On a narrow mobile viewport, all cards in the carousel squeeze down to ~50px wide and become unreadable.

**Why it happens:**
Flexbox's default `flex-shrink: 1` behavior is not intuitive for carousels. Developers set a `w-64` or `min-w-[280px]` on cards and expect it to hold, not realising flex-shrink overrides min-width in some browser implementations.

**Prevention:**
Always set `shrink-0` (Tailwind) or `flex-shrink: 0` on carousel card items. Combine with explicit `w-[280px]` or `min-w-[280px]`. Test on 375px viewport (iPhone SE) — cards should have the designed width, not collapse.

**Detection:**
Resize the browser to 375px width. If carousel cards are narrower than intended, `shrink-0` is missing.

**Phase to address:**
HorizontalCarousel component phase.

---

## Minor Pitfalls

### Pitfall 12: Greeting Uses `full_name` Which Is Pre-Populated as Empty String

**What goes wrong:**
The current dashboard greeting: `profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'`. The `full_name` column is set to `''` (empty string) by the auth trigger for users who sign up without providing a name. An empty string is falsy in the `||` chain — so this correctly falls through to the email fallback. But the new dashboard may change this to a null-check pattern or rename the column, breaking the fallback.

**Prevention:**
Keep the defensive fallback chain: `full_name?.trim() || email?.split('@')[0] || 'there'`. Never assume `full_name` is NULL for new users — the trigger sets it to `''`.

**Phase to address:**
Dashboard greeting/header component phase.

---

### Pitfall 13: `select('*')` on Profiles Fetches Unused Columns for Personalization

**What goes wrong:**
The current dashboard fetches `supabase.from('profiles').select('*')`. The profiles table has 25+ columns after all the migrations (onboarding fields, school FK, WP registration fields, etc.). For the dashboard, only 6–10 are needed. `select('*')` transfers all columns over the wire unnecessarily and pulls potentially sensitive columns into client memory.

**Prevention:**
Use a named column select in all dashboard queries:
```typescript
.select('id, full_name, role, avatar_url, bio, principal_trainer_school_id, member_type')
```

This also makes TypeScript inference narrower and prevents accidental display of sensitive fields.

**Phase to address:**
Data fetching architecture phase.

---

### Pitfall 14: StatHero Weekly Profile Views Placeholder That Never Gets Replaced

**What goes wrong:**
PROJECT.md notes: "StatHero showing weekly profile views (placeholder until analytics)." Placeholder numbers in dashboards have a known pattern of shipping and then persisting through several milestones because the analytics system needed to populate them is always "next milestone." Users notice fake stats and lose trust in the platform.

**Prevention:**
Render the StatHero with explicit "Coming Soon" or "—" state rather than fake numbers. Use the existing `analytics_enabled` site setting (GOYA already has DB-controlled analytics toggles) to conditionally show the real stat when available. Design the component to gracefully show `null` data from the start.

**Phase to address:**
StatHero component phase. Never hardcode numeric placeholder values in a production feature.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| HorizontalCarousel component | `overflow-x: hidden` disabling scroll; missing snap-type on container; iOS back-gesture conflict | Apply correct CSS from the start; test on real iOS Safari before marking done |
| ProfileCompletionCard | JSONB `[]` arrays scoring as complete; empty string false negatives; client-side flicker | Semantic `isFieldComplete()` helper; compute score server-side; choose 6 fields where defaults cannot inflate score |
| Role branching (4 layouts) | `role === 'school'` never matches; role check in layout not page | Check `principal_trainer_school_id`; branch in `page.tsx` not `layout.tsx` |
| Data fetching (personalized content) | Sequential awaits → waterfall; `select('*')` → oversized response | `Promise.all` all independent queries at page level; named column selects |
| Deletion of existing dashboard | Orphaned imports from non-dashboard files; feed DB tables are used elsewhere | Grep all component names before delete; preserve table references; verify `next build` passes |
| Visual design (Apple/Netflix aesthetic) | All-white surfaces with no depth cues; placeholder stat numbers | Surface/card/shadow hierarchy; real or initials-avatar content in carousels; "—" for missing analytics |
| Carousel card items | Cards collapse to zero width on mobile | `shrink-0` + explicit `w-[N]` on all card items |
| Greeting / profile name | `full_name = ''` (not NULL) for new users | Defensive `trim() || fallback` chain, not a null check |

---

## "Looks Done But Isn't" Checklist

- [ ] **Carousel actually scrolls on mobile:** Open on iPhone. Swipe left on carousel. It should scroll and snap. Does not trigger browser back navigation.
- [ ] **Scrollbar hidden but scroll functional:** Carousel has no visible scrollbar. Swipe/mouse drag still scrolls. No `overflow-x: hidden` on the scroll container.
- [ ] **Profile completion accurate on new account:** Register new test account. Profile completion must show near 0% before any fields are filled in. JSONB array fields and empty string fields do not count as complete.
- [ ] **School owner sees School layout:** Log in as a teacher with `principal_trainer_school_id` set. Dashboard must render School layout, not Teacher layout. Confirm condition checks `principal_trainer_school_id`, not `role === 'school'`.
- [ ] **Role branch is in page.tsx:** Confirm `app/dashboard/page.tsx` does the role check, not `app/dashboard/layout.tsx`.
- [ ] **Old dashboard files cleanly deleted:** Run `npx next build`. Zero `Module not found` errors related to removed dashboard components.
- [ ] **Feed tables not dropped:** `posts`, `likes`, `comments` tables still exist and respond to queries from admin panel.
- [ ] **Parallel data fetching:** Add `console.time` around dashboard data fetch. Total time should be close to the slowest single query, not the sum of all queries.
- [ ] **StatHero shows "—" not fake numbers:** If analytics are not yet wired, StatHero displays a "Coming soon" or dash state, not a hardcoded number.
- [ ] **Cards have fixed width on 375px viewport:** Test on narrow mobile. Carousel cards maintain their designed `w-[N]` width and do not collapse.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| `overflow-x: hidden` shipped on carousel | LOW | One-line CSS fix; no data changes |
| Profile completion scoring inflated by JSONB defaults | LOW | Update scoring function; deploy; no DB migration needed |
| `role === 'school'` condition never matches — school owners see teacher layout | LOW | Fix condition to check `principal_trainer_school_id`; one deploy |
| Role check in layout causes stale role after impersonation switch | LOW | Move role check from layout to page; one deploy; no data changes |
| Feed component files deleted — build broken due to orphaned imports | MEDIUM | Git restore deleted files; extract to `app/components/`; delete originals |
| N+1 waterfall queries on dashboard load | MEDIUM | Refactor page-level fetch to `Promise.all`; may require extracting data-fetching logic from individual components |
| StatHero shipped with hardcoded placeholder numbers | LOW | Replace hardcoded values with `null` state; deploy; no DB changes |

---

## Sources

- Next.js: auth checks in layouts vs pages (partial rendering, don't re-run on navigation): https://nextjs.org/docs/app/guides/authentication
- Next.js: common App Router mistakes including layout auth checks: https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them
- CSS `overflow-x: hidden` makes container unscrollable (not the scrollbar-hiding pattern): https://blog.logrocket.com/hide-scrollbar-without-impacting-scrolling-css/
- CSS scroll snap: `scroll-snap-type` must be set on the container, not children: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Overflow/Carousels
- Tailwind CSS scroll snap utilities (`snap-x`, `snap-mandatory`, `snap-start`, `overscroll-x-contain`): https://tailwindcss.com/docs/scroll-snap-type
- `overscroll-behavior-x: contain` prevents iOS Safari back-navigation gesture conflict: https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari/
- iOS Safari scrollbar hidden while preserving scroll functionality (`-webkit-overflow-scrolling: touch`): https://nolanlawson.com/2019/02/10/building-a-modern-carousel-with-css-scroll-snap-smooth-scrolling-and-pinch-zoom/
- Supabase + Next.js parallel data fetching with `Promise.all` to avoid waterfall: https://nextjs.org/docs/app/getting-started/fetching-data
- Codebase inspection: `app/dashboard/page.tsx`, `supabase/migrations/001_profiles.sql`, `supabase/migrations/002_profile_fields.sql`, `supabase/migrations/20260376_school_owner_schema.sql`, `.planning/PROJECT.md`

---
*Pitfalls research for: GOYA v2 — v1.17 Dashboard Redesign (role-specific layouts, carousels, profile completion, personalized content on Next.js 16 + Supabase)*
*Researched: 2026-04-02*
