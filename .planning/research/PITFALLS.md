# Domain Pitfalls: Rich Profile Pages with Maps, Video, and Privacy Rules

**Domain:** Role-specific public member profile pages
**Project:** GOYA v2 — v1.18 User Profile Redesign
**Milestone:** Adding rich profiles to existing Next.js 16 App Router + Supabase system
**Researched:** 2026-04-01

---

## Critical Pitfalls

Mistakes that cause rewrites, data leaks, or broken privacy guarantees.

---

### Pitfall 1: Address/Location Shown to Students and Online-Only Profiles

**What goes wrong:** The profile page fetches `city`, `country`, and coordinates unconditionally and renders a Mapbox embed for all users. Students and users with `practice_format = 'online'` must never show a map or a precise location because they have no public physical presence.

**Why it happens:** The privacy rule is a business logic gate, not a DB-level restriction. RLS cannot express it because the rule depends on the *profile's own fields*, not on the viewer's identity. Developers add the map section and forget to check `practice_format` and `role` before rendering.

**Consequences:**
- Students' city/country shown on a map pin they did not consent to publish
- Online-only teachers/WPs implying a studio location that does not exist
- Potential GDPR violation if location data is treated as personally identifiable

**Prevention:**
```typescript
// Derive this server-side before rendering anything map-related
const showMap =
  profile.practice_format !== 'online' &&
  profile.role !== 'student' &&
  profile.latitude != null &&
  profile.longitude != null;
```
Build a single `deriveProfileVisibility(profile)` helper that returns all boolean gates at once. Every conditional section reads from this object — never scatters inline checks across JSX.

**Detection:** Add a test account with `role = 'student'` that has `city` set. Manually visit `/members/[that-id]`. If you see a map or location pin, this pitfall has been hit.

**Phase:** Must be addressed in the same phase that introduces the Mapbox embed. Do not defer.

---

### Pitfall 2: Mapbox GL JS Loaded on Every Profile Page (Bundle + SSR Crash)

**What goes wrong:** `mapbox-gl` is ~1.25 MB minified (increased 25% in v3.0). If imported at the top of a Server Component or a Client Component without `dynamic()`, Next.js will either crash the SSR build (because Mapbox accesses `window` during module init) or ship the full library to every profile visitor — even those whose profiles have no map.

**Why it happens:** The existing `MapPanel.tsx` is already `'use client'` and uses `useEffect`, but it is a panel component for the member directory, not a single-coordinate inline embed. Copying the pattern to a profile page without `dynamic()` import removes the SSR guard.

**Consequences:**
- Build error: `window is not defined` during `next build`
- Or: 1.25 MB JS shipped to every profile visitor regardless of whether a map renders
- LCP regression of 200–800 ms on mobile connections

**Prevention:**
- Always load any Mapbox component via `const MapEmbed = dynamic(() => import('./MapEmbed'), { ssr: false })`
- Wrap the import site in the `showMap` gate so it is never evaluated at all for non-map profiles
- For a single-pin profile embed (not interactive directory), strongly consider the **Mapbox Static Images API** instead: a plain `<img>` tag with a URL like `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-l+4E87A0(${lng},${lat})/${lng},${lat},13,0/600x200@2x?access_token=...` costs zero JS, loads in 100–425 ms, and is server-renderable. Use GL JS only if the map needs to be interactive.

**Detection:** Run `ANALYZE=1 npm run build` and inspect the client bundle for `mapbox-gl` entries appearing outside a dynamic chunk.

**Phase:** Embed decision (static vs. interactive) must be made before the map section is written — changing from GL JS to Static Image later requires a full rewrite of that component.

---

### Pitfall 3: Service Role Client Used for Profile Reads — Bypasses All Column-Level Privacy

**What goes wrong:** The current `page.tsx` already uses `getSupabaseService()` to avoid RLS-caused 404s when the viewer's JWT is expired. This pattern is correct for avoiding false 404s, but it requires the developer to manually enforce every privacy rule that RLS would have handled. If a new sensitive column (e.g., `phone`, `email`, `certificate_url`) is added to the `profiles` table and accidentally included in the SELECT, it will be returned and potentially rendered.

**Why it happens:** `getSupabaseService()` bypasses RLS entirely. The column allowlist in `.select(...)` is the only barrier. Developers adding new profile fields often extend the SELECT string without auditing what gets rendered.

**Consequences:**
- Phone numbers, private URLs, or email addresses in the HTML source
- Certificate upload URLs in the DOM — publicly indexable by search engines

**Prevention:**
- Create an explicit `PUBLIC_PROFILE_COLUMNS` constant listing exactly the columns safe to show publicly. Use it in the SELECT — never inline the string.
- Audit this constant every time a new column is added to `profiles`.
- Alternative: switch to the SSR Supabase client (`createSupabaseServerClient`) and add a permissive RLS SELECT policy scoped to authenticated users. This re-enables RLS as a second safety net.

**Detection:** Search the codebase for `.select(` in the member profile page and cross-reference every column against the Profile type to identify sensitive fields.

**Phase:** Define `PUBLIC_PROFILE_COLUMNS` before writing any new fetch logic.

---

### Pitfall 4: Own-Profile Detection Done Client-Side or Via Props

**What goes wrong:** Passing `isOwnProfile` as a prop derived from a comparison that was never authenticated. The current `page 2.tsx` has the correct server-side pattern (`profile.id === currentUserId` after `supabase.auth.getUser()`), but the current production `page.tsx` hard-codes `isOwnProfile={false}` — the edit button and completion nudge will never render.

**Why it happens:** The redesign adds new sections (edit button, completion nudge banner) that gate on own-profile. If the viewer auth check is omitted in the new page, these controls are silently suppressed for everyone.

**Consequences:**
- Members can never access their edit shortcut from their own profile
- "Edit Profile" button visible to wrong viewers if the comparison uses unreliable data (e.g., URL `id` param)

**Prevention:**
- Call `supabase.auth.getUser()` in the server component — never `getSession()` which can return stale data
- Derive `isOwnProfile = currentUserId === profileId` before passing to any child
- Never use the URL param `id` alone to infer ownership — always compare against the authenticated UID

**Detection:** Signed-in as member A, visit `/members/[A's id]`. If no edit button appears, `isOwnProfile` is broken.

**Phase:** Must be implemented in the hero/action-buttons phase. The own-profile state must be threaded through the entire page.

---

## Moderate Pitfalls

---

### Pitfall 5: YouTube/Vimeo Embed Loads 1+ MB Even If User Never Clicks Play

**What goes wrong:** A raw `<iframe src="https://www.youtube.com/embed/...">` loads YouTube's full JS runtime immediately, including tracking scripts. This adds 500 KB–1 MB+ to the profile page even if the visitor never interacts with the video. It also fires third-party cookies on page load, which has GDPR implications.

**Why it happens:** Standard iframe embed is the obvious approach. The performance cost is invisible in development.

**Prevention:**
- Use a **facade/lite embed** pattern: render a `<img>` thumbnail from `https://img.youtube.com/vi/[id]/hqdefault.jpg` with a play button overlay. Only inject the `<iframe>` on click via a state toggle.
- For Vimeo, use `https://vimeo.com/api/oembed.json` to fetch thumbnail on server side.
- Use `youtube-nocookie.com` domain instead of `youtube.com` for reduced tracking: `https://www.youtube-nocookie.com/embed/[id]`
- Add `loading="lazy"` to the iframe once it is created.

**Detection:** Open the profile page with video in Chrome DevTools Network tab filtered to "media". Observe requests firing without user interaction.

**Phase:** Address in the intro video embed phase. The facade pattern should be the default, not an optimisation to add later.

---

### Pitfall 6: Sequential Awaits Instead of Promise.all for Multi-Entity Profile Fetches

**What goes wrong:** The new profile page fetches: profile, school affiliation, faculty members, events, courses, connections, and potentially designations. If these are chained as sequential awaits (one after another), each round-trip adds 50–200 ms latency. Six sequential queries = 300–1200 ms additional wait time on the server.

**Why it happens:** Developers write fetches top-to-bottom as they build the page section by section, never refactoring to parallel.

**Consequences:**
- Profile page TTFB of 1–3 seconds on Supabase Postgres in EU region
- Vercel function timeout risk if any query is slow

**Prevention:**
- Group all independent fetches into a single `Promise.all([...])` call, matching the pattern already used in `app/dashboard/page.tsx` (v1.17)
- Only sequential fetches are those where a later query depends on a prior result (e.g., you need `school_id` from the profile before fetching school details)
- For that dependency, fetch profile first, then fire all dependent queries in parallel

```typescript
const [profile, connections] = await Promise.all([fetchProfile(id), fetchConnections(id)])
const [events, courses, school] = await Promise.all([
  fetchEvents(profile.id),
  fetchCourses(profile.id),
  profile.principal_trainer_school_id ? fetchSchool(profile.principal_trainer_school_id) : null,
])
```

**Detection:** Add `console.time` / `console.timeEnd` around the data fetching block in development and observe total server time.

**Phase:** Architect the data fetching layer before writing section components. Retrofitting is painful.

---

### Pitfall 7: Role-Based Section Sprawl — Four Roles, Many Optional Sections, No Structure

**What goes wrong:** The profile page has 4 roles (student, teacher, wellness_practitioner, admin/moderator) and many optional sections (intro video, school affiliation, faculty grid, teaching styles, wellness designations, events carousel, courses carousel, map). Without structure, the page component accumulates nested ternaries and grows to 600+ lines with no clear ownership per section.

**Why it happens:** Each section is added one at a time. The first few are inline. By section 6, the JSX is unreadable.

**Prevention:**
- Define a `ProfileSection` type listing every possible section with a `shouldShow(profile, viewer)` predicate
- Compose the page from section components rather than embedding logic inline
- Follow the v1.17 dashboard pattern: role layouts receive `props`, page component is a thin orchestrator
- A `deriveProfileSections(profile, viewerContext)` function returns an ordered array of visible section IDs — the JSX maps over it

**Detection:** If the profile page component exceeds ~200 lines of JSX, the sections are not properly decomposed.

**Phase:** Set up section architecture before writing individual sections. Refactoring after is expensive.

---

### Pitfall 8: ConnectButton and MessageButton Rendered on Own Profile

**What goes wrong:** The sidebar shows a Connect button and a Message button. On the viewer's own profile, both should be hidden. The current `page.tsx` hard-codes `isOwnProfile={false}`, meaning the ConnectButton is always shown. On the redesigned page, the same mistake leads to a member seeing "Connect with yourself."

**Why it happens:** `isOwnProfile` state is forgotten or incorrectly wired during the redesign.

**Prevention:**
- `ConnectButton` already accepts `isOwnProfile` — ensure it is wired with the server-derived value
- Add a separate guard for `MessageButton`: hide it when `isOwnProfile === true`
- Also hide the "Message" button when the viewer is not authenticated (same as connect)

**Detection:** Visit your own profile page while signed in. Any action button (Connect, Message) should not appear.

**Phase:** Addressed alongside the hero/sidebar phase when action buttons are added.

---

## Minor Pitfalls

---

### Pitfall 9: Video URL Stored as Raw User Input — Malformed URLs Break the Embed

**What goes wrong:** A member pastes a YouTube playlist URL, a YouTube Shorts URL, or a Vimeo showcase URL. The existing `extractYouTubeId` regex in `app/schools/[slug]/page.tsx` handles the common patterns but may miss `youtube.com/live/[id]` or `youtu.be/[id]?si=[tracking]`.

**Prevention:**
- Extend the regex to cover `/live/`, `/shorts/`, and strip query params before matching
- Add a graceful fallback: if `getEmbedUrl()` returns null, do not render the iframe section at all — show "Video unavailable" instead of a broken embed
- Validate URL format at the settings save step, not at render time

**Phase:** Address in the intro video section. Reuse and extend the helpers already in `app/schools/[slug]/page.tsx`.

---

### Pitfall 10: Mapbox Token Exposed in HTML Source via `NEXT_PUBLIC_` Prefix

**What goes wrong:** `NEXT_PUBLIC_MAPBOX_TOKEN` is already in the codebase (used in `MapPanel.tsx`). This is correct for GL JS which must run in the browser. However, if you switch to the Mapbox Static Images API for the profile embed, the token should be used server-side only, meaning it should be `MAPBOX_TOKEN` (no `NEXT_PUBLIC_`) to avoid bundling it into client JS.

**Prevention:**
- Static Images API: use `process.env.MAPBOX_TOKEN` (server-only) — token never reaches the browser
- GL JS: `NEXT_PUBLIC_MAPBOX_TOKEN` is unavoidable — use Mapbox's token restriction settings (allowed URLs) to limit blast radius
- Never use the same token for both server-side Static API calls and client-side GL JS. Use separate restricted tokens.

**Phase:** Decided at the same time as the static vs. interactive map decision.

---

### Pitfall 11: Cover Image / Avatar Loaded With `<img>` Instead of `next/image` — No Optimisation

**What goes wrong:** The current `page.tsx` uses raw `<img>` elements for avatar and school logos, bypassing `next/image` optimisation. For the redesigned profile with a large cover image (full-width hero) and a 120px avatar, this means unoptimised images shipped at full resolution.

**Prevention:**
- Use `next/image` for all profile images with explicit `width`, `height`, and `priority` for LCP elements (the avatar and cover are above-the-fold)
- Add Supabase Storage hostname to `next.config.ts` `remotePatterns`
- The cover image especially needs `priority` since it is the largest contentful paint

**Detection:** Run Lighthouse on a profile page. An LCP image without `priority` will flag as an opportunity.

**Phase:** Address during hero section implementation.

---

### Pitfall 12: `force-dynamic` on Profile Page Prevents ISR/Caching

**What goes wrong:** The current page uses `export const dynamic = 'force-dynamic'`, which disables all caching. For a public profile page that changes infrequently, this means every visitor triggers a full server render with DB round-trips.

**Why this is minor for now:** GOYA is early-stage with a small member base. At scale this becomes a real cost and latency issue.

**Prevention for future:** Use `revalidate = 60` (ISR) instead of `force-dynamic` once the page is stable. The own-profile detection (`isOwnProfile`) is the main obstacle because it depends on the viewer's session — solve this by rendering the unauthenticated version cached, then hydrating the action buttons client-side based on session state.

**Phase:** Not required for v1.18. Flag as a future optimisation once member count grows.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Hero + cover image | LCP regression from unoptimised cover | Use `next/image` with `priority` |
| Intro video embed | 1 MB JS on page load | Facade/lite embed, load iframe on click only |
| Mapbox embed | SSR crash, 1.25 MB bundle, privacy for students | `dynamic({ ssr: false })`, or Static Images API, gate on `showMap` |
| Privacy rules | Address shown to students/online-only | `deriveProfileVisibility()` helper, check before any location render |
| Service role SELECT | Sensitive column exposure | `PUBLIC_PROFILE_COLUMNS` constant, explicit allowlist |
| Own-profile detection | Edit/nudge never shown, Connect shown on own profile | `auth.getUser()` server-side, derive `isOwnProfile` before render |
| Multi-section data fetch | Sequential awaits, high TTFB | `Promise.all` with dependency grouping |
| Role-specific sections | JSX sprawl, nested ternaries | Section component architecture before writing sections |

---

## Sources

- [Mapbox GL JS bundle size increase in v3.0](https://github.com/mapbox/mapbox-gl-js/issues/12995) — MEDIUM confidence (GitHub issue)
- [Mapbox: improve perceived performance with Static Images](https://docs.mapbox.com/help/tutorials/improve-perceived-performance-with-static/) — HIGH confidence (official docs)
- [Next.js Videos guide — lazy loading iframes](https://nextjs.org/docs/app/guides/videos) — HIGH confidence (official docs)
- [YouTube facade/lite embed pattern](https://dev.to/madsstoumann/how-to-embed-youtube-and-vimeo-the-light-way-2pek) — MEDIUM confidence (dev.to)
- [Supabase RLS security pitfalls](https://dev.to/solobillions/your-supabase-rls-is-probably-wrong-a-security-guide-for-vibe-coders-3l4e) — MEDIUM confidence (community)
- [Supabase: securing your data](https://supabase.com/docs/guides/database/secure-data) — HIGH confidence (official docs)
- [React conditional rendering best practices](https://react.wiki/components/conditional-rendering/) — MEDIUM confidence
- Codebase inspection: `app/members/[id]/page.tsx`, `app/members/[id]/page 2.tsx`, `app/members/MapPanel.tsx`, `app/schools/[slug]/page.tsx`, `lib/types.ts` — HIGH confidence (primary source)
