# v1.15 Course System Redesign

**Status:** ✅ Complete
**Date:** 2026-04-01
**Phases:** 5 (36-40), 33 requirements

## Deliverables

- [x] **Phase 36: Database Migrations** — `course_categories` table (5 seeds), `lessons` table with float sort_order, `courses.category_id` FK with backfill, `duration_minutes`, RLS policies, types regenerated
- [x] **Phase 37: Admin Courses — Tabs + Categories** — Courses/Categories tab bar with URL params, category table with color swatches, add/edit modal with auto-slug, delete guard with course count
- [x] **Phase 38: Course Creation Form — UI Redesign** — 3 card-section layout (Basic Info, Content, Settings), DB-driven category dropdown with color dots, duration slider (5-600min), removed vimeo_url, post-save redirect to edit for lessons
- [x] **Phase 39: Lesson Management — UI + Logic** — @dnd-kit sortable list with TouchSensor, float midpoint reorder, type-specific forms (Video/Audio/Text), platform toggle (Vimeo/YouTube), inline expandable form, 5 server actions
- [x] **Phase 40: Wire Lessons to Frontend** — Academy lesson list with type icons, per-lesson player page (/academy/[id]/lesson/[lessonId]), category color dots on course cards, member my-courses lesson management reusing admin components, fixed all stale column references

## Key Files Created/Modified

### New Files
- `supabase/migrations/20260379_course_categories.sql` — course_categories table + seeds
- `supabase/migrations/20260380_lessons_table.sql` — lessons table
- `supabase/migrations/20260381_courses_category_fk_migration.sql` — courses schema migration
- `supabase/migrations/20260382_course_categories_rls.sql` — category RLS
- `supabase/migrations/20260383_lessons_rls.sql` — lessons RLS
- `lib/courses/categories.ts` — CourseCategory type, helpers
- `lib/courses/lessons.ts` — Lesson types
- `app/admin/courses/category-actions.ts` — category CRUD server actions
- `app/admin/courses/lesson-actions.ts` — lesson CRUD + reorder server actions
- `app/admin/courses/AdminCategoriesTab.tsx` — categories table component
- `app/admin/courses/CategoryModal.tsx` — add/edit category modal
- `app/admin/courses/components/LessonList.tsx` — dnd-kit sortable lesson list
- `app/admin/courses/components/LessonForm.tsx` — type-specific lesson form
- `app/admin/courses/[id]/edit/LessonSection.tsx` — SSR-safe lesson wrapper
- `app/academy/[id]/lesson/[lessonId]/page.tsx` — per-lesson player page
- `app/academy/[id]/lesson/[lessonId]/actions.ts` — markLessonComplete action

### Modified Files
- `lib/types.ts` — Course interface updated (category_id, duration_minutes, removed legacy fields)
- `types/supabase.ts` — regenerated with new tables
- `app/admin/courses/page.tsx` — tab bar, DB category colors
- `app/admin/courses/components/CourseForm.tsx` — full redesign with card sections
- `app/admin/courses/[id]/edit/page.tsx` — parallel fetch of categories + lessons
- `app/admin/courses/AdminCoursesFilters.tsx` — DB-driven category filter
- `app/academy/page.tsx` — category color dots, fixed stale refs
- `app/academy/[id]/page.tsx` — lesson list display
- `app/academy/[id]/lesson/page.tsx` — redirect to first lesson
- `app/settings/my-courses/MyCoursesClient.tsx` — lesson management, fixed stale refs
- `app/settings/my-courses/page.tsx` — categories fetch
- `app/settings/my-courses/actions.ts` — updated to new schema

## Technical Decisions
- Float numeric `sort_order` for lessons — enables single-row drag reorder via midpoint math
- `next/dynamic({ ssr: false })` for dnd-kit components — prevents hydration mismatch
- Direct `<iframe>` for video embeds (per Next.js docs) — no extra library needed
- Native `<audio>` for audio lessons — simple, no extra dependency
- Category FK backfill: add column → seed → UPDATE → verify → drop old column
