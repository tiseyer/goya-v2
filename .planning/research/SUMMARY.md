# Project Research Summary

**Project:** GOYA v2 — v1.17 Dashboard Redesign
**Domain:** Role-specific community platform dashboard (yoga/wellness professional network)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

The v1.17 dashboard redesign is a pure UI orchestration milestone — replacing a client-side community feed with a role-specific, Netflix/Apple-style layout built on top of existing data tables. All underlying data (profiles, courses, events, connections, schools, credits) is already in Supabase. No schema migrations are required. The only new npm dependency is `embla-carousel-react` (~6 KB gzipped), added for desktop mouse-drag-to-scroll on carousels; native CSS scroll snap handles mobile touch natively. The fundamental architectural shift is converting `app/dashboard/page.tsx` from a `'use client'` component with `useEffect` fetching into an `async` Server Component that fetches all data in parallel via `Promise.all` and passes it to presentational role-layout components. The exact same pattern already exists in `app/settings/layout.tsx` and multiple admin pages.

The recommended build order is strict and dependency-driven: data utilities first (`lib/dashboard/queries.ts`, `lib/dashboard/profileCompletion.ts`), then the new server page with role branching, then shared carousel and card infrastructure, then the four role layout components, and finally cleanup of the old feed files. Role branching logic must live in `page.tsx`, not `layout.tsx`, because Next.js App Router layouts do not re-run on client-side navigation — putting the check in the layout breaks the existing impersonation system. The impersonation-aware helpers `getEffectiveUserId()` and `getEffectiveClient()` already exist and handle this correctly at the page level.

The two highest-risk issues are CSS-level: using `overflow-x: hidden` instead of scrollbar-hiding CSS (silently breaks carousel scroll), and semantic correctness in the profile completion scorer (JSONB empty arrays `[]` are truthy in JavaScript and will inflate scores for blank profiles). Both are fast to fix once diagnosed but produce invisible bugs — a carousel that looks built but cannot scroll, or a completion card showing 60% for a new account that has filled in nothing. Both must be validated against a real test account before the milestone is marked done. A third structural risk: there is no `school` role in the database — school owners have `role = 'teacher'` plus `principal_trainer_school_id IS NOT NULL`. Any role-branch condition that checks `role === 'school'` will silently never match.

---

## Key Findings

### Recommended Stack

The existing stack (Next.js 16, Tailwind CSS 4, Supabase, framer-motion, lucide-react) handles all milestone requirements. One new package is added: `embla-carousel-react ^8.6.0` for desktop mouse-drag-to-scroll on carousels. Do NOT install `tailwind-scrollbar-hide`; it has a confirmed open bug under Tailwind CSS 4's `@import "tailwindcss"` model (GitHub issue #31). Instead, add a single `@utility no-scrollbar` block to `globals.css`. The animated number counters on stat heroes (originally listed as a milestone goal) are classified as an anti-feature — users scan KPIs and do not benefit from watching numbers count up. Static rendering is preferred.

**Core technologies (new or decision-specific):**
- `embla-carousel-react ^8.6.0`: Desktop drag-to-scroll on carousels — lightest option (~6 KB), SSR-safe, no framer-motion conflict. Install: `npm install embla-carousel-react`.
- `@utility no-scrollbar` in globals.css: Scrollbar hiding — replaces broken `tailwind-scrollbar-hide` plugin under Tailwind CSS 4.
- Tailwind CSS 4 scroll snap (`snap-x snap-mandatory`, `snap-start`, `shrink-0`, `overscroll-x-contain`): Carousel track — zero JS, keyboard-accessible, native iOS momentum scroll.
- Pure TypeScript in `lib/dashboard/`: Profile completion scoring and data fetch functions — no library needed; stateless, server-only.

See `.planning/research/STACK.md` for full integration code, Tailwind class reference, and alternatives rejected.

### Expected Features

**Must have (table stakes):**
- Role-specific greeting with first name and time-of-day — anonymous dashboards feel cold; every professional SaaS personalizes this
- Profile completion card with 6-field weighted progress bar (0–100%) and deep links to exact settings fields — visible progress prompt drives 40% of profile completions
- Role-aware stat heroes (2–4 KPIs per role) — headline numbers are expected; placeholder "—" is correct for untracked stats; "0 profile views" punishes new users
- Horizontal content carousels with snap-x mobile and mouse-drag desktop — the defining visual of the Apple/Netflix aesthetic milestone goal
- Empty state handling per carousel with CTA — new members have no content; blank carousels feel broken
- Primary CTA per role derived from profile completeness and activity state — single next action outperforms a menu of choices
- Full deletion of existing community feed UI (FeedView, PostComposer, FeedPostCard, etc.)

**Should have (differentiators):**
- ConnectionsList panel for Teacher/WP (5 most recent accepted connections, avatar + name + role badge)
- FacultyList panel for school-owner Teacher (faculty roster with invite action)
- School-aware Teacher layout (augmented Teacher layout, not a separate role)
- Skeleton loading states on carousels (3–4 placeholder cards matching card dimensions)
- Surface/card/shadow hierarchy (`bg-slate-50` page, `bg-white` cards, `shadow-sm border border-slate-100`) — Apple/Netflix aesthetic requires depth cues; all-white flat layout reads as unfinished

**Defer to v2+:**
- Real-time profile view analytics (requires new `analytics_events` table and instrumentation — separate milestone)
- "Suggested connections" algorithm (requires collaborative filtering — separate data science milestone)
- Notification surface on dashboard (inbox at `/settings/inbox` already handles this; avoid two sources of truth)
- CPD credits stat hero (credits table exists but aggregation by type is scoped to a dedicated CPD milestone)
- Drag-and-drop dashboard layout customization (Apple/Netflix aesthetic is fixed layout; over-engineering for current scale)

See `.planning/research/FEATURES.md` for role-by-role feature breakdowns, card type specifications, and full dependency map.

### Architecture Approach

The core of this milestone is converting `app/dashboard/page.tsx` from `'use client'` with client-side `useEffect` auth/data-fetching into an `async` Server Component that authenticates via `getEffectiveUserId()`, fetches all role-relevant data in a single `Promise.all`, then branches to one of four presentational role layout components (`DashboardStudent`, `DashboardTeacher`, `DashboardSchool`, `DashboardWellness`). Role layouts are `'use client'` only for carousel interactivity; they receive all data as props and do no internal fetching. Five existing files in `app/dashboard/` are deleted (the feed component files) after a codebase-wide import audit verifies no other pages reference them.

**Major components:**
1. `lib/dashboard/queries.ts` (NEW) — server-only fetch functions: `fetchUpcomingEvents`, `fetchRecentCourses`, `fetchAcceptedConnections`, `fetchSchoolFaculty`, `fetchUserInProgressCourses`
2. `lib/dashboard/profileCompletion.ts` (NEW) — pure TypeScript 6-field weighted scorer with semantic `isFieldComplete()` guard (handles JSONB `[]` arrays correctly)
3. `app/dashboard/page.tsx` (REPLACE) — async Server Component: `getEffectiveUserId()` auth, `Promise.all` parallel fetch, role branch including `principal_trainer_school_id` check
4. `HorizontalCarousel.tsx` (NEW) — `'use client'`, snap-x container, `no-scrollbar`, empty state, skeleton loading
5. `ProfileCompletionCard.tsx` (NEW) — `'use client'`, animated progress bar; score received as pre-computed prop from server (no client re-derivation)
6. `StatHero.tsx` (NEW) — Server Component; 2–4 KPI tiles per role; explicit "—" state for untracked stats
7. Five card components (NEW): `TeacherCard`, `CourseCard`, `EventCard`, `ConnectionCard`, `FacultyCard` — Server Components, no interactivity
8. Four role layout components (NEW): `DashboardStudent`, `DashboardTeacher`, `DashboardSchool`, `DashboardWellness` — `'use client'` presentational containers, no data fetching
9. Feed files (DELETE): `FeedView.tsx`, `FeedPostCard.tsx`, `PostComposer.tsx`, `PostActionsMenu.tsx`, `CommentDeleteButton.tsx` — after import audit

See `.planning/research/ARCHITECTURE.md` for full data flow pseudocode, component boundaries, file structure, and build order table.

### Critical Pitfalls

Six critical and five moderate pitfalls were identified. The top five:

1. **`overflow-x: hidden` disabling carousel scroll** — Use `overflow-x: auto` + `scrollbar-width: none` + `no-scrollbar` CSS utility. Never use `overflow-x: hidden` on a scroll container. Test: swipe left on mobile; if nothing moves, the container CSS is wrong.

2. **Profile completion inflated by JSONB empty arrays** — `teaching_styles` and similar JSONB array fields default to `[]` in the DB, which is truthy in JavaScript. Use a semantic `isFieldComplete()` helper: `Array.isArray(v) ? v.length > 0 : Boolean(v?.trim())`. Validate: register a fresh test account and confirm score shows ~0% before any fields are filled.

3. **`role === 'school'` never matches** — No `school` role exists in the DB. School owners have `role = 'teacher'` plus `principal_trainer_school_id IS NOT NULL`. The branch condition must check both. Confirm the exact column name in `supabase/migrations/20260376_school_owner_schema.sql`.

4. **Role branching in `layout.tsx` breaks impersonation** — Next.js App Router layouts do not re-run on client-side navigation. Role checks in the layout return stale state after impersonation switches or mid-session role changes. All role branching must be in `page.tsx`.

5. **Deleting feed files before import audit breaks build** — `FeedView`, `PostComposer`, and related components may be imported by pages outside `app/dashboard/`. Grep all component names before deletion. Run `npx next build` after. Feed DB tables (`posts`, `likes`, `comments`) are used by the admin panel — do not drop the tables, only the UI files.

See `.planning/research/PITFALLS.md` for full detail including iOS Safari back-gesture pitfall, sequential waterfall query pitfall, card `shrink-0` collapse pitfall, and the complete "Looks Done But Isn't" verification checklist.

---

## Implications for Roadmap

Based on the dependency graph in ARCHITECTURE.md and pitfall timing in PITFALLS.md, six phases are recommended. Phases 1–3 are infrastructure; Phases 4–5 are component builds; Phase 6 assembles the final layouts. This order cannot be reversed.

### Phase 1: Codebase Audit and Feed Cleanup

**Rationale:** Must happen before any new files are written. Orphaned imports from non-dashboard pages will break `next build` if the feed files are deleted without a prior grep audit. Feed DB tables (`posts`, `likes`, `comments`) are referenced in the admin panel and must not be dropped. Establishing a clean `app/dashboard/` baseline (only `page.tsx` remaining) prevents file conflicts during subsequent phases.
**Delivers:** `app/dashboard/` reduced to `page.tsx` stub only; zero feed component references remaining in codebase; `npx next build` passing with no `Module not found` errors.
**Avoids:** Pitfall 6 (build-breaking orphaned imports from deleted feed components).

### Phase 2: Data Infrastructure

**Rationale:** `lib/dashboard/queries.ts` and `lib/dashboard/profileCompletion.ts` are pure TypeScript with no UI dependencies. They block all downstream work — no role layout can be built without them. Building them first forces explicit decisions about column selects (avoiding `select('*')` oversizing) and the semantic completeness checker (avoiding JSONB false positives). The `getUserCreditTotals()` function already exists in `lib/credits.ts` and is imported, not duplicated.
**Delivers:** `lib/dashboard/queries.ts` (5 server-only fetch functions), `lib/dashboard/profileCompletion.ts` (6-field weighted scorer with `isFieldComplete()` guard)
**Uses:** Existing `getEffectiveUserId()`, `getEffectiveClient()`, `lib/credits.ts`
**Avoids:** Pitfall 3 (JSONB false-positive scoring), Pitfall 5 (sequential waterfall from per-component fetching), Pitfall 13 (`select('*')` oversized response)

### Phase 3: Server Page and Role Branch

**Rationale:** Once data functions exist, `page.tsx` can be rewritten as an async Server Component with `Promise.all` parallel fetching and the four-way role branch including the school owner `principal_trainer_school_id` detection. Role layouts are stubbed as empty placeholders at this stage. The goal is a working, testable server route that proves auth, impersonation, and role routing all function correctly before any layout UI is built.
**Delivers:** `app/dashboard/page.tsx` as async Server Component; working role branch with school detection; impersonation-aware auth; parallel data fetch with `Promise.all`
**Avoids:** Pitfall 4 (role check in layout not page), Pitfall 10 (`role === 'school'` never matches), Pitfall 5 (waterfall queries)

### Phase 4: Shared Component Infrastructure

**Rationale:** `HorizontalCarousel.tsx` and the five card components are used by all four role layouts. They must exist before any role layout can be fully implemented. Isolating them in a dedicated phase enables focused CSS testing — snap behaviour, iOS Safari back-gesture, card width collapse on narrow viewports — before they are composed into four separate layouts. This phase is also where `embla-carousel-react` is installed.
**Delivers:** `HorizontalCarousel.tsx` (snap-x, `no-scrollbar`, `overscroll-x-contain`, empty state, skeleton), five card components (`TeacherCard`, `CourseCard`, `EventCard`, `ConnectionCard`, `FacultyCard`)
**Uses:** `embla-carousel-react ^8.6.0`, `@utility no-scrollbar` in globals.css, Tailwind snap utilities
**Avoids:** Pitfall 1 (`overflow-x: hidden`), Pitfall 2 (missing `snap-type` on container), Pitfall 8 (iOS Safari back-gesture — add `overscroll-behavior-x: contain`), Pitfall 11 (cards collapsing without `shrink-0`)

### Phase 5: ProfileCompletionCard and StatHero

**Rationale:** These two widgets are shared across all role layouts but simpler than the carousel. They can be built in parallel with Phase 4. ProfileCompletionCard receives the pre-computed score as a prop from the server page — no re-derivation on the client prevents score flicker. StatHero must render explicit "—" placeholders for untracked stats from first implementation; hardcoded fake numbers must never ship to production.
**Delivers:** `ProfileCompletionCard.tsx` (animated progress bar, checklist with deep links to settings, dismiss at ≥80%), `StatHero.tsx` (KPI tiles with role color accents from ThemeColorProvider CSS variables, explicit "—" placeholder state)
**Avoids:** Pitfall 9 (score flicker from client re-derivation), Pitfall 14 (hardcoded fake placeholder numbers), Pitfall 12 (greeting fallback — `full_name = ''` not NULL for new users; use `trim() || fallback`)

### Phase 6: Role Layout Components

**Rationale:** All dependencies are complete. Role layouts are thin presentational assembly — compose existing components, add role-specific section headings and CTAs. Student and WP layouts are medium complexity. Teacher layout is medium-high (school owner detection, ConnectionsList). School-aware Teacher layout is highest complexity (school status CTA branching, FacultyList, designation queries — but all data arrives as props already fetched in Phase 3).
**Delivers:** `DashboardStudent.tsx`, `DashboardTeacher.tsx`, `DashboardWellness.tsx`, `DashboardSchool.tsx`; page.tsx stubs replaced with real imports
**Avoids:** Pitfall 2 anti-pattern (fetching data inside role layouts), Pitfall 7 (flat visual without depth cues — establish `bg-slate-50` page / `bg-white` card / `shadow-sm` hierarchy in base Card component before assembling layouts)

### Phase Ordering Rationale

- The dependency graph is strict: data utilities must precede the server page; the server page (with stubs) must precede role layouts; carousel and card components must precede role layouts.
- The feed cleanup (Phase 1) is front-loaded to avoid mid-build discovery that deleted components are imported elsewhere — a breakage that stalls later phases.
- The `Promise.all` fetch pattern (Phase 3) is established before any individual layout is built — retrofitting parallel fetching into an existing per-component waterfall is a larger refactor than starting correctly.
- CSS correctness (scroll snap, iOS Safari, `shrink-0`) is validated at the component level (Phase 4) before the carousel appears in four separate layouts. A bug fixed once in Phase 4 does not need to be fixed four times in Phase 6.
- The `principal_trainer_school_id` school detection condition (Phase 3) is locked in before the school layout component is written (Phase 6), preventing the silent `role === 'school'` mistake.

### Research Flags

Phases with standard, well-documented patterns — no research agent needed:
- **Phase 1 (Feed Cleanup):** Grep-and-delete; no unknowns.
- **Phase 2 (Data Infrastructure):** Pure TypeScript; mirrors existing patterns in `lib/credits.ts` and `app/settings/subscriptions/queries.ts`.
- **Phase 3 (Server Page):** Exact pattern from `app/settings/layout.tsx`. Confirm `principal_trainer_school_id` column name in migration file before writing condition.
- **Phase 5 (ProfileCompletionCard, StatHero):** Fully specified in FEATURES.md and PITFALLS.md. No novel patterns.

Phase requiring device testing before sign-off:
- **Phase 4 (HorizontalCarousel):** iOS Safari back-gesture conflict cannot be tested in Chrome DevTools device emulation. Test on a real iPhone before marking this phase complete. The fix (`overscroll-behavior-x: contain`) is known; the risk is shipping without verifying it.

Phase requiring schema verification before first line of code:
- **Phase 6 (Role Layouts):** Confirm `principal_trainer_school_id` is the correct column name for school owner detection. Check `supabase/migrations/20260376_school_owner_schema.sql` — this was referenced in PITFALLS.md but the exact column name was not independently verified in ARCHITECTURE.md.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All decisions verified against official docs and direct codebase inspection. embla-carousel-react version 8.6.0 confirmed via secondary sources (npm returned 403 during research) — MEDIUM on that specific version, HIGH on the library choice and integration pattern. |
| Features | HIGH | Feature scope verified against codebase (existing tables, component files, settings field names). Profile completion weights from external research (LinkedIn engagement data) are MEDIUM confidence; the implementation pattern is HIGH. Anti-features are clearly reasoned against project goals. |
| Architecture | HIGH | All integration points verified by direct codebase inspection. Pattern match with `app/settings/layout.tsx` is exact. Build order verified against actual file dependency graph. No novel architecture required. |
| Pitfalls | HIGH | CSS carousel pitfalls verified against MDN, official Next.js auth guidance, and confirmed open GitHub issues. JSONB scoring pitfall verified against actual migration files. School owner detection verified against schema. Each pitfall includes detection steps and recovery cost. |

**Overall confidence:** HIGH

### Gaps to Address

- **`principal_trainer_school_id` column name verification:** Referenced in PITFALLS.md via codebase inspection but should be explicitly confirmed in `supabase/migrations/20260376_school_owner_schema.sql` before writing the school owner branch condition in Phase 3.

- **embla-carousel-react exact version:** npm page returned 403 during research; v8.6.0 confirmed via secondary sources. Verify with `npm info embla-carousel-react` at install time. Confirm 9.x is still RC and not production-ready before pinning to `^8`.

- **Profile view analytics (permanent deferral):** The StatHero "profile views" tile must render "—" in v1.17. This is intentional. The next milestone that implements analytics will need a separate research pass for `analytics_events` table design, write instrumentation on profile page load, and aggregation query patterns.

- **RLS on `schools` table:** ARCHITECTURE.md flags a LOW risk that the school record may not be readable by the owner without the service client. Verify in Phase 3: check if `principal_trainer_school_id` is already joined into the profile query, or if a separate schools query needs the service client vs. a regular server client.

- **Feed DB tables:** `posts`, `likes`, `comments` tables are used by the admin panel. The Phase 1 cleanup deletes only UI component files in `app/dashboard/`. Confirm during the grep audit that no other non-admin pages reference these tables directly before closing Phase 1.

---

## Sources

### Primary (HIGH confidence)
- Codebase: `app/dashboard/page.tsx` — current dashboard state (direct inspection)
- Codebase: `app/settings/layout.tsx` — reference server component auth + role fetch pattern
- Codebase: `app/schools/[slug]/page.tsx` — reference for `getSupabaseService()` in server component
- Codebase: `lib/supabase/getEffectiveUserId.ts`, `lib/credits.ts`, `app/context/ConnectionsContext.tsx` — direct inspection
- Codebase: `supabase/migrations/` — schema verification (profiles, schools, connections, credit_entries)
- Codebase: `.planning/PROJECT.md` — v1.17 milestone spec, role definitions
- [Embla Carousel official docs — React setup](https://www.embla-carousel.com/docs/get-started/react)
- [Tailwind CSS scroll snap utilities](https://tailwindcss.com/docs/scroll-snap-type)
- [tailwind-scrollbar-hide v4 bug — GitHub Issue #31](https://github.com/reslear/tailwind-scrollbar-hide/issues/31)
- [Next.js Auth in Layouts vs Pages](https://nextjs.org/docs/app/guides/authentication)
- [MDN — CSS Scroll Snap / Carousels](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Overflow/Carousels)

### Secondary (MEDIUM confidence)
- [Embla Carousel — framer-motion conflict report #317](https://github.com/davidjerleke/embla-carousel/issues/317)
- [Tailwind CSS v4 @utility directive discussion](https://github.com/tailwindlabs/tailwindcss/discussions/14093)
- [CSS overflow-x hidden vs scrollbar hiding](https://blog.logrocket.com/hide-scrollbar-without-impacting-scrolling-css/)
- [iOS Safari overscroll-behavior-x contain](https://pqina.nl/blog/how-to-prevent-scrolling-the-page-on-ios-safari/)
- [Vercel — Common Next.js App Router Mistakes](https://vercel.com/blog/common-mistakes-with-the-next-js-app-router-and-how-to-fix-them)
- [Dashboard Design UX Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [NN/G Mobile Carousels](https://www.nngroup.com/articles/mobile-carousels/)
- [Netflix Carousel UX Pattern](https://medium.com/@andrew.tham.cc/recreating-netflixs-slider-component-2d6ad9009ab0)
- [KPI Card Best Practices — Tabular Editor](https://tabulareditor.com/blog/kpi-card-best-practices-dashboard-design)

### Tertiary (LOW confidence)
- [React carousel library comparison 2025/2026](https://enstacked.com/react-carousel-component-libraries/) — bundle size cross-reference only
- [Userpilot — SaaS Onboarding Patterns](https://userpilot.com/blog/app-onboarding-design/) — single case study; profile completion claim used directionally only

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
