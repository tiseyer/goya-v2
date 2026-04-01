# Phase 37: Admin Courses — Tabs + Categories - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Add two tabs to the admin courses page (Courses / Categories) and build full category CRUD management on the Categories tab. Admins and moderators can create, edit, and delete course categories with color, parent, and slug fields. Delete is blocked when courses reference the category.

Requirements: ACAT-01, ACAT-02, ACAT-03, ACAT-04, ACAT-05

</domain>

<decisions>
## Implementation Decisions

### Tab Implementation
- Tab switching via URL search param `?tab=categories` — consistent with admin detail page pattern (?tab=connections)
- Categories tab uses same table styling as the existing admin courses list
- Category color input: simple hex input with color preview swatch (no color picker library)
- Slug auto-generates on name blur, pre-populated but editable

### Category CRUD
- Modal dialog for add/edit (consistent with existing admin CRUD patterns)
- Parent category: flat dropdown of all categories (no tree picker — only ~5 items)
- Delete guard: AlertDialog showing course count if courses reference the category, immediate delete if no references
- Only admins and moderators see the Categories tab

### Claude's Discretion
- Server action naming and structure
- Exact modal layout and field order
- Error handling patterns

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/courses/page.tsx` — existing course list page, needs tab wrapper
- `app/admin/courses/AdminCoursesFilters.tsx` — has hardcoded CATEGORIES array to be made dynamic
- `app/admin/courses/AdminCourseActions.tsx` — action pattern reference
- Existing modal patterns in admin (e.g., coupon create/edit modals)

### Established Patterns
- Admin pages use server components with client filter components
- URL search params for tab state (e.g., admin user detail `?tab=connections`)
- Server actions in `actions.ts` files per admin section
- Badge styling with bg-color/text-color pattern from CATEGORY_BADGE, STATUS_BADGE, etc.

### Integration Points
- `app/admin/courses/page.tsx` — wrap with tab component
- `app/admin/courses/AdminCoursesFilters.tsx` — replace hardcoded CATEGORIES with DB fetch
- `course_categories` table — new, created in Phase 36

</code_context>

<specifics>
## Specific Ideas

- Table columns: Color swatch, Name, Slug, Parent Category, Description, Actions (Edit, Delete)
- "+ Add Category" button top right of categories tab
- Add/Edit modal: Name (auto-generates slug), Slug (editable), Parent Category (dropdown), Description, Color picker (hex input)
- Delete: block if courses use this category, show count in alert

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
