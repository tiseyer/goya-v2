# Feature Research

**Domain:** Course system redesign — LMS admin course management with categories, multi-lesson support, drag-and-drop ordering, platform-aware video/audio embeds
**Researched:** 2026-04-01
**Confidence:** HIGH (existing codebase patterns verified, standard LMS patterns well-documented, dnd-kit already installed)

---

## Context: What Already Exists

The following are NOT new features — they must be preserved and extended:

- `courses` table with `title`, `category` (string), `level`, `access`, `status`, `vimeo_url`, `instructor`, `duration`, `course_type` (goya/member), `created_by`, `rejection_reason`, `deleted_at`, `gradient_from/to`, `thumbnail_url`
- Admin courses page: list table, filters, soft-delete/restore, pagination
- Admin course form (`CourseForm.tsx`): flat form for all fields including single `vimeo_url`
- `course_audit_log` + shared audit utility (`lib/courses/audit.ts`)
- Status workflow: draft → pending_review → published / rejected
- Public academy page with type filter
- My Courses settings page for member submissions
- `@dnd-kit/core ^6.3.1` and `@dnd-kit/sortable ^10.0.0` already installed and used in `ProductsTable.tsx` and media `FolderSidebar.tsx`
- Pattern for drag-and-drop: `DndContext` + `SortableContext` + `useSortable` + `arrayMove` + server action to persist `sort_order` / `priority`

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist for the admin to manage courses properly. Missing these = incomplete redesign.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Course categories as a managed DB table | Current hardcoded string enum cannot be edited at runtime; every LMS (Thinkific, Teachable, MasterStudy) uses a managed categories table | MEDIUM | Replaces `CourseCategory` type union. Needs `course_categories` table with `id`, `name`, `slug`, `description`, `color`, `sort_order`. Flat list only — no parent/hierarchy for yoga platform scale |
| Admin Courses/Categories tab layout | Admins expect to manage categories alongside courses, not in a separate settings page | LOW | Two tabs on `/admin/courses`: "Courses" (existing table) and "Categories" (new CRUD). Matches existing tab patterns in admin inbox and chatbot config |
| Category CRUD (create/edit/delete) | Any managed taxonomy needs in-page CRUD. Inline modal is the standard admin pattern | LOW | Inline modal dialog. Must prevent deletion of categories with assigned courses — show count and disable if > 0 |
| Multi-lesson structure per course | Every serious LMS (Thinkific, MasterStudy, Teachable) organizes courses into discrete lessons with an explicit order. A single `vimeo_url` on the course is a dead end | HIGH | New `lessons` table: `id`, `course_id`, `title`, `lesson_type` (video/audio/text), `sort_order`, `vimeo_url`, `youtube_url`, `audio_url`, `content`, `description`, `duration_minutes`, `is_published`, timestamps, RLS. Keep existing `vimeo_url` on `courses` for backward compatibility during migration |
| Lesson type-specific forms | Video, audio, and text lessons have different fields. Showing all fields for all types creates confusion and noise | MEDIUM | Conditional field rendering based on `lesson_type` selector. Video: platform auto-detect + URL field + preview. Audio: URL + optional description. Text: plain textarea. All share: title, description, duration, published toggle |
| Drag-and-drop lesson reordering | Expected in any modern course builder. Arbitrary ordering without DnD is unusable for 10+ lessons | MEDIUM | Use existing `@dnd-kit/core` + `@dnd-kit/sortable` pattern from `ProductsTable.tsx`. `SortableContext` with `verticalListSortingStrategy`. Persist `sort_order` integers on drag end via server action matching the `reorderProducts` pattern |
| Platform-aware video embed (Vimeo + YouTube) | Platform lock to Vimeo excludes YouTube-native instructors. Both platforms are standard on yoga content | MEDIUM | Utility function in `lib/courses/video.ts` that detects platform from URL (`vimeo.com` vs `youtube.com` / `youtu.be`) and generates the correct embed URL. Renders `<iframe loading="lazy">` per Next.js 16 official guidance. No third-party video library needed |
| Frontend lesson rendering | Users expect to watch/listen/read lessons on the public course detail page | MEDIUM | Lesson player component per type: Vimeo iframe, YouTube iframe, HTML5 `<audio controls>`, formatted text block. Responsive 16:9 aspect wrapper for video iframes |

### Differentiators (Competitive Advantage)

Features that go beyond baseline LMS patterns and align with GOYA's premium community positioning.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Premium SaaS course form with card sections | Flat single-scroll forms feel dated. Thinkific's 2026 builder uses grouped card sections with live preview and progressive disclosure — this pattern reduces cognitive load for admins creating complex courses | MEDIUM | Replace flat `CourseForm.tsx` with multi-section card layout. Sections: Basic Info, Media & Appearance, Lessons, Settings. Each section is a white rounded card with a heading. Duration as a slider (5–240 min) with formatted text preview ("1h 30m"). No separate page needed — same `/admin/courses/new` and `/admin/courses/[id]/edit` routes |
| Category color metadata | MasterStudy and similar platforms show colored category badges on course cards. Enables richer visual browsing on the public academy page | LOW | Add `color` (hex string) field to `course_categories`. Color picker in category CRUD modal. Render colored badge on course cards and in admin table — replaces the current hardcoded `CATEGORY_BADGE` record |
| Vimeo/YouTube URL preview in admin form | Admin can verify the video plays correctly before saving, reducing submission errors | LOW | After URL field blur, extract video ID and render a small `<iframe>` preview below the field. Purely client-side, no API call required |
| Audio lesson support | Yoga content (guided meditations, dharma talks, music playlists) is often audio-first. Audio as a first-class lesson type rather than a workaround is a meaningful differentiator vs. video-only platforms | LOW | `audio_url` field on lessons table. Frontend: HTML5 `<audio controls>` element styled with Tailwind to match GOYA design tokens — thin wrapper, no npm dependency |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Rich text / WYSIWYG editor for text lessons | Natural choice for "Text" lesson type | Adds a heavy dependency (TipTap, Quill, Slate ~200KB+). High maintenance burden. Most yoga content is paragraphs and links, not complex layouts. Introduces XSS risk if not carefully sanitized | Plain `<textarea>` with `whitespace-pre-wrap` rendering in v1.15. Markdown support only when demand is validated in a future milestone |
| Hierarchical / nested categories | "Workshop > Restorative > Beginner" nesting seems useful | Over-engineering for a platform with under 100 courses. Requires recursive DB queries, complex tree UI, and the current 5-item category list is flat for a reason | Flat category list with `sort_order`. Tags can be added in v2 if more granularity is needed |
| Video upload and hosting on GOYA | Full control, no third-party dependency | Vercel Blob is not optimized for adaptive video streaming. Adds storage cost, transcoding complexity, and no CDN optimization. Vimeo/YouTube handle all of this for free with better global delivery | Keep external platform embedding. Store URL only. Vimeo Pro handles instructor-uploaded content |
| Quiz / assessment within lessons | Seen in Thinkific/Teachable, often requested for CPD | CPD credit logging already has its own separate system. A quiz engine is a different product domain with its own DB schema, grading logic, and UX. Enormous scope | Not in v1.15. CPD credit submission flow already handles accreditation |
| Lesson-level user progress tracking | Expected in consumer LMS products | `user_course_progress` table exists for course-level progress. Lesson-level granularity requires a new table, API changes, and frontend tracking across every lesson view. Scope creep | Course-level progress stays. Lesson progress is a dedicated learner experience milestone |
| react-player or video.js library | Attractive unified API for Vimeo, YouTube, HLS, RTMP | Adds ~100KB to bundle for use cases that a 20-line URL parser + `<iframe>` handles. Next.js 16 official video guide explicitly recommends direct `<iframe>` for external platform embeds | Custom URL parser + `<iframe>`. Only add react-player if HLS streaming or multiple simultaneous video sources are required (not in scope) |

---

## Feature Dependencies

```
course_categories table
    └──enables──> Category CRUD admin UI
    └──enables──> category_id FK on courses table (replaces string category)
                      └──enables──> Category filter on admin courses list
                      └──enables──> Colored category badge on public academy page

lessons table (with sort_order, lesson_type)
    └──migration sequence──> After course_categories migration (clean DB history)
    └──enables──> Lesson type-specific form fields (video / audio / text)
    └──enables──> Drag-and-drop lesson reordering (sort_order column)
    └──enables──> Frontend lesson renderer (iframe, audio, text)

Platform-aware video URL parser (lib/courses/video.ts)
    └──used by──> Lesson form (URL validation + embed preview)
    └──used by──> Frontend lesson renderer (generate iframe src)

Premium course form (card sections)
    └──requires──> lessons table (Lessons card section shows lesson list)
    └──contains──> Lesson management UI (lessons created within course edit form)

drag-and-drop lesson reordering
    └──requires──> sort_order column on lessons table
    └──reuses──> @dnd-kit/core + @dnd-kit/sortable (already installed)
    └──reuses──> ProductsTable.tsx pattern (DndContext, SortableContext, arrayMove, server action)
```

### Dependency Notes

- **course_categories before lessons:** No hard technical dependency, but running the categories migration first keeps DB history clean and avoids a combined mega-migration
- **drag-and-drop requires sort_order:** The integer column must exist in the `lessons` table before the DnD UI is built. Pattern is identical to `products.priority` in `ProductsTable.tsx` — HIGH confidence it works
- **URL parser is shared infrastructure:** The same `lib/courses/video.ts` utility serves both the admin form preview and the public lesson renderer. Build once, use in both places
- **category_id FK is additive:** Add `category_id` as a nullable FK alongside the existing `category` string column. Migrate data in the same migration. Keep `category` temporarily for backward compatibility with existing API routes (v1.6 REST API)

---

## MVP Definition (This Milestone: v1.15)

All items below are in scope for v1.15. This is not a prioritized backlog — it is the full target.

### Phase 1: Database Foundation

- [ ] `course_categories` migration with RLS — `id`, `name`, `slug`, `description`, `color`, `sort_order`, timestamps
- [ ] `lessons` migration with RLS — `id`, `course_id`, `title`, `lesson_type`, `sort_order`, `vimeo_url`, `youtube_url`, `audio_url`, `content`, `description`, `duration_minutes`, `is_published`, timestamps
- [ ] Add `category_id` (FK → course_categories) to courses table, keep `category` string for compat
- [ ] Seed default categories from current `CourseCategory` values (Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research)

### Phase 2: Admin Categories Tab

- [ ] Add "Courses / Categories" tab switcher to `/admin/courses` page
- [ ] Categories tab: list table with name, slug, color badge, course count, sort_order
- [ ] Inline modal for create/edit (name, slug auto-generated, description, color picker)
- [ ] Delete with guard — show course count, disable delete if courses are assigned

### Phase 3: Premium Course Form

- [ ] Redesign `CourseForm.tsx` with card section layout (Basic Info, Appearance, Lessons, Settings)
- [ ] Category field is now a dynamic select populated from `course_categories` table
- [ ] Duration as slider (5–240 min) with formatted "Xh Ym" display
- [ ] `vimeo_url` on courses table becomes legacy — new video content lives in lessons

### Phase 4: Lesson Management UI

- [ ] Lesson list panel within course edit page (inline, not a separate route)
- [ ] Add/edit lesson via expandable inline panel or modal
- [ ] Type selector (Video / Audio / Text) shows/hides relevant fields
- [ ] Video: platform auto-detect from URL, iframe preview below field
- [ ] Audio: `audio_url` field + optional description
- [ ] Text: plain textarea (no WYSIWYG)
- [ ] Drag-and-drop reorder using `@dnd-kit/core` + `@dnd-kit/sortable` (existing pattern)
- [ ] Persist `sort_order` on drag end via server action

### Phase 5: Frontend Lesson Rendering

- [ ] Course detail page lists lessons with type icons and duration
- [ ] Video lessons: responsive 16:9 `<iframe loading="lazy">` for Vimeo and YouTube
- [ ] Audio lessons: HTML5 `<audio controls>` with Tailwind-styled wrapper
- [ ] Text lessons: `whitespace-pre-wrap` formatted text block

### Deferred (v2+)

- [ ] Lesson-level user progress tracking — separate learner experience milestone
- [ ] Quiz / assessment within lessons — separate product domain
- [ ] Hierarchical category nesting — only if flat list proves insufficient at scale
- [ ] Rich text / Markdown rendering for text lessons — only after demand validated

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| course_categories DB + admin CRUD | HIGH | LOW | P1 |
| lessons DB schema + RLS | HIGH | MEDIUM | P1 |
| Category FK on courses + seeded data | HIGH | LOW | P1 |
| Lesson management UI (type-specific forms) | HIGH | HIGH | P1 |
| Drag-and-drop lesson reordering | HIGH | MEDIUM | P1 |
| Platform-aware video embed (Vimeo + YouTube) | HIGH | LOW | P1 |
| Frontend lesson renderer | HIGH | MEDIUM | P1 |
| Premium card-section course form | MEDIUM | MEDIUM | P1 |
| Duration slider on course form | LOW | LOW | P2 |
| Category color picker + colored badges | MEDIUM | LOW | P2 |
| URL preview in lesson form | MEDIUM | LOW | P2 |
| Styled audio player wrapper | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for v1.15
- P2: Should have — include if time allows
- P3: Nice to have — defer if behind schedule

---

## Competitor Feature Analysis

| Feature | Thinkific (2026) | MasterStudy LMS | GOYA v1.15 Approach |
|---------|-----------------|-----------------|---------------------|
| Category management | Tag/category system with colors, admin-managed | Full category CRUD with icon + color + parent hierarchy | Flat `course_categories` table, color field, no hierarchy |
| Lesson types | Video, Audio, Text, PDF, Quiz, Presentation, Multimedia | Video, Audio, Text, Quiz | Video, Audio, Text — no quiz (CPD handles accreditation separately) |
| Lesson ordering | Drag-and-drop in course builder | Drag-and-drop | dnd-kit (already in codebase at `@dnd-kit/sortable ^10.0.0`) |
| Video platforms | Upload to Thinkific OR embed YouTube | Vimeo, YouTube, Wistia | URL-parsed iframe for Vimeo + YouTube; no video hosting |
| Course form layout | New 2026 builder: card sections, live preview | Wizard-style multi-step | Card sections; no wizard (admin power-user context) |
| Audio player | Native HTML5 | Custom player with waveform | Native HTML5 with thin Tailwind wrapper |
| Text lessons | Full rich text editor (HTML output) | Rich text editor | Plain textarea — no WYSIWYG in v1.15 |

---

## Sources

- [Next.js 16 Video Embedding Guide](https://nextjs.org/docs/app/guides/videos) — Authoritative recommendation for `<iframe>` for external platforms (Vimeo/YouTube). Version 16.2.1, updated 2026-03-31. HIGH confidence
- [Thinkific New Course Builder 2026](https://support.thinkific.com/hc/en-us/articles/37547732533655-Introducing-Thinkific-s-New-Course-Builder) — Card section layout with live preview confirmed as current best-in-class UX pattern. MEDIUM confidence (WebSearch verified)
- [Thinkific Lesson Types](https://support.thinkific.com/hc/en-us/articles/360030720053-Thinkific-Lesson-Types) — Lesson type taxonomy: Video, Audio, Text, PDF, Quiz, Presentation, Multimedia. MEDIUM confidence (WebSearch verified, direct fetch returned 403)
- [MasterStudy LMS Lessons Docs](https://docs.stylemixthemes.com/masterstudy-lms/lms-course-features/lessons) — Audio Lesson as first-class type. MEDIUM confidence (WebSearch)
- [MasterStudy LMS Categories Docs](https://docs.stylemixthemes.com/masterstudy-lms/lms-course-features/courses-category) — Standard category fields: icon, color, slug, parent. MEDIUM confidence (WebSearch)
- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable) — v10.0.0 installed in project. HIGH confidence (verified in `package.json`)
- [dnd-kit Sortable Documentation](https://docs.dndkit.com/presets/sortable) — SortableContext, useSortable, arrayMove API. HIGH confidence (cross-referenced with `ProductsTable.tsx` in codebase)
- Codebase: `app/admin/shop/products/ProductsTable.tsx` — Existing dnd-kit sortable implementation with `DndContext`, `SortableContext`, `useSortable`, `arrayMove`, server action pattern. HIGH confidence (direct code read)
- Codebase: `app/admin/courses/components/CourseForm.tsx` — Current form fields, vimeo_url field, flat layout. HIGH confidence (direct code read)
- Codebase: `lib/types.ts` — Current `CourseCategory`, `Course` type definitions. HIGH confidence (direct code read)

---

*Feature research for: GOYA v2 — v1.15 Course System Redesign*
*Researched: 2026-04-01*
