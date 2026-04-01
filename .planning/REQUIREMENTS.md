# Requirements: GOYA v2

**Defined:** 2026-04-01
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.15 Requirements

Requirements for Course System Redesign milestone. Each maps to roadmap phases.

### Database Schema

- [x] **DB-01**: `course_categories` table created with id, name, slug (unique), description, color, parent_id, sort_order, created_at
- [x] **DB-02**: `course_categories` seeded with 5 categories: Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research
- [x] **DB-03**: `lessons` table created with id, course_id FK (CASCADE), title, type (video/audio/text), sort_order, short_description, description, video_platform (vimeo/youtube), video_url, audio_url, featured_image_url, duration_minutes, created_at, updated_at
- [x] **DB-04**: `courses.category_id` FK added, backfilled from existing `category` string, old `category` + `vimeo_url` columns dropped
- [x] **DB-05**: RLS policies on `course_categories` — admin/mod full CRUD, public SELECT
- [x] **DB-06**: RLS policies on `lessons` — admin/mod full CRUD, members SELECT published lessons of published courses, course creator SELECT own
- [x] **DB-07**: Supabase types regenerated and `npx tsc --noEmit` passes

### Admin Categories

- [x] **ACAT-01**: Admin courses page has Courses/Categories tab bar
- [x] **ACAT-02**: Categories tab shows table with color swatch, name, slug, parent, description, actions
- [x] **ACAT-03**: Admin can add category via modal with name (auto-generates slug), description, parent dropdown, color picker
- [x] **ACAT-04**: Admin can edit existing category
- [x] **ACAT-05**: Admin can delete category only if no courses reference it (shows count if blocked)

### Admin Course Form

- [x] **ACF-01**: Course form redesigned with card-section layout, modern SaaS aesthetic
- [x] **ACF-02**: Category field uses dynamic dropdown from `course_categories` table
- [x] **ACF-03**: Duration field is a slider (5–600 min, step 5, displays "Xh Ym")
- [x] **ACF-04**: `vimeo_url` removed from course form (moved to lessons)
- [ ] **ACF-05**: After saving new course, redirects to edit page for lesson management
- [x] **ACF-06**: Course type set automatically (admin=goya, member=member)
- [ ] **ACF-07**: Form is mobile responsive with smooth transitions

### Lesson Management

- [ ] **LM-01**: Course edit page has Lessons section with drag-and-drop reordering via @dnd-kit
- [ ] **LM-02**: Lesson list shows drag handle, number, title, type badge, duration, edit/delete actions
- [ ] **LM-03**: Empty state displays "No lessons yet" with add prompt
- [ ] **LM-04**: Add/edit lesson shows type selector as visual toggle cards (Video/Audio/Text)
- [ ] **LM-05**: Video lesson form: title, platform toggle (Vimeo/YouTube), video URL, descriptions, duration slider (1–180 min)
- [ ] **LM-06**: Audio lesson form: title, audio URL, featured image upload, descriptions, duration slider
- [ ] **LM-07**: Text lesson form: title, featured image, descriptions, duration slider
- [ ] **LM-08**: Drag-and-drop updates sort_order in DB
- [ ] **LM-09**: Drag-and-drop works on mobile (touch events)

### Frontend Academy

- [ ] **FA-01**: `/academy/[id]` fetches and displays lessons from lessons table with type icons, title, duration
- [ ] **FA-02**: `/academy/[id]/lesson` renders by type — Vimeo/YouTube embed, audio player, formatted text
- [ ] **FA-03**: Lesson ordering follows sort_order
- [ ] **FA-04**: Course cards on academy page show category color from DB
- [ ] **FA-05**: Member my-courses form includes same lesson management (no category tab)

## Future Requirements

### Course Enhancements (deferred)

- **CRS-F01**: `user_lesson_progress` table for per-lesson completion tracking
- **CRS-F02**: Rich text editor for text lessons (TipTap/Quill)
- **CRS-F03**: Vimeo oEmbed validation at save time
- **CRS-F04**: Course prerequisites and learning paths
- **CRS-F05**: Course certificates on completion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-lesson progress tracking | Deferred to future — current course-level progress sufficient for v1.15 |
| Rich text/WYSIWYG for lessons | Plain textarea for v1.15 — avoids TipTap dependency and XSS risk |
| Video file upload/hosting | External platforms only (Vimeo/YouTube) — no self-hosted video |
| Live streaming lessons | Out of scope — pre-recorded content only |
| Course quizzes/assessments | Separate feature, not part of lesson restructure |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 36 | Complete |
| DB-02 | Phase 36 | Complete |
| DB-03 | Phase 36 | Complete |
| DB-04 | Phase 36 | Complete |
| DB-05 | Phase 36 | Complete |
| DB-06 | Phase 36 | Complete |
| DB-07 | Phase 36 | Complete |
| ACAT-01 | Phase 37 | Complete |
| ACAT-02 | Phase 37 | Complete |
| ACAT-03 | Phase 37 | Complete |
| ACAT-04 | Phase 37 | Complete |
| ACAT-05 | Phase 37 | Complete |
| ACF-01 | Phase 38 | Complete |
| ACF-02 | Phase 38 | Complete |
| ACF-03 | Phase 38 | Complete |
| ACF-04 | Phase 38 | Complete |
| ACF-05 | Phase 38 | Pending |
| ACF-06 | Phase 38 | Complete |
| ACF-07 | Phase 38 | Pending |
| LM-01 | Phase 39 | Pending |
| LM-02 | Phase 39 | Pending |
| LM-03 | Phase 39 | Pending |
| LM-04 | Phase 39 | Pending |
| LM-05 | Phase 39 | Pending |
| LM-06 | Phase 39 | Pending |
| LM-07 | Phase 39 | Pending |
| LM-08 | Phase 39 | Pending |
| LM-09 | Phase 39 | Pending |
| FA-01 | Phase 40 | Pending |
| FA-02 | Phase 40 | Pending |
| FA-03 | Phase 40 | Pending |
| FA-04 | Phase 40 | Pending |
| FA-05 | Phase 40 | Pending |

**Coverage:**
- v1.15 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation — all 33 requirements mapped to Phases 36-40*
