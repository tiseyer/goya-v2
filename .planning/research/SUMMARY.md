# Project Research Summary

**Project:** GOYA v2 — v1.15 Course System Redesign
**Domain:** LMS admin course management — categories, multi-lesson structure, drag-and-drop ordering, platform-aware video/audio embeds
**Researched:** 2026-04-01
**Confidence:** HIGH

## Executive Summary

This milestone is a well-scoped LMS feature upgrade layered onto a stable Next.js 16 + Supabase production platform. The core work is three-part: (1) replace a hardcoded 5-item string enum with a DB-driven `course_categories` table and admin CRUD, (2) introduce a `lessons` table to give every course a structured, ordered list of video/audio/text lessons, and (3) update the public academy to render those lessons. The existing codebase already contains every library and pattern needed — `@dnd-kit/core` and `@dnd-kit/sortable` are installed and used in products admin, Vimeo embed code exists in the lesson page, and `event_categories` provides an exact reference schema for `course_categories`. Only two new npm packages are required: `react-lite-youtube-embed` for lazy YouTube embeds, and `react-h5-audio-player` for a cross-browser audio UI.

The recommended approach is a strict bottom-up build order: database migrations first (categories, then courses schema changes, then lessons), TypeScript types next, then admin UI, then public rendering. This order is non-negotiable because four downstream components depend on the `lessons` table and `course_category_id` FK before any UI work can begin. Every phase has a clear predecessor and a clear deliverable.

The highest-risk items are the data migration (backfilling `course_category_id` on existing courses before dropping the `category` text column), RLS policies on the new `lessons` table (which must check parent course status to avoid silently empty results), and the drag-and-drop position strategy (float column, not integer, to allow single-row updates per reorder). All three risks have explicit, well-tested mitigations documented in PITFALLS.md.

---

## Key Findings

### Recommended Stack

The base stack is unchanged and production-stable. Only two new packages are added. `react-lite-youtube-embed@^3.5.0` replaces a naive YouTube `<iframe>` — it defers the 500KB YouTube IFrame API until the user clicks play, preserving Lighthouse scores. `react-h5-audio-player@^3.10.2` provides a styled, accessible, TypeScript-native audio player that would take ~200 lines of cross-browser CSS/JS to replicate. Everything else — drag-and-drop (`@dnd-kit/sortable` v10), rich text (`@tiptap/react`), Vimeo embedding (raw `<iframe>`), and form UI (Tailwind + existing design tokens) — is already in the project and must not be replaced.

**Core technologies (new additions only):**
- `react-lite-youtube-embed@^3.5.0`: YouTube lazy embed — avoids 500KB IFrame API on initial render, privacy-safe
- `react-h5-audio-player@^3.10.2`: Audio lesson player UI — cross-browser consistent, TypeScript, accessible

**No new libraries for:**
- Drag-and-drop: `@dnd-kit/sortable` v10 (already installed, used in `ProductsTable.tsx`)
- Vimeo: raw `<iframe>` (existing pattern in `app/academy/[id]/lesson/page.tsx`)
- Duration slider: native `<input type="range">` with Tailwind `accent-*`
- Category/lesson forms: existing Tailwind + design token patterns

See `.planning/research/STACK.md` for full integration code patterns and alternatives considered.

### Expected Features

Encrypted key storage is not applicable here — the critical path dependency is the database schema. The `lessons` table and `course_category_id` FK must exist before any lesson UI can be built. All other features cascade from this.

**Must have (table stakes):**
- `course_categories` DB table with admin CRUD — replaces hardcoded string enum; every LMS uses a managed taxonomy
- Multi-lesson structure per course — `lessons` table with `lesson_type` (video/audio/text), `sort_order`, platform-specific URL fields
- Drag-and-drop lesson reordering — expected in any modern course builder; uses existing dnd-kit pattern
- Platform-aware video embed (Vimeo + YouTube) — platform lock to Vimeo excludes YouTube-native instructors
- Frontend lesson rendering — video iframe, HTML5 audio, formatted text per lesson type
- Lesson type-specific admin forms — conditional fields prevent noise and confusion

**Should have (differentiators):**
- Premium card-section course form — replaces flat single-scroll layout; reduces cognitive load for complex course creation
- Category color metadata — colored badges on course cards enable richer visual browsing
- URL preview in lesson admin form — admins verify video plays before saving
- Audio as a first-class lesson type — yoga-specific content (meditations, dharma talks) is often audio-first

**Defer (v2+):**
- Lesson-level user progress tracking — `user_lesson_progress` table is a separate learner experience milestone
- Quiz/assessment within lessons — different product domain; CPD credit system handles accreditation
- Hierarchical category nesting — over-engineered for current scale (<100 courses)
- Rich text / Markdown for text lessons — validate demand before adding ~200KB WYSIWYG dependency

See `.planning/research/FEATURES.md` for full dependency map, prioritization matrix, and competitor analysis.

### Architecture Approach

The build follows a strict 8-step dependency chain from pure infrastructure (migrations → types) through admin UI (CourseForm, category panel, lesson management) to public rendering (lesson player page). All new components are either Server Components (data-fetching pages) or `'use client'` components with clean boundaries. `LessonList.tsx` owns its own optimistic state and must be wrapped in `dynamic(..., { ssr: false })` to prevent dnd-kit hydration errors. The `event_categories` migration and `ProductsTable.tsx` drag-and-drop implementation are the authoritative reference patterns for the two main new components.

**Major components:**
1. `course_categories` table + `CourseCategoriesPanel.tsx` — DB-driven taxonomy with inline admin CRUD; mirrors `event_categories` schema and FAQ admin UI pattern
2. `CourseForm.tsx` (modified) — card-section layout, dynamic category select, duration slider, removes `vimeo_url`
3. `LessonList.tsx` + `LessonFormModal.tsx` (new) — dnd-kit sortable list with type-conditional lesson form; mirrors `ProductsTable.tsx` pattern
4. `app/academy/[id]/lessons/[lessonId]/page.tsx` (new) — Server Component lesson player that branches to VideoLesson/AudioLesson/TextLesson client sub-components
5. `lib/courses/video.ts` (new) — shared URL parser/embed generator used by both admin form preview and public lesson renderer

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams, component boundaries, and file inventory.

### Critical Pitfalls

Ten pitfalls were identified. The five most critical:

1. **Category FK migration without backfill** — Add `course_category_id`, seed `course_categories`, UPDATE existing courses to set the FK, verify `COUNT(*) WHERE course_category_id IS NULL = 0`, then and only then drop the `category` text column. Never split these steps across separate migration files.

2. **RLS on `lessons` silently returns empty** — The lessons SELECT policy must use `EXISTS (SELECT 1 FROM courses WHERE courses.id = lessons.course_id AND courses.status = 'published')`. Supabase evaluates RLS independently per table in a JOIN. Always verify from the JS client, not the SQL Editor (which bypasses RLS).

3. **Integer `sort_order` causes N-row updates on drag reorder** — Use `numeric` (float) position column, seeded at multiples of 1000. Each drag end sets `newPosition = (predecessor + successor) / 2` and updates exactly one row. The existing `products.priority` integer pattern is NOT suitable for drag-and-drop.

4. **dnd-kit hydration mismatch in Next.js App Router** — Wrap `LessonList.tsx` in `dynamic(() => import('./LessonList'), { ssr: false })`. The `'use client'` directive does not prevent SSR; dnd-kit uses `window` and browser pointer APIs that fail during server render.

5. **Hardcoded category strings survive TypeScript migration** — Grep for all 5 category string literals (`'Workshop'`, `'Yoga Sequence'`, `'Dharma Talk'`, `'Music Playlist'`, `'Research'`) before writing the migration. Four codebase locations must be updated: `lib/types.ts`, `app/admin/courses/page.tsx` (`CATEGORY_BADGE`), `app/academy/[id]/page.tsx` (`CATEGORY_COLORS`), and `AdminCoursesFilters.tsx`.

See `.planning/research/PITFALLS.md` for full detail including integration gotchas, the "Looks Done But Isn't" verification checklist, and recovery strategies.

---

## Implications for Roadmap

Based on the dependency chain identified in FEATURES.md and the build order from ARCHITECTURE.md, five phases are recommended. The phases map directly to the 8-step hard dependency chain from ARCHITECTURE.md and cannot be reordered.

### Phase 1: Database Foundation

**Rationale:** All UI work depends on the schema. Running migrations first gives clean DB history and surfaces FK constraints before any code references them. This is also when the highest-risk operation (category string-to-FK backfill) must be done correctly.
**Delivers:** Three migrations — `course_categories` (+ seed 5 canonical categories), `courses` schema changes (`category_id` FK, drop `category` text, drop `vimeo_url`, add `duration_minutes`), `lessons` table (with `numeric` position, RLS policies). Updated `lib/types.ts` with `CourseCategoryRow` and `Lesson` interfaces.
**Addresses:** Course categories prerequisite, multi-lesson structure prerequisite, all P1 table stakes at schema level.
**Avoids:** Category FK NULL backfill pitfall, integer position pitfall, RLS empty-results pitfall — all three must be solved here.
**Research flag:** Standard patterns — Supabase migration and RLS patterns are well-documented and directly verified in existing codebase migrations (`event_categories`, `member_courses`). Skip research phase.

### Phase 2: Admin Category Management

**Rationale:** Categories must exist in the UI before the course form can reference them. This is a low-complexity, isolated deliverable that unblocks Phase 3.
**Delivers:** `CourseCategoriesPanel.tsx` with inline CRUD (create/edit/delete with course-count guard), tab bar on `/admin/courses` page (`?tab=courses` / `?tab=categories`), and the four Server Actions (`createCourseCategory`, `updateCourseCategory`, `deleteCourseCategory`).
**Uses:** `event_categories` schema pattern from existing codebase; URL-driven tab pattern from `app/admin/users/[id]/page.tsx`.
**Avoids:** Category delete 500 error pitfall (course-count guard in Server Action), hardcoded TypeScript strings pitfall (category dropdown fetches from DB).
**Research flag:** Standard patterns — mirrors existing admin tab and inline CRUD patterns exactly. Skip research phase.

### Phase 3: Premium Course Form

**Rationale:** `CourseForm.tsx` is the central admin entry point. Redesigning it (card sections, dynamic category select, duration slider, remove `vimeo_url`) clears the path for the lesson management UI in Phase 4, which lives inside the course edit page.
**Delivers:** Redesigned `CourseForm.tsx` with card-section layout, DB-driven category select, integer duration slider, removed `vimeo_url` field. Also updates member-side course form in `app/settings/courses/` (easy-to-miss integration point) and updates `AdminCoursesFilters.tsx` to fetch categories dynamically.
**Implements:** Premium SaaS card-section UI pattern (Thinkific-style grouped sections).
**Avoids:** Two-source-of-truth pitfall (DB-driven category select, no hardcoded fallback), missing member-side form update.
**Research flag:** Standard patterns — existing form patterns in `CourseForm.tsx` are well-understood; card section layout is Tailwind-only. Skip research phase.

### Phase 4: Lesson Management UI

**Rationale:** Lesson CRUD and drag-and-drop reordering are the highest-complexity UI work. They depend on the `lessons` table (Phase 1) and the course form redesign context (Phase 3). This phase has the most pitfall exposure.
**Delivers:** `LessonList.tsx` (dnd-kit sortable, SSR-disabled via `dynamic`), `LessonFormModal.tsx` (type-conditional: video/audio/text), lesson Server Actions in `actions.ts` (`createLesson`, `updateLesson`, `deleteLesson`, `reorderLessons`). Lesson management panel embedded in the course edit page. Also builds `lib/courses/video.ts` URL parser utility shared with Phase 5.
**Uses:** `react-lite-youtube-embed@^3.5.0` and `react-h5-audio-player@^3.10.2` (new installs), `@dnd-kit/sortable` (existing), `lib/courses/video.ts` URL parser (new).
**Avoids:** dnd-kit hydration mismatch (`dynamic` SSR-disabled import from day one), drag state flicker (optimistic update with snapshot rollback), Vimeo private video issue (oEmbed validation on lesson save).
**Research flag:** dnd-kit patterns are directly verified in `ProductsTable.tsx` — standard. Vimeo oEmbed validation and float-position drag math need careful implementation per PITFALLS.md integration gotchas table before building. Consult PITFALLS.md before starting this phase rather than running a research agent.

### Phase 5: Frontend Lesson Rendering

**Rationale:** The public-facing lesson player is the last piece. It depends on all schema work and the `lib/courses/video.ts` utility built in Phase 4. It is a pure consumer of data — no new DB changes.
**Delivers:** Updated `app/academy/[id]/page.tsx` (ordered lessons list with type icons and links), new `app/academy/[id]/lessons/[lessonId]/page.tsx` (Server Component wrapper with access gate + `VideoLesson`, `AudioLesson`, `TextLesson` client sub-components with `dynamic` SSR-disabled imports). REST API service updated to return `category_id` instead of `category` string.
**Implements:** Platform-aware lesson rendering using shared `lib/courses/video.ts` URL parser.
**Avoids:** Audio/video SSR errors (`dynamic` + `ssr: false` for all media components), loading Vimeo SDK on non-video lessons (conditional imports), Vimeo domain privacy issues (document localhost and preview URL setup for admins).
**Research flag:** Standard patterns for iframe embeds (Next.js official video guide verified). REST API shape change needs careful verification against existing API consumers. Skip research phase but verify API consumers before shipping.

### Phase Ordering Rationale

- Phases 1 and 2 are pure prerequisites. No lesson UI can be built before the schema exists; no dynamic category select can be built before the categories table is populated.
- Phase 3 (course form) follows Phase 2 because the redesigned form depends on the categories DB select. It precedes Phase 4 because lesson management lives inside the course edit page.
- Phase 4 (lesson management) is the implementation complexity peak — most pitfalls concentrate here. Isolating it after simpler admin work (Phases 2–3) keeps the critical path clean.
- Phase 5 (public rendering) is intentionally last because it is a pure consumer. It cannot be tested meaningfully until real lesson data exists from Phase 4.
- The `lib/courses/video.ts` URL parser utility bridges Phases 4 and 5 — build it at the start of Phase 4 and reuse in Phase 5.

### Research Flags

Phases needing careful PITFALLS.md consultation (not external research, but known-gotcha attention):
- **Phase 1:** Category FK backfill sequence is the highest-risk operation in the milestone. Follow the exact 6-step order in PITFALLS.md Pitfall 1 — no shortcuts.
- **Phase 4:** Float-position drag math, Vimeo oEmbed validation, and the `dynamic` SSR-disabled dnd-kit import pattern all need to be implemented correctly from the start, not fixed in QA. Review the full integration gotchas table in PITFALLS.md before building.

Phases with standard, low-risk patterns (skip research agent):
- **Phase 2:** Mirrors existing admin tab + inline CRUD patterns exactly. No novel patterns.
- **Phase 3:** Tailwind card-section layout plus dynamic DB select. No novel patterns.
- **Phase 5:** iframe embeds follow the Next.js official video guide exactly. REST API update is additive.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All new packages verified against React 19 and Next.js 16. react-lite-youtube-embed (Feb 2026) and react-h5-audio-player (Mar 2026) confirmed production-stable. All existing patterns verified directly in codebase. |
| Features | HIGH | Feature scope derived from direct codebase inspection + competitor analysis (Thinkific 2026, MasterStudy). Table stakes are well-established LMS patterns. Anti-features clearly justified with alternatives. |
| Architecture | HIGH | All component patterns have direct existing analogues in the codebase (ProductsTable.tsx, event_categories migration, FAQ admin CRUD). No novel architecture required. Build order verified against actual dependency graph. |
| Pitfalls | HIGH | Pitfalls sourced from direct codebase inspection of existing migration patterns, Supabase official RLS documentation, dnd-kit GitHub issues, and verified Vimeo privacy documentation. Each pitfall includes verified warning signs and recovery steps. |

**Overall confidence: HIGH**

### Gaps to Address

- **`user_lesson_progress` decision:** PITFALLS.md recommends adding this table in Phase 1 to avoid retroactive data problems. However, FEATURES.md marks lesson-level progress tracking as deferred (v2+). This is a deliberate design decision — but the team should explicitly acknowledge that `user_course_progress` semantics will be ambiguous for multi-lesson courses until lesson-level tracking is built. Document the interim completion model (e.g., "all lessons visible = course available; completion is manual or deferred to v2").

- **Vimeo embed domain allowlist:** The production custom domain and `localhost:3000` must both be added to Vimeo's embed allowlist before Phase 5 testing. This is an operational task outside the code build order but will block QA if forgotten.

- **REST API consumer audit:** The existing `/api/v1/courses` response shape changes (adding `category_id`, potentially removing `category` string). Any external API consumers beyond the web app need to be identified before Phase 5 ships. If none exist, this is low risk.

- **Duration migration for existing courses:** 8 existing seed courses have `duration` stored as freeform text (e.g., `"4h 30m"`). The Phase 1 migration must parse these strings to integer minutes. If any values are unparseable, they should default to `0` with a warning rather than failing the migration.

---

## Sources

### Primary (HIGH confidence)
- Existing codebase: `app/admin/shop/products/ProductsTable.tsx`, `app/admin/media/FolderSidebar.tsx` — dnd-kit pattern (verified)
- Existing codebase: `supabase/migrations/20260331100714_event_categories.sql` — category schema reference (verified)
- Existing codebase: `app/admin/courses/components/CourseForm.tsx`, `lib/types.ts`, `app/academy/[id]/page.tsx` — current state (verified)
- [Next.js 16 Video Guide](https://nextjs.org/docs/app/guides/videos) — iframe embed recommendation, updated 2026-03-31
- [react-lite-youtube-embed GitHub](https://github.com/ibrahimcesar/react-lite-youtube-embed) — v3.5.0, React 19 compat confirmed
- [react-h5-audio-player GitHub](https://github.com/lhz516/react-h5-audio-player) — v3.10.2, CSS import requirement, props API
- [Supabase RLS documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) — empty results on missing policies
- [Supabase RLS performance guide](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) — JOIN table RLS evaluation independence
- [Vimeo privacy settings](https://help.vimeo.com/hc/en-us/articles/12426199699985-About-video-privacy-settings) — private video embed restrictions
- [Vimeo domain-level privacy](https://help.vimeo.com/hc/en-us/articles/30030693052305-How-do-I-set-up-domain-level-privacy) — domain allowlist setup

### Secondary (MEDIUM confidence)
- [Thinkific New Course Builder 2026](https://support.thinkific.com/hc/en-us/articles/37547732533655-Introducing-Thinkific-s-New-Course-Builder) — card-section UX pattern (WebSearch verified)
- [Thinkific Lesson Types](https://support.thinkific.com/hc/en-us/articles/360030720053-Thinkific-Lesson-Types) — lesson type taxonomy (WebSearch, direct fetch 403)
- [MasterStudy LMS Lessons Docs](https://docs.stylemixthemes.com/masterstudy-lms/lms-course-features/lessons) — audio as first-class type (WebSearch)
- [MasterStudy LMS Categories Docs](https://docs.stylemixthemes.com/masterstudy-lms/lms-course-features/courses-category) — category fields: icon, color, slug, parent (WebSearch)
- [Float position for drag reorder](https://www.basedash.com/blog/implementing-re-ordering-at-the-database-level-our-experience) — single-row update pattern
- [Fractional indexing for ordered lists](https://hollos.dev/blog/fractional-indexing-a-solution-to-sorting/) — numeric midpoint math
- [dnd-kit hydration issue in Next.js](https://github.com/sujjeee/nextjs-dnd) — dynamic ssr: false solution
- [dnd-kit state flicker discussion](https://github.com/clauderic/dnd-kit/discussions/1522) — optimistic update race condition
- [Next.js hydration error solutions](https://nextjs.org/docs/messages/react-hydration-error) — dynamic with ssr: false

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
