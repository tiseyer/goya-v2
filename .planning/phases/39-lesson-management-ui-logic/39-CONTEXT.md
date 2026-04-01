# Phase 39: Lesson Management — UI + Logic - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add lesson management to the course edit page: drag-and-drop sortable list, type-specific add/edit forms (Video/Audio/Text), sort_order persistence, mobile touch support. Admins can add, edit, reorder, and delete lessons.

Requirements: LM-01, LM-02, LM-03, LM-04, LM-05, LM-06, LM-07, LM-08, LM-09

</domain>

<decisions>
## Implementation Decisions

### Lesson List & Drag-and-Drop
- Lessons section placed below the course form as a separate card section titled "Lessons"
- Drag handle icon: `⠿` (grip dots) — reuse pattern from ProductsTable.tsx
- Sort position uses float midpoint (numeric column) — single-row UPDATE per drag operation
- @dnd-kit imported via `next/dynamic` with `{ ssr: false }` — prevents hydration mismatch
- @dnd-kit/core and @dnd-kit/sortable already installed (v6.3.1 / v10.0.0)

### Lesson Form & Type-Specific Fields
- Lesson form is an inline expandable section below the lesson list (no modal)
- Type selector: 3 visual cards with emoji + label (🎬 Video, 🎵 Audio, 📝 Text)
- Video platform toggle: pill toggle with Vimeo/YouTube labels (not dropdown)
- Duration slider: 1–180 min, step 1
- Each type shows/hides conditional fields with smooth transitions

### Claude's Discretion
- Server action naming and structure for lesson CRUD
- Exact animation/transition implementations
- Error handling UX patterns
- Lesson number display format

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/courses/components/CourseForm.tsx` — redesigned in Phase 38, lessons section goes below
- `app/admin/courses/[id]/edit/page.tsx` — edit page wrapper, fetches course data
- ProductsTable.tsx — existing @dnd-kit sortable pattern with grip dots handle
- `@dnd-kit/core` v6.3.1, `@dnd-kit/sortable` v10.0.0 — already installed
- `lessons` table created in Phase 36 with sort_order numeric, type CHECK, all media fields

### Established Patterns
- Server actions in per-section action files
- Client components with useState for form state
- Supabase client-side operations (or server actions)
- Audit logging patterns

### Integration Points
- `app/admin/courses/[id]/edit/page.tsx` — add lessons fetch and pass to form
- `lessons` table — CRUD operations
- `courses.id` — foreign key for lessons

</code_context>

<specifics>
## Specific Ideas

From user specs:
- Each lesson in list: drag handle icon, lesson number, title, type badge (Video/Audio/Text), duration, Edit + Delete
- Empty state: "No lessons yet. Add your first lesson below."
- "+ Add Lesson" button
- VIDEO fields: Title (required), Platform toggle (Vimeo|YouTube pill), Video URL, Short Description, Full Description, Duration slider (1–180 min)
- AUDIO fields: Title (required), Audio URL (required), Featured Image (optional upload), Short Description, Full Description, Duration slider
- TEXT fields: Title (required), Featured Image (optional), Short Description, Full Description (large textarea), Duration slider
- Save → lesson appears in list. Can add another or close.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
