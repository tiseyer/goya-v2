# Project Research Summary

**Project:** GOYA v2 — v1.18 User Profile Redesign (`/members/[id]`)
**Domain:** Rich public member profile page with role-specific content, media embeds, and location map
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

This milestone is a focused UI rebuild of the existing `/members/[id]` page, upgrading it from a minimal two-column layout into a rich profile with a cover image hero, intro video embed, role-specific pill sections, events/courses carousels, an inline Mapbox map, and sidebar designation badges. The underlying platform (Next.js 16, Tailwind CSS 4, Supabase, mapbox-gl, embla-carousel-react) is fully capable — no new dependencies are required. Every visual capability needed (maps, video embeds, pill badges, carousels) is already implemented elsewhere in the codebase and should be extracted or reused.

The recommended approach is to build the page as a thin server-component orchestrator that fetches all data in two `Promise.all` batches (profile first, then dependent queries in parallel) and passes fully-resolved props to a set of focused, stateless section components. Role-specific gating logic should be derived once in a `deriveProfileVisibility()` helper before any JSX executes, so no role checks are scattered inline. The existing `HorizontalCarousel`, `EventCard`, `FacultyCard`, and `ConnectButton` components are reused directly; only `CourseCard`, `ProfileHero`, `ProfilePills`, `ProfileVideo`, `ProfileMap`, and `DesignationBadges` are new.

The most significant risks are privacy violations (location data shown to students or online-only users), sensitive field exposure via the service-role SELECT, and performance regressions from unguarded Mapbox bundle loading and inline YouTube iframe embeds. All three are design-time decisions that are expensive to retrofit — they must be addressed in the first phase of implementation, before individual sections are built.

---

## Key Findings

### Recommended Stack

Zero new dependencies are required. All capabilities are already installed.

**Core technologies:**
- `mapbox-gl@3.20.0`: Inline location map — use the existing raw API pattern from `MapPanel.tsx`, loaded via `dynamic({ ssr: false })`. Consider Mapbox Static Images API as an alternative for a zero-JS, server-renderable pin that costs nothing in bundle weight.
- Plain `<iframe>` with regex ID extraction: Video embed — the pattern exists in two places already (`VideoRenderer.tsx`, lesson player page). Extract into a shared `lib/video.ts` util. Use a facade/lite pattern (thumbnail + click-to-load) to avoid shipping YouTube's 1 MB runtime to every visitor.
- Tailwind CSS utility classes: All pill/badge UI — same approach as `MapPanel.tsx` and `members/page.tsx`. Extend the existing `ROLE_HERO` color map rather than creating new patterns.
- Conditional `next.config.ts` entry: Add Supabase Storage hostname to `remotePatterns` if `next/image` is used for cover and avatar images (recommended).

### Expected Features

**Must have (table stakes — all DB columns confirmed ready or migratable):**
- Cover image hero with avatar, role badge, name, location, verification badge
- Role-specific pill sections: teaching styles / practice styles / wellness credentials / languages
- Intro video embed (YouTube or Vimeo, stored in `youtube_intro_url`)
- Social links sidebar (website, Instagram, Facebook, TikTok, YouTube)
- Inline Mapbox map (teachers and wellness practitioners with in-person or hybrid format only)
- School affiliation cards (principal trainer + faculty roles)
- Designation badges in sidebar (from `user_designations` table)
- Own-profile editing nudge / completion banner
- Events and courses carousels (member-created content only)

**Should have (differentiators):**
- Faculty grid on teacher profiles (reuses `FacultyCard` component)
- Connections section (already exists for own-profile view)
- "Connect" and "Message" action buttons (authenticated viewers only, hidden on own profile)

**Defer (v2+):**
- ISR caching — `force-dynamic` is acceptable for v1.18 given current member scale; revisit when traffic grows
- Interactive map (pan/zoom) — static embed with `interactive: false` is sufficient for a profile page

**Fields requiring a single migration before any profile section can use them:**
- `profiles.cover_image_url text` — hero banner image
- `profiles.location_lat double precision` — Mapbox pin
- `profiles.location_lng double precision` — Mapbox pin
- `profiles.location_place_id text` — geocode reference

**Type-only update (no migration):**
- Add `lineage: string[] | null` to `lib/types.ts` — column already exists in DB as `jsonb`

### Architecture Approach

The profile page should follow the same server-component orchestrator pattern established in `app/dashboard/page.tsx` (v1.17): the `page.tsx` server component owns all data fetching via `Promise.all` batches, derives all visibility/gating flags in one place, then passes resolved props to stateless section components. New query functions `fetchMemberEvents` and `fetchMemberCourses` (filtered by `created_by`) are needed in `lib/dashboard/queries.ts`; all other data utilities exist. The viewer identity is established server-side via `supabase.auth.getUser()` — never via the URL param alone.

**Major components:**
1. `ProfileHero` — cover image, avatar, name, role badge, verification, location, action buttons; new
2. `ProfilePills` — role-branched pill sections; new; reads from `deriveProfileVisibility()` output
3. `ProfileVideo` — facade YouTube/Vimeo embed; new; uses shared `lib/video.ts` util
4. `ProfileMap` — single-pin Mapbox embed loaded via `dynamic({ ssr: false })`; new; only rendered when `showMap === true`
5. `HorizontalCarousel` + `EventCard` + `FacultyCard` — reused from dashboard components unchanged
6. `CourseCard` — new; mirrors `EventCard` shape for `CourseRow` from `fetchMemberCourses`
7. `DesignationBadges` — new; queries `user_designations` table
8. `OwnProfileNudge` — new; uses `getProfileCompletion()` from existing `lib/dashboard/profileCompletion.ts`
9. `SocialLinks`, `MemberCard`, `SchoolAffiliation` — extracted from existing inline markup in `page.tsx`

### Critical Pitfalls

1. **Address/map shown to students and online-only users** — build a single `deriveProfileVisibility(profile)` server-side helper that returns all boolean gates (`showMap`, `showAddress`, etc.) before any rendering. Gate the `ProfileMap` import site on `showMap` to avoid loading Mapbox at all.

2. **Mapbox GL JS in bundle for every profile visitor** — always load `ProfileMap` via `dynamic({ ssr: false })` and only inside the `showMap` conditional. If the map is static (no pan/zoom), the Mapbox Static Images API is strictly better: zero client JS, server-rendered, token stays server-side.

3. **Service-role SELECT returning sensitive columns** — define a `PUBLIC_PROFILE_COLUMNS` constant string listing only safe columns. Never inline the SELECT string or use `select('*')`. Audit this constant whenever a new column is added to `profiles`.

4. **Own-profile detection broken** — current production `page.tsx` hard-codes `isOwnProfile={false}`. The redesign must call `supabase.auth.getUser()` (not `getSession()`) server-side and derive `isOwnProfile = currentUserId === profileId` before passing to any child.

5. **YouTube iframe shipping 1 MB on page load** — use the facade embed pattern: show a thumbnail image with a play button overlay, inject the `<iframe>` only on user click. Use `youtube-nocookie.com` to reduce tracking.

---

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation — Migration, Privacy Layer, and Data Fetching Architecture
**Rationale:** All downstream sections depend on: (a) the new DB columns existing, (b) the privacy gating helper being in place, (c) the data fetch pattern being settled. Doing this first prevents rework in every subsequent phase.
**Delivers:** Migration adding `cover_image_url`, `location_lat`, `location_lng`, `location_place_id` to `profiles`; `lib/types.ts` update adding `lineage`; `PUBLIC_PROFILE_COLUMNS` constant; `deriveProfileVisibility()` helper; `fetchMemberEvents` and `fetchMemberCourses` query functions; updated `page.tsx` data fetch using two-batch `Promise.all`; server-side `isOwnProfile` detection.
**Addresses:** All FEATURES.md migration requirements
**Avoids:** Pitfall 1 (location privacy), Pitfall 3 (service role exposure), Pitfall 4 (broken own-profile detection), Pitfall 6 (sequential awaits)

### Phase 2: Hero Section and Cover Image
**Rationale:** The hero is the above-the-fold entrypoint for every visitor. It unblocks screenshot/design review and covers the highest-impact LCP elements. Completing it early allows the rest of the layout to anchor to a stable top section.
**Delivers:** `ProfileHero` component with cover image (`next/image`, `priority`), avatar, full name, role badge, verification badge, city/country, `OwnProfileNudge` completion banner, `ConnectButton`, `MessageButton`.
**Uses:** `cover_image_url` column (from Phase 1), `next/image` with Supabase Storage `remotePatterns`
**Avoids:** Pitfall 4 (isOwnProfile wired correctly), Pitfall 8 (Connect/Message hidden on own profile), Pitfall 11 (cover and avatar via `next/image`)

### Phase 3: Role-Specific Pill Sections and Sidebar Enhancements
**Rationale:** Directly follows the hero because both compose the "above the fold + first scroll" experience reviewers will evaluate together. All data is already available from the Phase 1 fetch.
**Delivers:** `ProfilePills` (teaching styles, teaching focus, influences, practice styles, wellness focus, credentials, languages, practice format — all role-gated); `DesignationBadges` querying `user_designations`; `SocialLinks` extracted with Facebook/TikTok added; `MemberCard` extracted; school affiliation section polished.
**Implements:** Role-branched section architecture; `deriveProfileSections()` ordering function

### Phase 4: Media — Intro Video and Mapbox Map
**Rationale:** Isolated new components with clear performance and privacy considerations. Grouping them ensures the facade video pattern and the Mapbox `dynamic()` guard are treated as first-class requirements, not afterthoughts.
**Delivers:** `ProfileVideo` component with facade embed pattern and `lib/video.ts` shared utility; `ProfileMap` component loaded via `dynamic({ ssr: false })`, gated on `showMap`, decision documented on static vs GL JS.
**Avoids:** Pitfall 2 (Mapbox bundle), Pitfall 5 (YouTube JS on page load), Pitfall 9 (malformed video URL fallback), Pitfall 10 (Mapbox token exposure)

### Phase 5: Content Carousels — Events, Courses, Faculty Grid
**Rationale:** Depends on `fetchMemberEvents` and `fetchMemberCourses` (Phase 1) and the layout scaffold from Phase 2. The new `CourseCard` component is the only net-new non-trivial piece; `HorizontalCarousel`, `EventCard`, and `FacultyCard` are reused unchanged.
**Delivers:** Events carousel, courses carousel, faculty grid (for teacher profiles with school affiliation); new `CourseCard` component.
**Uses:** `HorizontalCarousel`, `EventCard`, `FacultyCard` from `app/dashboard/components/`

### Phase Ordering Rationale

- Foundation first because the migration, privacy helper, and data fetch layer are cross-cutting dependencies. Phases 2–5 each add a section without touching the data layer.
- Hero second because it anchors layout, resolves LCP concerns, and produces a reviewable visual artifact early.
- Pills and sidebar third because they are data-complete after Phase 1 and complement the hero in a single design review pass.
- Media fourth because Mapbox and video are isolated components with explicit performance trade-offs to resolve before writing code.
- Carousels last because they require the most query work (Phase 1 provides it) and a new component (`CourseCard`), but no new architectural decisions.

### Research Flags

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** Standard Supabase migration + type update + established query pattern from dashboard
- **Phase 2 (Hero):** `next/image` + Tailwind layout — well-documented, working reference in codebase
- **Phase 3 (Pills/Sidebar):** Pure Tailwind + existing data shape — straightforward composition
- **Phase 5 (Carousels):** Reuses existing components almost entirely

Phases that may benefit from targeted research at plan time:
- **Phase 4 (Media):** The static vs. GL JS decision for Mapbox, and the facade video pattern, are implementation choices with real performance impact. A quick research-phase pass to confirm the Static Images API URL format and token restrictions is worthwhile before writing code.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All findings verified directly from `package.json`, working codebase implementations, and official docs |
| Features | HIGH | Field audit sourced from actual DB migrations and `lib/types.ts`; gaps are precisely identified |
| Architecture | HIGH | All component APIs, query function signatures, and data flow verified from codebase source files |
| Pitfalls | HIGH (critical) / MEDIUM (sources) | Critical pitfalls derive from codebase inspection; external sources (bundle sizes, GDPR) are community or GitHub issues |

**Overall confidence:** HIGH

### Gaps to Address

- **Static vs. GL JS map decision:** PITFALLS.md flags both paths with trade-offs. The team must choose before Phase 4 starts. If Static Images API is chosen, the `NEXT_PUBLIC_MAPBOX_TOKEN` vs. server-only `MAPBOX_TOKEN` implication applies.
- **`profile-covers` Supabase Storage bucket:** FEATURES.md notes a new bucket should be created parallel to `school-covers`. This is an infra step for Phase 1 or Phase 2 — confirm bucket creation is in scope.
- **Mapbox geocoding on profile settings save:** The new `location_lat`, `location_lng`, `location_place_id` columns need to be populated. The member settings page (out of scope for this milestone) will need a geocoding step when location is set. For v1.18, the map can gracefully degrade to hidden if coordinates are null.
- **`next.config.ts` Supabase domain:** Adding `*.supabase.co` to `remotePatterns` is conditional on using `next/image` for cover images. Confirm this at Phase 2 start.

---

## Sources

### Primary (HIGH confidence)
- `app/members/[id]/page.tsx` — current profile page implementation
- `app/members/MapPanel.tsx` — working mapbox-gl integration pattern
- `app/academy/[id]/lesson/[lessonId]/page.tsx` — YouTube + Vimeo iframe extraction
- `app/components/flow-player/elements/VideoRenderer.tsx` — YouTube iframe pattern
- `app/dashboard/page.tsx` — Promise.all data fetch pattern
- `app/dashboard/components/HorizontalCarousel.tsx`, `EventCard.tsx`, `FacultyCard.tsx` — carousel component APIs
- `app/components/ConnectButton.tsx` — role-pair logic and props
- `lib/types.ts` — Profile interface
- `lib/dashboard/queries.ts` — query function signatures
- `supabase/migrations/001_profiles.sql` through `20260376_school_owner_schema.sql` — DB schema ground truth
- `package.json`, `next.config.ts` — dependency and config verification
- [Mapbox Static Images API docs](https://docs.mapbox.com/api/maps/static-images/) — server-side map tile approach
- [Next.js Videos guide](https://nextjs.org/docs/app/guides/videos) — lazy iframe loading patterns

### Secondary (MEDIUM confidence)
- [Mapbox GL JS v3.0 bundle size issue](https://github.com/mapbox/mapbox-gl-js/issues/12995) — 1.25 MB size figure
- [YouTube facade embed pattern](https://dev.to/madsstoumann/how-to-embed-youtube-and-vimeo-the-light-way-2pek) — facade/lite embed approach
- [Supabase RLS security pitfalls](https://dev.to/solobillions/your-supabase-rls-is-probably-wrong-a-security-guide-for-vibe-coders-3l4e) — service role column exposure risk

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
