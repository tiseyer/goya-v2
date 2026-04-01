# Pitfalls Research

**Domain:** LMS course system redesign — adding categories (string-to-FK migration), lessons table, drag-and-drop ordering, and video/audio embeds to an existing Next.js 16 + Supabase platform
**Researched:** 2026-04-01
**Confidence:** HIGH (codebase inspection of actual migration files and component code + verified external sources)

---

## Critical Pitfalls

### Pitfall 1: `category` String-to-FK Migration Leaves NULL Foreign Keys on Existing Rows

**What goes wrong:**
The current `courses.category` column is a `text` CHECK constraint with 5 hardcoded values (`'Workshop' | 'Yoga Sequence' | 'Dharma Talk' | 'Music Playlist' | 'Research'`). If the migration adds a `course_category_id uuid FK` column and drops the old `category` column without backfilling first, all 8 existing seed courses have `course_category_id IS NULL`. Every query that filters or displays category — including the admin courses page `CATEGORY_BADGE` map and the public academy category filter — silently returns wrong data or crashes.

**Why it happens:**
Developers focus on the schema change (add FK column, drop text column) and forget the data change (backfill the FK from the old string values). The FK column defaults to `NULL` which is structurally valid but semantically broken. The bug is invisible in development if testing only new courses.

**How to avoid:**
Execute the migration in strict order within a single SQL file:
1. Create `course_categories` table and INSERT the 5 canonical category rows.
2. `ALTER TABLE courses ADD COLUMN course_category_id uuid REFERENCES course_categories(id)`.
3. `UPDATE courses SET course_category_id = (SELECT id FROM course_categories WHERE name = courses.category)` — backfill before touching the old column.
4. Verify: `SELECT COUNT(*) FROM courses WHERE course_category_id IS NULL` must be 0.
5. `ALTER TABLE courses ALTER COLUMN course_category_id SET NOT NULL`.
6. Drop the `category` text column.

Never split steps 1–3 across separate migration files — if step 1 deploys but step 3 does not run, production is in a broken intermediate state.

**Warning signs:**
- Admin courses page shows empty or missing category badges after migration
- `SELECT COUNT(*) FROM courses WHERE course_category_id IS NULL` returns > 0
- Category filter dropdown on academy page returns 0 results for any category

**Phase to address:**
Phase 1 — Database schema. Must be the very first migration, completed before any UI work begins.

---

### Pitfall 2: Hardcoded Category Strings Left in TypeScript After DB Migration

**What goes wrong:**
The category values are currently hardcoded in at least 4 locations in the codebase: `lib/types.ts` (`CourseCategory` type union), `app/admin/courses/page.tsx` (`CATEGORY_BADGE` record), `app/academy/[id]/page.tsx` (`CATEGORY_COLORS` record), and the original migration CHECK constraint. After migrating to a FK-based `course_categories` table, any hardcoded reference left in TypeScript continues to compile but silently fails at runtime — new categories added via the admin UI will have no badge color, new category names won't appear in filters, and TypeScript treats deleted categories as valid.

**Why it happens:**
The migration audit focuses on the DB layer. The TypeScript layer is not separately audited. Grep for the category string literals is skipped.

**How to avoid:**
Before writing the migration, run a full-codebase grep for each hardcoded category string: `'Workshop'`, `'Yoga Sequence'`, `'Dharma Talk'`, `'Music Playlist'`, `'Research'`. After migration:
- Remove the `CourseCategory` string union from `lib/types.ts` and replace with a `CourseCategory` interface `{ id: string; name: string; color?: string }`.
- Move badge/color maps to a runtime config (either a column on `course_categories` table, or a generic hash function).
- Category dropdowns must fetch from DB at runtime, not from a hardcoded array.

**Warning signs:**
- New category created in admin UI shows a generic or empty badge
- TypeScript still compiles after you remove `CourseCategory` type — means it was never used properly
- Category dropdown hardcodes the 5 original strings and ignores the DB

**Phase to address:**
Phase 1 — Database schema (migration) and Phase 2 — Admin UI (category CRUD). Audit TypeScript references at the start of Phase 1.

---

### Pitfall 3: `user_course_progress` Breaks Semantically When Lessons Are Added

**What goes wrong:**
The existing `user_course_progress` table tracks one row per `(user_id, course_id)` with a single `status` field (`in_progress | completed`). Once multi-lesson courses exist, "course completion" is ambiguous — does watching lesson 1 of 5 count as `in_progress`? Does completing all 5 mark `completed`? If this is not resolved before the lesson player ships, enrolled students accumulate progress records that cannot be mapped to lesson-level completion retroactively. CPD credits awarded on course completion may fire incorrectly.

**Why it happens:**
The lesson player gets built first because it is visible and demonstrates value. Progress tracking is treated as a later concern. But the schema decision made at lesson player build time constrains all future credit/completion logic.

**How to avoid:**
Decide the completion model in Phase 1 and encode it in the DB schema:
- Add a separate `user_lesson_progress` table: `(id, user_id, lesson_id, completed_at)` with `UNIQUE(user_id, lesson_id)`.
- Keep `user_course_progress` for enrollment tracking (`enrolled_at`) and overall status.
- Derive `user_course_progress.status = 'completed'` from a count: when all non-optional lessons in a course have a `user_lesson_progress` row, trigger the course completion.
- Never conflate course-level and lesson-level progress — they are different data.

**Warning signs:**
- `user_course_progress.status` is set to `'completed'` the moment a student starts any lesson
- No `user_lesson_progress` table exists when lesson player ships
- CPD credits fire on `in_progress` status

**Phase to address:**
Phase 1 — Database schema. `user_lesson_progress` must exist before Phase 3 (frontend lesson rendering).

---

### Pitfall 4: Integer `position` Column Causes N-Row Updates on Every Drag Reorder

**What goes wrong:**
The existing products page uses a `priority integer` column for ordering (manual numeric input, not drag-and-drop). Copying this pattern to a true drag-and-drop lesson reorder requires updating every lesson that shifted position. Moving lesson 1 to position 5 in a 10-lesson course requires updating 5 rows. Under any concurrent admin edits (two browser tabs open), conflicting integer positions have no resolution strategy and silently corrupt the order.

**Why it happens:**
The `products.priority` pattern is the only ordering precedent in the codebase. Developers copy it without recognising that products are rarely reordered and the pattern was never designed for drag-and-drop.

**How to avoid:**
Use a `position numeric` (float) column instead of integer, seeded with gaps. A drag between positions 2000 and 3000 sets the moved lesson to 2500 — only ONE row update. When float precision is exhausted after hundreds of reorders, a background renormalization resets positions to multiples of 1000.

```sql
ALTER TABLE lessons ADD COLUMN position numeric NOT NULL DEFAULT 0;
-- On seed/create: assign position = ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) * 1000
```

On drag end: `newPosition = (predecessorPosition + successorPosition) / 2`. Only update the moved lesson row.

**Warning signs:**
- Drag reorder save takes > 500ms with 10+ lessons
- Position column is `integer` type rather than `numeric` or `float8`
- Drag end handler loops through all lessons and updates each one individually

**Phase to address:**
Phase 1 — Database schema (position column type). Phase 2 — Lesson management UI (drag end handler logic).

---

### Pitfall 5: dnd-kit `DndContext` Causes React Hydration Mismatch in Next.js App Router

**What goes wrong:**
dnd-kit's `DndContext` uses `window`, `document`, and browser pointer APIs internally. In Next.js App Router, even a `'use client'` component gets server-rendered first. The server renders the sortable list without drag state; the client attaches dnd-kit event listeners during hydration, producing a React hydration mismatch. In some configurations, the `useSortable` hook generates inline `transform` styles that differ between server and client renders, escalating to a full hydration error that breaks the lesson list entirely.

**Why it happens:**
`'use client'` is mistaken for "skip server render." It means "allow client-side interactivity," not "render only on client." The distinction matters only for browser-API-dependent libraries like dnd-kit.

**How to avoid:**
Wrap the draggable lesson list in a dynamic import with SSR explicitly disabled:

```typescript
// In the lesson edit page (Server Component)
const LessonSortableList = dynamic(
  () => import('./LessonSortableList'),  // 'use client' component with dnd-kit
  { ssr: false }
)
```

The non-draggable parts of the lesson management page (course header, save button, add lesson button) remain server-rendered. Only the `SortableContext`/`DndContext` subtree is client-only.

**Warning signs:**
- React hydration mismatch warnings in browser console on the lesson edit page
- Lesson list flickers white on first page load
- `window is not defined` or `document is not defined` errors during Next.js build or in server logs

**Phase to address:**
Phase 2 — Lesson management UI. Apply the `dynamic` import pattern from the start, not as a fix after hydration errors appear in QA.

---

### Pitfall 6: dnd-kit State Flicker When Syncing Position to Supabase After Drop

**What goes wrong:**
After a drag ends, if the developer `await`s the Supabase `update()` before updating local React state, the UI reverts to the pre-drag order for 200–500ms (the network round-trip duration), then snaps to the new order. This creates a visible reorder-flash that feels broken to users. If the developer instead updates local state first but the Supabase call fails silently, the UI shows the new order while the database still has the old order — with no error surfaced and no rollback.

**Why it happens:**
The `onDragEnd` handler naturally wants to `await` persistence before committing the UI change. dnd-kit's OptimisticSortingPlugin manages DOM transforms during drag but relinquishes control to React state at `onDragEnd` — the timing gap is where the flash occurs.

**How to avoid:**
Optimistic update pattern with snapshot rollback:

```typescript
const preOrderRef = useRef<Lesson[]>([])

// onDragStart: save snapshot for potential rollback
preOrderRef.current = [...lessons]

// onDragEnd: update UI immediately, then persist in background
const reordered = arrayMove(lessons, oldIndex, newIndex)
  .map((lesson, i) => ({ ...lesson, position: computeNewPosition(i, lessons) }))
setLessons(reordered)                        // immediate — no flash
const { error } = await saveLessonPositions(reordered)
if (error) {
  setLessons(preOrderRef.current)            // rollback on failure
  toast.error('Reorder failed — order reverted')
}
```

**Warning signs:**
- Lesson list visibly snaps back to original position for ~300ms after drop
- Supabase update errors are caught but not surfaced to the user
- No pre-drag snapshot is saved before drag starts

**Phase to address:**
Phase 2 — Lesson management UI.

---

### Pitfall 7: Vimeo Domain-Level Privacy Blocks Embeds on Localhost and Vercel Preview URLs

**What goes wrong:**
Vimeo's "embed only on specific domains" privacy setting is commonly used to prevent video hotlinking. If a content admin sets a video to domain-restricted and only adds the production domain, the embed shows "This video is private" on `localhost:3000` and all Vercel preview deployments (`*.vercel.app`). Development and QA review become impossible.

Separate but related: videos set to Vimeo's "Private" privacy level (not domain-restricted) **cannot be embedded anywhere at all** — they return a blank player regardless of `allowfullscreen` or iframe attributes. This is a Vimeo account-level setting invisible to developers.

**Why it happens:**
Content admins configure Vimeo privacy settings without understanding the distinction between "Private" (no embed anywhere) and "Only on sites I specify" (domain allowlist). Developers also forget that Vercel preview deployments use auto-generated subdomains that cannot be pre-registered with Vimeo.

**How to avoid:**
- Add a server-side URL validation step in the lesson save Server Action: call Vimeo's oEmbed API (`https://vimeo.com/api/oembed.json?url=[url]`) before saving — it returns an error for private videos.
- Show an inline warning in the lesson form: "Vimeo videos must be set to 'Public' or 'Domain-level' privacy. Private videos cannot be embedded."
- Document Vimeo setup for admins: production domain AND `localhost:3000` must both be in the Vimeo allowlist.
- Add the production custom domain to Vimeo's allowlist from day one — never rely on `*.vercel.app`.

**Warning signs:**
- Blank or "This video is private" iframe in the lesson player
- Vimeo oEmbed API returns `{ "error": "Not Found" }` for the URL
- Video works in Vimeo's own player but not on the platform

**Phase to address:**
Phase 2 — Lesson management UI (validation in lesson form). Phase 3 — Frontend lesson rendering (embed error handling).

---

### Pitfall 8: RLS Policy on `lessons` Table Silently Blocks Student Queries via JOIN

**What goes wrong:**
When RLS is enabled on the new `lessons` table, student queries that JOIN `courses` with `lessons` return 0 lessons — not an error, just an empty array. Supabase evaluates RLS independently on each table in a JOIN. If the `lessons` RLS policy references only `lessons` columns without checking the parent `courses.status`, students get nothing even for published courses. Worse, the Supabase client returns `[]` with no error, making the bug look like a data problem.

Supabase's official documentation explicitly warns: "If you enable RLS and forget to add policies, every query returns empty results — your application appears broken but there are no error messages."

**Why it happens:**
Developers assume the `courses` table's existing RLS policy ("public can read published courses") carries through to joined tables. It does not — each table's RLS evaluates independently.

**How to avoid:**
Write the `lessons` SELECT policy to check the parent course's publication status:

```sql
CREATE POLICY "Students can read lessons of published courses" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = lessons.course_id
        AND courses.status = 'published'
    )
  );
```

After adding RLS, always test from the Supabase JS client SDK (not the SQL Editor) — the SQL Editor bypasses RLS and will show data even when policies are broken.

**Warning signs:**
- Academy lesson player returns 0 lessons for a course confirmed as published
- No Supabase client error thrown — just an empty array
- The SQL Editor shows lessons correctly but the browser app does not

**Phase to address:**
Phase 1 — Database schema (RLS policies for the lessons table). Verify by testing with a student-role user, not service-role.

---

### Pitfall 9: Video and Audio Media Players Break on Server-Side Render

**What goes wrong:**
The HTML `<audio>` element and `<video>` with JavaScript APIs (`HTMLAudioElement.play()`, Vimeo Player SDK, YouTube IFrame API) cannot execute during SSR. If the lesson player component is a Server Component, or if a `'use client'` component references these APIs at the module scope rather than inside `useEffect`/event handlers, the Next.js build fails with `ReferenceError: HTMLAudioElement is not defined` or `ReferenceError: window is not defined`.

Additionally, rendering an `<iframe>` for embed is fine in a Server Component, but any lesson completion detection (video `ended` event, Vimeo Player `finish` event) requires the Vimeo Player SDK or YouTube IFrame API — both browser-only. If these are not properly isolated, completion events never fire and lesson progress never updates.

**Why it happens:**
The lesson page is started as a Server Component for SEO/performance. Client interactivity is added incrementally without establishing clean `'use client'` boundaries. The Vimeo Player SDK is imported at the top of a file that also gets server-rendered.

**How to avoid:**
Establish component boundaries up front:
- Lesson page wrapper (`/academy/[courseId]/[lessonId]/page.tsx`) stays a Server Component — fetches lesson data and renders static metadata.
- Media renderer components (`VideoLesson.tsx`, `AudioLesson.tsx`, `TextLesson.tsx`) are all `'use client'` components with `dynamic(..., { ssr: false })` imports where browser APIs are needed.
- For Vimeo completion detection, use the `@vimeo/player` npm package inside a `'use client'` component — it wraps the postMessage API and fires `ended` and `timeupdate` events.
- Never import `@vimeo/player` in a Server Component.

**Warning signs:**
- Build error: `ReferenceError: HTMLAudioElement is not defined`
- Build error: `window is not defined` in lesson player files
- Lesson completion never fires (event listeners not attached due to SSR)
- Vimeo SDK imported at module scope in a file without `'use client'` directive

**Phase to address:**
Phase 3 — Frontend lesson rendering. Component boundary decisions must be made before writing any media render code.

---

### Pitfall 10: Deleting a Category That Has Courses Assigned — Orphaned FK or Blocked Delete

**What goes wrong:**
The admin UI will support category CRUD. If a category is deleted that has courses assigned, one of two bad outcomes occurs:
1. The DELETE fails with a Postgres FK violation error, shown as an unhandled 500 in the admin UI.
2. The FK is defined with `ON DELETE SET NULL`, silently orphaning all courses in that category (their `course_category_id` becomes NULL), breaking every display that reads the category name.

**Why it happens:**
The FK constraint behavior on delete is not explicitly designed — it defaults to `NO ACTION` (blocks delete) without a user-facing explanation, or is set to `SET NULL` carelessly.

**How to avoid:**
- Default FK behavior: `NO ACTION` (prevents deletion) — this is the safe default.
- The admin UI must check before allowing category deletion: `SELECT COUNT(*) FROM courses WHERE course_category_id = $categoryId`. If > 0, show a blocking warning: "This category has X courses. Reassign or delete courses before removing this category."
- Do not use `ON DELETE CASCADE` or `ON DELETE SET NULL` — either destroys data or creates orphans.

**Warning signs:**
- Category delete button triggers a 500 error with no user-facing message
- Courses in deleted category display "Unknown Category" or blank after delete
- No course count shown in the admin category list

**Phase to address:**
Phase 2 — Admin UI (category CRUD). The constraint behavior is set in Phase 1 migration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep `user_course_progress` for lesson completion instead of adding `user_lesson_progress` | No new table, faster to ship | Cannot track per-lesson completion; CPD credit logic wrong for multi-lesson courses | Never — multi-lesson courses make this incorrect by definition |
| Integer `position` column copied from `products.priority` pattern | Consistent with existing code | N row updates per reorder; integer collision under concurrent edits | Never for drag-and-drop; acceptable only for manual priority fields like products |
| Skip oEmbed validation on lesson save — accept any URL | Simpler Server Action | Admins save private/broken Vimeo URLs; broken embeds in production courses | Never — validation is < 20 lines of code |
| Run DB migration and UI change in the same PR | Fewer PRs | If migration fails, UI PR is blocked; schema changes are hard to rollback independently | Never — always separate DB schema migrations from UI code changes |
| Render all media types unconditionally — load Vimeo SDK on text lessons | Simpler component tree | 45KB+ Vimeo SDK loaded on every lesson page even when no video exists | Never — conditional loading is a single `if` statement |
| Hardcode `course_categories` as TypeScript enum after FK migration | Simpler TypeScript, no DB fetch needed | New categories added via admin UI are invisible until code is redeployed | Never — defeats the purpose of a DB-driven categories table |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vimeo embed URL | Use video watch URL `vimeo.com/[id]` in `<iframe src>` | Use embed URL `player.vimeo.com/video/[id]` — watch URLs are not embeddable |
| Vimeo unlisted videos | Use only the video ID in embed URL | Unlisted videos require the `h` hash parameter: `player.vimeo.com/video/[id]?h=[hash]` |
| Vimeo Player SDK | Import at module scope in any component | Dynamic import inside `'use client'` component only; never in Server Components |
| YouTube embed | Use watch URL `youtube.com/watch?v=[id]` in `<iframe src>` | Use embed URL `youtube.com/embed/[id]` — YouTube blocks watch URLs in iframes via X-Frame-Options |
| dnd-kit in Next.js App Router | Import `DndContext` directly in `'use client'` file | Use `dynamic(() => import('./SortableList'), { ssr: false })` to prevent hydration errors |
| Supabase RLS + JOIN | Test policies via SQL Editor | Always test from Supabase JS client (`createSupabaseServerClient`) — SQL Editor bypasses RLS and gives false confidence |
| Supabase lesson position updates | `Promise.all` of N individual update calls | Update only the single moved row using the float position midpoint; batch via RPC if N rows must update |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all lessons for all courses on the academy index page | Slow index page, large payloads on page load | Fetch only course metadata on index; fetch lessons only on the individual course/lesson page | With 20+ courses each having 5+ lessons |
| Loading Vimeo Player SDK unconditionally on every lesson page | 45KB extra JS on text and audio lessons | Conditionally load Vimeo SDK only when `lesson.type === 'video'` and `lesson.video_platform === 'vimeo'` | Every non-video lesson load |
| N+1 lesson position updates on drag reorder (integer position) | Reorder save takes 500ms+ with 10+ lessons | Float position — single row update per reorder | With 10+ lessons per course |
| Querying `course_categories` on every admin courses page render without any caching | Category dropdown re-fetches on every filter change, every navigation | Fetch once at page load; pass as prop to client filter components | With frequent admin filter interactions |
| No index on `lessons.course_id` | Slow lesson fetch on courses with many enrolled students | `CREATE INDEX ON lessons(course_id)` in the Phase 1 migration | With 50+ courses |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Accepting any URL string in the lesson video URL field without validation | XSS via `javascript:` protocol URL reflected into `<iframe src>` if not sanitized server-side | Server Action must validate: URL must match `https://player.vimeo.com/video/\d+` or `https://www.youtube.com/embed/[\w-]+` before saving |
| No RLS `INSERT` policy on `lessons` table scoped to course ownership | Members could insert lessons into admin-created GOYA courses | RLS INSERT policy: `auth.uid() = (SELECT created_by FROM courses WHERE id = lessons.course_id)` OR `role IN ('admin', 'moderator')` |
| Publishing a course with lessons where all `position` values are 0 | Students see lessons in undefined DB sort order (varies by server planner) | Enforce non-zero positions: CHECK constraint or auto-assign at INSERT; warn on publish if any lesson has `position = 0` |
| Bypassing lesson access RLS via direct lesson ID URL | Student accesses lesson from a non-published or private course by guessing the lesson UUID | RLS SELECT on `lessons` must check parent course status AND access level — do not rely solely on course-level access control |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Drag reorder with no persistent save confirmation | Admin drags, closes tab, loses order if background save failed silently | Show "Order saved" toast on success; show "Save failed — order reverted" on error, with rollback to pre-drag state |
| Duration stored as freeform text (`"4h 30m"`) in 8 existing courses, new UI uses integer minutes | Existing course durations display as `0 min` or throw a parse error after schema change | Migration must parse existing duration strings to minutes integer; store as `duration_minutes integer`; display as `Xh Ym` |
| Lesson player with no explicit "Mark Complete" button | Students who pause the video early never trigger completion; progress never advances | Provide both auto-detection (Vimeo/YouTube `ended` event) and an explicit "Mark as Complete" button |
| No lesson count shown on course rows in admin | Admin cannot see which courses have 0 lessons; empty courses get published | Show lesson count badge on each course row in admin; display a warning on the publish action for courses with 0 lessons |
| Adding lessons inside the course edit form (same page scroll) | Long page, confusing nesting, hard to manage 5+ lessons | Use a dedicated lesson sub-page (`/admin/courses/[id]/lessons`) linked from the course edit form |
| Category delete with no warning UI | Admin deletes a category with 20 courses; all courses lose their category silently | Check course count before delete; show: "X courses are assigned to this category. Reassign them before deleting." |

---

## "Looks Done But Isn't" Checklist

- [ ] **Category migration backfill:** `SELECT COUNT(*) FROM courses WHERE course_category_id IS NULL` returns 0 after migration runs
- [ ] **Category hardcodes removed:** No `'Workshop'` / `'Yoga Sequence'` / `'Dharma Talk'` / `'Music Playlist'` / `'Research'` string literals remain in TypeScript after migration (grep to verify)
- [ ] **Lesson RLS verified from client:** Test lesson fetch from a logged-in student browser session — not the SQL Editor, which bypasses RLS
- [ ] **Drag reorder single update:** Verify in browser network tab that a drag produces exactly 1 Supabase update call (float position midpoint), not N calls
- [ ] **No dnd-kit hydration warnings:** Open lesson management page with browser console open — zero hydration mismatch warnings
- [ ] **Vimeo private video blocked at save:** Attempt to save a Vimeo private video URL in the lesson form — it must be rejected with a user-facing error
- [ ] **Lesson completion triggers course completion:** Complete all lessons for a multi-lesson course as a student — verify `user_course_progress.status` updates to `'completed'`
- [ ] **Audio/video conditional load:** Open a text-type lesson — verify Vimeo Player SDK is NOT loaded in the network tab
- [ ] **Category delete guarded:** Attempt to delete a category with courses assigned — verify blocking warning appears, not a 500 error
- [ ] **REST API still works:** After schema changes, verify the existing Courses API endpoint (`/api/v1/courses`) returns correct data including the new `course_category_id` field
- [ ] **Duration field migration:** Open an existing course (`"4h 30m"` duration) after migration — verify it displays correctly as `270 min` or `4h 30m`, not `0` or `NaN`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Category migration leaves NULL FKs in production | MEDIUM | Write a targeted backfill UPDATE migration; deploy as hotfix; no data loss, but a brief period of broken category display |
| Hardcoded category strings break after FK migration | LOW | Update TypeScript maps to fetch from DB; no migration needed; one deploy |
| dnd-kit hydration error breaks lesson management page | LOW | Wrap sortable component in `dynamic(..., { ssr: false })`; deploy; no DB changes needed |
| Integer position collision (two lessons at same position) | LOW | Run renormalization: `UPDATE lessons SET position = ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY position, created_at) * 1000` |
| `user_course_progress` semantics broken by multi-lesson model | HIGH | Retroactively create `user_lesson_progress` rows from `user_course_progress` completion records; requires per-student data analysis; cannot be automated safely |
| Vimeo private videos saved to production courses | LOW | Update Vimeo privacy settings in Vimeo account; no code change; update admin documentation |
| Lessons RLS returns empty for students | LOW | Add correct RLS SELECT policy via a new migration; no data changes needed; verify from JS client |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Category string-to-FK migration with NULL backfill | Phase 1: DB Schema | `SELECT COUNT(*) FROM courses WHERE course_category_id IS NULL` = 0 |
| Hardcoded category TypeScript strings | Phase 1 (audit before migration) + Phase 2 (admin category UI) | Grep for category string literals returns 0 matches |
| `user_lesson_progress` table absent — completion breaks | Phase 1: DB Schema | Lesson player can mark individual lessons complete; course completion derived from lesson completion |
| Integer position → N row updates on reorder | Phase 1: DB Schema (numeric position column) | Network tab shows 1 Supabase update on drag end |
| dnd-kit hydration mismatch | Phase 2: Admin lesson management UI | Zero hydration warnings in browser console on lesson edit page |
| dnd-kit state flicker on drop | Phase 2: Admin lesson management UI | Drag end shows new order instantly with no revert flash |
| Vimeo private video breaks embed | Phase 2: Lesson form validation | oEmbed validation rejects private URL at save time |
| Vimeo domain privacy blocks localhost/preview | Phase 3: Frontend lesson rendering + admin documentation | Embed visible on localhost and production domain |
| RLS on lessons silently returns empty | Phase 1: DB Schema (RLS policies) | Logged-in student sees lessons; logged-out user sees 0 lessons for members_only courses |
| Audio/video embed SSR errors | Phase 3: Frontend lesson rendering | Build succeeds with zero `window is not defined` errors; `dynamic` import used for all media components |
| Category delete with assigned courses — 500 error | Phase 2: Admin category CRUD UI | Attempt delete with courses assigned — blocking warning appears, not an error |

---

## Sources

- Vimeo domain-level privacy setup: https://help.vimeo.com/hc/en-us/articles/30030693052305-How-do-I-set-up-domain-level-privacy
- Vimeo private video embed restrictions: https://help.vimeo.com/hc/en-us/articles/12426199699985-About-video-privacy-settings
- Supabase RLS performance and best practices (JOIN tables apply RLS independently): https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Supabase RLS: empty results when policies missing or misconfigured: https://supabase.com/docs/guides/database/postgres/row-level-security
- dnd-kit + React Query state flicker on drop (optimistic update race): https://github.com/clauderic/dnd-kit/discussions/1522
- dnd-kit hydration issue in Next.js (dynamic import with ssr: false required): https://github.com/sujjeee/nextjs-dnd
- Float/numeric position for drag reorder (single update pattern): https://www.basedash.com/blog/implementing-re-ordering-at-the-database-level-our-experience
- Fractional indexing for ordered lists: https://hollos.dev/blog/fractional-indexing-a-solution-to-sorting/
- PostgreSQL CHECK constraint NOT VALID migration pattern: https://squawkhq.com/docs/constraint-missing-not-valid
- Next.js hydration error solutions (dynamic with ssr: false): https://nextjs.org/docs/messages/react-hydration-error
- Codebase inspection: `supabase/migrations/20260324_add_courses_tables.sql`, `supabase/migrations/20260372_member_courses_schema.sql`, `lib/types.ts`, `app/academy/[id]/page.tsx`, `app/admin/courses/page.tsx`, `app/admin/products/AdminProductsClient.tsx`

---
*Pitfalls research for: GOYA v2 — v1.15 Course System Redesign (categories, lessons, drag-and-drop, video/audio embeds on Next.js 16 + Supabase)*
*Researched: 2026-04-01*
