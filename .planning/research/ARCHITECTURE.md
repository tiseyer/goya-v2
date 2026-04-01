# Architecture Research

**Domain:** Course system redesign — categories, multi-lesson, drag-and-drop ordering, platform-aware video/audio
**Researched:** 2026-04-01
**Confidence:** HIGH (all findings from direct codebase inspection)

---

## How New Features Plug Into the Existing Architecture

This is an integration architecture document. It maps each new v1.15 feature to the existing code it touches, the new code it requires, and the order those pieces must be built.

---

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│  Next.js 16 App Router  (Server Components + Server Actions)   │
│                                                                │
│  app/admin/courses/                                            │
│  ├── page.tsx              MODIFY: add Courses/Categories tab  │
│  ├── actions.ts            MODIFY: add lesson + category       │
│  │                                  Server Actions             │
│  ├── new/page.tsx          MODIFY: pass categories prop        │
│  ├── [id]/page.tsx         MODIFY: add LessonList section      │
│  ├── [id]/edit/            MODIFY: pass categories prop        │
│  └── components/                                               │
│      ├── CourseForm.tsx    MODIFY: rm vimeo_url, category→FK,  │
│      │                             duration slider, card UI    │
│      ├── LessonList.tsx    NEW: dnd-kit sortable lessons       │
│      ├── LessonFormModal.tsx NEW: type-conditional lesson form │
│      └── CourseCategoriesPanel.tsx NEW: inline category CRUD  │
│                                                                │
│  app/academy/                                                  │
│  ├── page.tsx              no change                           │
│  └── [id]/                                                     │
│      ├── page.tsx          MODIFY: add ordered lessons list    │
│      └── lessons/[lessonId]/                                   │
│          └── page.tsx      NEW: Video/Audio/Text render        │
└──────────────────────────┬─────────────────────────────────────┘
                           │ Supabase SSR client
┌──────────────────────────▼─────────────────────────────────────┐
│  Supabase (PostgreSQL + RLS)                                   │
│                                                                │
│  courses          MODIFY: category text→uuid FK, drop          │
│                           vimeo_url, add duration_minutes      │
│  course_categories NEW: replaces 5 hardcoded string values     │
│  lessons           NEW: multi-lesson per course, sort_order    │
└────────────────────────────────────────────────────────────────┘
```

---

## Database: What Changes, What Is New

### courses table — MODIFY (three-step migration)

| Column | Change | Why |
|--------|--------|-----|
| `category text CHECK(IN(...))` | Replace with `category_id uuid REFERENCES course_categories(id)` | Enable admin CRUD of categories without code deployments |
| `vimeo_url text` | DROP | Replaced by per-lesson `video_url` + `video_platform` |
| `duration text` | Add `duration_minutes integer` alongside; backfill; keep old column for one release as fallback | Slider needs integer; existing data is "4h 30m" strings |

**Three-step migration approach for `category`:**
1. Add `category_id uuid REFERENCES course_categories(id)` (nullable first)
2. Seed `course_categories` with the 5 existing values; UPDATE `courses` to set `category_id` from the seed
3. Add NOT NULL constraint; drop `category text`

Attempting a single ALTER that drops-and-adds in one transaction risks a lock on a table with live data. Three steps are safer.

### course_categories table — NEW

Mirror of `event_categories` (migration `20260331100714_event_categories.sql`). That table is the authoritative reference pattern for this codebase:

```sql
CREATE TABLE public.course_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  color       text        NOT NULL DEFAULT '#345c83',
  sort_order  integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
```

No `parent_id` for v1.15 (flat list). Defer if subcategories needed later.

**RLS — copy `event_categories` verbatim:**
- `SELECT`: public (any)
- `INSERT/UPDATE/DELETE`: admin or moderator role only

**Seed data in the same migration:** The 5 existing hardcoded values (`Workshop`, `Yoga Sequence`, `Dharma Talk`, `Music Playlist`, `Research`) become rows with appropriate slugs.

### lessons table — NEW

```sql
CREATE TABLE public.lessons (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        uuid        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title            text        NOT NULL,
  description      text,
  lesson_type      text        NOT NULL CHECK (lesson_type IN ('video', 'audio', 'text')),
  sort_order       integer     NOT NULL DEFAULT 0,

  -- Video fields (lesson_type = 'video')
  video_platform   text        CHECK (video_platform IN ('vimeo', 'youtube')),
  video_url        text,

  -- Audio fields (lesson_type = 'audio')
  audio_url        text,
  audio_duration   integer,    -- seconds

  -- Text content (lesson_type = 'text')
  content          text,

  -- Shared
  duration_minutes integer,
  is_preview       boolean     NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_lessons_course_id
  ON public.lessons(course_id);
CREATE INDEX idx_lessons_course_sort
  ON public.lessons(course_id, sort_order);
```

**Why explicit `video_platform` field:** The old `vimeo_url` was Vimeo-only. A separate platform column lets the frontend switch embed format without URL-guessing. Store the full user-pasted URL in `video_url`; parse out the embed ID at render time in a utility function.

**RLS for lessons:**
- `SELECT`: public, but only for lessons whose course is published (`JOIN courses ON courses.id = lessons.course_id WHERE courses.status = 'published'`)
- `ALL`: admin or moderator (same pattern as courses table)
- Members do NOT manage lessons in v1.15 — lesson management is admin/mod only

---

## Component Boundaries: New vs Modified

### MODIFIED: CourseForm.tsx

**Current state:** Single flat form with `vimeo_url` text input, `category` as a `<select>` over a hardcoded `CATEGORIES` constant, `duration` as free text, no card sectioning.

**Required changes:**
1. Replace the hardcoded `CATEGORIES` `<select>` with a `<select>` populated from a `categories` prop (array of `CourseCategoryRow`). The parent Server Component fetches categories and passes them down — the form itself stays `'use client'` and receives them as a serializable prop.
2. Remove `vimeoUrl` state and the corresponding input field entirely.
3. Add `durationMinutes: number` state; render as `<input type="range" min={0} max={300} step={15}>` with a formatted label ("2h 30m"). Map to `duration_minutes` column.
4. Wrap logical groups in card sections (title/category/level block; access/status block; media/content block). This is the "premium SaaS UI" requirement.

**Parent server page pattern (same for new and edit):**
```typescript
const { data: categories } = await supabase
  .from('course_categories')
  .select('*')
  .order('sort_order');

<CourseForm course={course} categories={categories ?? []} />
```

### NEW: LessonList.tsx ('use client', in app/admin/courses/components/)

The drag-and-drop pattern is already established in two places in this codebase:
- `app/admin/shop/products/ProductsTable.tsx` — `DndContext` + `SortableContext` + `useSortable` + `arrayMove` on `DragEndEvent`
- `app/admin/media/FolderSidebar.tsx` — identical imports, same structure

Both use `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`. No new npm installs required.

**LessonList responsibilities:**
- Receive `initialLessons: Lesson[]` and `courseId: string` as props from the course detail Server Component
- Own local `lessons: Lesson[]` state (optimistic updates)
- Render each lesson as a `SortableLessonRow` sub-component (same file)
- On `DragEndEvent`: `arrayMove` locally, then call `reorderLessons(courseId, orderedIds)` Server Action
- "Add Lesson" button opens `LessonFormModal`
- Each row: drag handle, title, type badge, duration, edit icon, delete icon

**SortableLessonRow** follows the pattern from `ProductsTable.tsx`:
```typescript
const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
  useSortable({ id: lesson.id });
const style = { transform: CSS.Transform.toString(transform), transition };
```

### NEW: LessonFormModal.tsx ('use client')

Type-conditional fields:
- `video`: platform radio (`vimeo` / `youtube`) + URL text input
- `audio`: URL input + optional duration-in-seconds input
- `text`: `<textarea>` for markdown/plain content

Controlled form with `useState`. On save, calls `createLesson` or `updateLesson` Server Action. On success, calls an `onSave(lesson)` callback to update `LessonList`'s local state — no `router.refresh()` needed.

### NEW: CourseCategoriesPanel.tsx ('use client', in app/admin/courses/components/)

Inline CRUD table rendered in the Categories tab. Receives `initialCategories` as a prop from the Server Component. Manages local state. Each row: name, slug, color swatch, sort_order, edit/delete icons. "Add Category" opens an inline form row (same pattern as FAQ admin in `app/admin/chatbot/faq/`).

Server Actions: `createCourseCategory`, `updateCourseCategory`, `deleteCourseCategory`.
Deletion guard: the Server Action checks `COUNT(*) FROM courses WHERE category_id = $id` before deleting; returns an error string if > 0.

### MODIFIED: app/admin/courses/page.tsx

Add a tab bar at the top using `searchParams.tab` (URL-driven, no client state). Pattern: `?tab=courses` (default) renders existing course table; `?tab=categories` renders `<CourseCategoriesPanel>`.

This matches the established URL-param tab pattern from `app/admin/users/[id]/page.tsx` (`?tab=connections`), `app/admin/inbox/page.tsx`, and `app/admin/chatbot/`.

### MODIFIED: app/admin/courses/[id]/page.tsx

Add a `LessonList` section below the course detail. Server Component fetches lessons ordered by `sort_order` and passes them to `LessonList` as `initialLessons`.

### MODIFIED: app/academy/[id]/page.tsx

Currently hardcodes `lessonTitle = \`Video – ${course.title}\`` — this is a placeholder. Replace with:
1. Query `lessons WHERE course_id = $id ORDER BY sort_order`
2. Render a lessons list with type icons and durations
3. Each lesson links to `/academy/[courseId]/lessons/[lessonId]`

### NEW: app/academy/[id]/lessons/[lessonId]/page.tsx

Server Component. Fetches lesson joined to course (for access check). Renders based on `lesson_type`:
- `video`: extract embed ID from `video_url` in a utility function; render `<iframe>` with Vimeo or YouTube embed URL
- `audio`: HTML5 `<audio controls src={lesson.audio_url} />`
- `text`: render `lesson.content` with prose typography classes

Access gate: if `course.access === 'members_only'` and no authenticated user, redirect to sign-in.

---

## Data Flow

### Admin: Create/Edit Course

```
CourseForm (client)
  → Server Action: upsertCourse({ ...fields, category_id, duration_minutes })
    → supabase.from('courses').upsert(payload)
    → logAdminCourseAction(courseId, 'edited', changes)
    → router.push('/admin/courses/[id]')
```

The payload shape changes from `{ category: 'Workshop' }` to `{ category_id: uuid }`. The `actions.ts` audit call is unchanged — it still logs to `course_audit_log`.

### Admin: Reorder Lessons

```
LessonList DragEndEvent
  → arrayMove(lessons, oldIndex, newIndex)    [optimistic, instant]
  → reorderLessons(courseId, orderedIds)       [Server Action]
    → Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('lessons').update({ sort_order: i }).eq('id', id)
        )
      )
```

Identical to `reorderProducts` in `app/admin/shop/products/actions.ts`.

### Admin: Category CRUD

```
CourseCategoriesPanel (client)
  → createCourseCategory({ name, slug, color, sort_order })
    → supabase.from('course_categories').insert(payload)
    → return created row
  → onSave(row): update local state in panel

deleteCourseCategory(id)
  → count = SELECT COUNT(*) FROM courses WHERE category_id = $id
  → if count > 0: return { error: 'Category in use by N courses' }
  → supabase.from('course_categories').delete().eq('id', id)
```

### Public: Render Lesson

```
GET /academy/[courseId]/lessons/[lessonId]  (Server Component)
  → supabase.from('lessons')
      .select('*, courses(access, status)')
      .eq('id', lessonId)
      .single()
  → if course.access = 'members_only' AND !user: redirect('/sign-in')
  → if lesson.lesson_type = 'video': extractEmbedId(lesson.video_platform, lesson.video_url)
  → render based on lesson_type
```

---

## File Structure: What Gets Added

```
app/admin/courses/
├── page.tsx                       MODIFY — add ?tab= bar
├── actions.ts                     MODIFY — add reorderLessons, category CRUD actions
├── components/
│   ├── CourseForm.tsx             MODIFY — category FK, rm vimeo_url, duration slider
│   ├── LessonList.tsx             NEW    — dnd-kit sortable list
│   ├── LessonFormModal.tsx        NEW    — type-conditional lesson form
│   └── CourseCategoriesPanel.tsx  NEW    — inline category CRUD

app/academy/
└── [id]/
    ├── page.tsx                   MODIFY — add lessons list
    └── lessons/
        └── [lessonId]/
            └── page.tsx           NEW    — lesson detail with embed

supabase/migrations/
├── XXXX_course_categories.sql     NEW — table + RLS + seed 5 existing categories
├── XXXX_courses_redesign.sql      NEW — add category_id, backfill, drop category text,
│                                         drop vimeo_url, add duration_minutes
└── XXXX_lessons.sql               NEW — lessons table + RLS + indexes

lib/types.ts
  MODIFY — add CourseCategoryRow interface
  MODIFY — add Lesson interface
  MODIFY — update Course: category_id (uuid) not category (string), remove vimeo_url
```

---

## Build Order

Hard dependency chain — do not start a step before its dependency is complete.

| Step | Work | Blocks Step(s) |
|------|------|----------------|
| 1 | Migration: `course_categories` table + RLS + seed | 2, 4 |
| 2 | Migration: `courses` schema changes (category_id, drop category, drop vimeo_url, duration_minutes) | 3, 4 |
| 3 | Migration: `lessons` table + RLS + indexes | 5, 8 |
| 4 | Update `lib/types.ts`: CourseCategoryRow, Lesson, update Course | 5, 6, 7 |
| 5 | `CourseForm.tsx`: category FK select, rm vimeo_url, duration slider, card sections | 6 |
| 6 | Admin `page.tsx` tab bar + `CourseCategoriesPanel` + category Server Actions | — |
| 7 | `LessonList.tsx` + `LessonFormModal.tsx` + lesson Server Actions in `actions.ts` | 8 |
| 8 | `app/academy/[id]/page.tsx`: add lessons list + `app/academy/[id]/lessons/[lessonId]/page.tsx` | — |

Steps 1–4 are pure infrastructure. Steps 5–6 are admin form UI. Steps 7–8 are lesson management + public rendering.

---

## Integration Points With Existing Code

| Existing System | How v1.15 Touches It | Risk |
|----------------|----------------------|------|
| `courses` RLS policies | None of the existing policies reference the `category` or `vimeo_url` columns — column changes do not break RLS | LOW |
| `user_course_progress` table | Unchanged. Progress tracking stays at course granularity. Lesson-level progress is out of scope. | NONE |
| `app/settings/courses/` (Member Courses) | This page has its own course form that also contains `vimeo_url`. Must be updated alongside `CourseForm.tsx`. Easy to miss. | MEDIUM — verify and update |
| `lib/api/services/` REST API | The courses service returns raw `category` text. After migration, join `course_categories` and return `category: { id, name, slug }`. The API response shape changes — update service + `API_DOCS.md`. | MEDIUM |
| `lib/types.ts` `CourseCategory` type | The union type `'Workshop' | 'Yoga Sequence' | ...` becomes obsolete. Replace with `CourseCategoryRow` interface (DB-driven). Remove the old `CourseCategory` type union. | LOW — TypeScript will surface all usages |
| `lib/courses/audit.ts` | No changes. Audit log entries reference `course_id` only. Category and lesson changes fire with action `'edited'` and a `changes` JSONB payload — no schema changes needed. | NONE |
| `app/admin/courses/AdminCoursesFilters.tsx` | Filter dropdown for category is currently hardcoded from `CourseCategory` union. Must be updated to fetch `course_categories` dynamically. | MEDIUM — easy to overlook |
| `app/academy/[id]/page.tsx` hardcoded `lessonTitle` | Currently: `lessonTitle = \`Video – ${course.title}\`` — this is the primary mutation point on the public side. | LOW — isolated, small change |

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Keeping the hardcoded CATEGORIES constant as a fallback

**What people do:** Leave `const CATEGORIES = ['Workshop', ...]` in `CourseForm.tsx` and `AdminCoursesFilters.tsx` "just in case" the DB query is empty.
**Why it's wrong:** Two sources of truth. Adding a category in the DB won't appear in filters; deleting one won't remove it from the dropdown.
**Do this instead:** Pass categories as a prop everywhere. If the DB returns empty (edge case), show an empty dropdown with a placeholder. Never fall back to the hardcoded list.

### Anti-Pattern 2: Managing lesson state in the parent Server Component

**What people do:** Call `router.refresh()` after every lesson mutation to re-render the course detail page.
**Why it's wrong:** The full page re-renders. The drag-and-drop list loses optimistic state and flickers visually.
**Do this instead:** `LessonList.tsx` owns its own `lessons` state. Server Actions return the updated lesson or an error. The client updates state locally on success. Only use `router.refresh()` on hard error or when navigating away.

### Anti-Pattern 3: Storing video embed IDs instead of original URLs

**What people do:** Parse `https://vimeo.com/123456789` at input time and store only `"123456789"`.
**Why it's wrong:** Platform URL formats change. Storing the full URL and parsing at render time is more resilient.
**Do this instead:** Store the full user-pasted URL in `video_url`. Extract the embed ID with a utility function at render time. A single function `getEmbedUrl(platform, url)` handles both Vimeo and YouTube formats.

### Anti-Pattern 4: Adding lesson-level progress tracking in v1.15

**What people do:** Extend `user_course_progress` with a `lesson_id` column to track per-lesson completion.
**Why it's wrong:** Out of scope for this milestone. Adds schema complexity, RLS complexity, and frontend state management that blocks delivery of the primary features.
**Do this instead:** Track progress at course granularity (as today). Lesson-level checkboxes/completion is a future milestone.

---

## Scaling Considerations

At GOYA's current scale, none of these are concerns. Documented for completeness.

| Concern | At Current Scale | Mitigation If Needed |
|---------|-----------------|----------------------|
| Lesson list query | `WHERE course_id = ? ORDER BY sort_order` — fast with the composite index | Index is already in the schema above |
| Category lookups | Tiny table, fetched on each admin page load | `unstable_cache` in Next.js if needed |
| Bulk sort_order updates | `Promise.all` of N UPDATE calls on reorder — fine for <100 lessons | Batch upsert if lesson count grows |

---

## Sources

- `app/admin/courses/page.tsx` — current courses list Server Component
- `app/admin/courses/components/CourseForm.tsx` — current form with `vimeo_url`, hardcoded CATEGORIES
- `app/admin/courses/actions.ts` — existing audit log Server Action pattern
- `app/admin/shop/products/ProductsTable.tsx` — established dnd-kit sortable pattern
- `app/admin/media/FolderSidebar.tsx` — second example of dnd-kit sortable pattern
- `supabase/migrations/20260324_add_courses_tables.sql` — original courses schema
- `supabase/migrations/20260331100714_event_categories.sql` — event_categories reference pattern
- `supabase/migrations/20260372_member_courses_schema.sql` — Member Courses schema changes
- `supabase/migrations/20260373_member_courses_rls.sql` — Member Courses RLS pattern
- `lib/types.ts` — Course, CourseCategory, EventCategoryRow interfaces
- `app/academy/[id]/page.tsx` — current public course/lesson rendering
- `package.json` — confirmed `@dnd-kit/core@^6.3.1`, `@dnd-kit/sortable@^10.0.0`, `@dnd-kit/utilities@^3.2.2`

---
*Architecture research for: GOYA v2 v1.15 Course System Redesign*
*Researched: 2026-04-01*
