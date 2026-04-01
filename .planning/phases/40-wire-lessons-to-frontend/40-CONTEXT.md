# Phase 40: Wire Lessons to Frontend - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the lessons system to the public academy pages and member my-courses. Course detail shows lesson list, lesson player renders by type (Video/Audio/Text), category colors on course cards, member lesson management reuses admin components.

Requirements: FA-01, FA-02, FA-03, FA-04, FA-05

</domain>

<decisions>
## Implementation Decisions

### Lesson Display on Academy
- Lesson list on /academy/[id]: ordered card list with type icon, title, duration below course description
- Lesson player at `/academy/[id]/lesson/[lessonId]` — dedicated page per lesson
- Video embed: direct `<iframe loading="lazy">` for both Vimeo and YouTube (per Next.js docs recommendation)
- Audio player: native `<audio>` element with controls (no extra library for v1.15)
- Text lessons: formatted description content

### Category Colors & Member Courses
- Category color on academy course cards: small colored dot/badge next to category name
- Member my-courses at /settings/my-courses: reuse same LessonList + LessonForm components from admin
- Fix all 6 files still referencing old `course.category` text and `course.duration` text columns — update to use category_id join and duration_minutes

### Claude's Discretion
- Exact lesson card styling
- Lesson navigation (prev/next)
- Error handling for missing/invalid video URLs

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/courses/components/LessonList.tsx` — drag-and-drop sortable list (reuse for member courses)
- `app/admin/courses/components/LessonForm.tsx` — type-specific form (reuse for member courses)
- `app/admin/courses/lesson-actions.ts` — fetchLessons, createLesson, updateLesson, deleteLesson, reorderLesson
- `app/academy/[id]/page.tsx` — existing course detail page
- `app/academy/page.tsx` — existing academy listing page
- `app/settings/my-courses/MyCoursesClient.tsx` — member course management

### Files Needing Stale Reference Fixes
- `app/admin/courses/page.tsx` — references course.category (text)
- `app/academy/page.tsx` — references course.category (text)
- `app/academy/[id]/page.tsx` — references course.category, course.duration
- `app/settings/my-courses/MyCoursesClient.tsx` — references course.category, course.vimeo_url, course.duration
- `app/admin/inbox/CoursesTab.tsx` — references course.category

### Integration Points
- `lessons` table — fetch for public display
- `course_categories` table — join for category name and color
- `/academy/[id]` — add lesson list
- `/academy/[id]/lesson/[lessonId]` — new route for lesson player
- `/settings/my-courses` — add lesson management

</code_context>

<specifics>
## Specific Ideas

- Lesson ordering follows sort_order (not insertion order)
- Type icons on lesson cards: 🎬 Video, 🎵 Audio, 📝 Text
- Vimeo embed URL format: https://player.vimeo.com/video/{id}
- YouTube embed URL format: https://www.youtube.com/embed/{id}
- Extract video ID from various URL formats (watch?v=, youtu.be/, vimeo.com/)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
