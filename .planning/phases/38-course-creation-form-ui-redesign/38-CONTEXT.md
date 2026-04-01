# Phase 38: Course Creation Form — UI Redesign - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the admin course creation/edit form with a premium card-section layout, DB-driven category select, duration slider, remove legacy vimeo_url field, and redirect to edit page after new course creation.

Requirements: ACF-01, ACF-02, ACF-03, ACF-04, ACF-05, ACF-06, ACF-07

</domain>

<decisions>
## Implementation Decisions

### Form Section Layout
- 3 card sections: "Basic Info" (title, category, level, access, instructor), "Content" (descriptions, thumbnail, gradient), "Settings" (status, duration)
- Card styling: `border border-border rounded-xl p-6 space-y-4 bg-card` — consistent with GOYA design system
- Section headers: `text-lg font-semibold text-foreground` with subtle description text below
- Duration slider with inline "Xh Ym" text next to the slider value
- Modern SaaS aesthetic: generous padding, smooth transitions, intentional typography

### Form Behavior
- Category dropdown from `fetchCategories()` (Phase 37 server actions) with category color dot indicator
- Post-save redirect for new courses: `router.push(/admin/courses/${id}?tab=lessons)` — immediately manage lessons
- Keep existing gradient preview card with live color update
- Remove vimeo_url field entirely — video moves to lessons
- Course type set automatically: admin creates = goya, member creates = member
- Mobile responsive throughout

### Claude's Discretion
- Exact animation/transition implementations
- Error handling UX patterns
- Field validation messages

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/courses/components/CourseForm.tsx` — existing form to redesign (has category, level, status, vimeo_url, gradient fields)
- `app/admin/courses/actions.ts` — logAdminCourseAction for audit logging
- `app/admin/courses/category-actions.ts` — fetchCategories server action (from Phase 37)
- `lib/courses/categories.ts` — CourseCategory type and helpers
- Existing INPUT, LABEL, SELECT CSS class constants

### Established Patterns
- Client component forms with useState per field
- Supabase client-side mutations
- Audit logging via logAdminCourseAction
- Gradient preview with live color updates

### Integration Points
- `app/admin/courses/new/page.tsx` — uses CourseForm for creation
- `app/admin/courses/[id]/page.tsx` — uses CourseForm for editing
- `course_categories` table via fetchCategories()
- `courses.category_id` FK (replaces old `category` text)
- `courses.duration_minutes` integer (replaces old `duration` text)

</code_context>

<specifics>
## Specific Ideas

- Design direction: refined, modern SaaS 2026 aesthetic (Linear, Vercel, Notion style)
- Card-based sections with subtle borders, rounded corners, generous padding
- Smooth show/hide transitions for conditional fields
- Primary CTA prominent, Cancel subdued
- Duration slider: 5min–600min, step 5min, display as "Xh Ym"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
