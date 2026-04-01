---
phase: 38-course-creation-form-ui-redesign
plan: "01"
subsystem: ui
tags: [react, nextjs, tailwind, supabase, forms, admin]

requires:
  - phase: 36-database-migrations
    provides: "category_id FK and duration_minutes columns on courses table, course_categories table"
  - phase: 37-admin-courses-tabs-categories
    provides: "fetchCategories server action, CourseCategory type from lib/courses/categories.ts"

provides:
  - "Updated Course TypeScript interface matching DB schema (category_id, duration_minutes, no vimeo_url)"
  - "Redesigned CourseForm with three card sections (Basic Info, Content, Settings)"
  - "DB-driven category select with color dot indicator"
  - "Duration slider 5-600 min step 5 with Xh Ym display"
  - "New courses auto-set course_type=goya and redirect to edit?tab=lessons"

affects: [38-02, 39-lesson-management, app/academy, app/settings/my-courses]

tech-stack:
  added: []
  patterns:
    - "Card-section form layout with border border-border rounded-xl p-6 bg-card"
    - "formatDuration helper converts minutes to Xh Ym string"
    - "Category color indicator as absolute-positioned span inside relative wrapper"

key-files:
  created:
    - "app/admin/courses/components/CourseForm.tsx (fully rewritten)"
  modified:
    - "lib/types.ts — Course interface updated to match DB schema"
    - "app/admin/courses/new/page.tsx — now async, fetches categories, passes as prop"
    - "app/admin/courses/[id]/edit/page.tsx — fetches categories, passes as prop"
    - "docs/admin/courses.md — form section descriptions updated"

key-decisions:
  - "Card-section layout (border border-border rounded-xl) provides the modern SaaS aesthetic requested"
  - "Category color dot implemented as absolute span inside relative wrapper on select — avoids custom dropdown complexity while still showing the selected color"
  - "formatDuration placed above component (module scope) — pure helper, no need to be a hook"
  - "New course redirects to edit?tab=lessons — guides admin to add lesson content immediately"

patterns-established:
  - "form sections: three card divs with h2 + muted-foreground description inside border border-border rounded-xl p-6 bg-card"
  - "duration slider: type=range min=5 max=600 step=5 with formatDuration label + justify-between min/max hints"

requirements-completed: [ACF-01, ACF-02, ACF-03, ACF-04, ACF-06]

duration: 45min
completed: "2026-04-01"
---

# Phase 38 Plan 01: Course Creation Form UI Redesign Summary

**CourseForm redesigned with three-section card layout, DB-driven category select with color indicators, 5-600 min duration slider, vimeo_url removed, and auto course_type=goya for new admin-created courses**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-01T03:30:00Z
- **Completed:** 2026-04-01T04:16:21Z
- **Tasks:** 2
- **Files modified:** 4 (+ docs)

## Accomplishments

- Updated `Course` TypeScript interface in `lib/types.ts` to match the migrated DB schema: `category_id` (FK UUID), `duration_minutes` (number), removed `vimeo_url`, nullable `gradient_from`/`gradient_to`
- Rewrote `CourseForm.tsx` with three card sections (Basic Info, Content, Settings) giving a premium SaaS feel
- Category select is now DB-driven via `fetchCategories`, shows a color dot for the selected category using an absolutely-positioned `<span>` with `backgroundColor` from the category's color field
- Duration slider replaces the old free-text input — range 5 to 600 minutes in 5-minute steps with an `Xh Ym` label that updates live
- New courses auto-receive `course_type: 'goya'` and redirect to `/admin/courses/[id]/edit?tab=lessons`
- Both `new/page.tsx` and `edit/page.tsx` are now async server components that fetch categories from the DB and pass them as a prop

## Task Commits

1. **Task 1: Update Course interface and page wrappers** — `d96839f` (feat)
2. **Task 2: Redesign CourseForm** — `26f177e` (feat)

**Restore commits (iCloud index sync issue):** `f6bb23d`, `a5c0b86`

## Files Created/Modified

- `lib/types.ts` — Course interface updated: category_id, duration_minutes, no vimeo_url, nullable gradients
- `app/admin/courses/components/CourseForm.tsx` — Full rewrite with card-section layout
- `app/admin/courses/new/page.tsx` — Now async server component, fetches and passes categories
- `app/admin/courses/[id]/edit/page.tsx` — Fetches categories, passes as prop
- `docs/admin/courses.md` — Updated Adding a New Course section and Duration column description
- `public/docs/search-index.json` — Regenerated after docs update

## Decisions Made

- **Category color dot via absolute span**: Rather than a custom `<select>` replacement, a small `<span>` with `style={{ backgroundColor: selectedCategory.color }}` is absolutely positioned inside a `relative` wrapper on the select element. Simpler, accessible, and consistent with native `<select>` behavior.
- **`formatDuration` at module scope**: Pure function, no closures needed, correct as a plain helper above the component.
- **Redirect to `?tab=lessons` on create**: Guides admins to immediately add lesson content after creating a course, reducing the "empty course" problem.
- **`gradient_from`/`gradient_to` changed to nullable**: Matches the DB schema (`string | null`). State initializes from `course?.gradient_from ?? '#0f766e'` so the UI always has a fallback.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] git index reset by iCloud Drive sync**
- **Found during:** Task 1 commit
- **Issue:** iCloud Drive syncing `.git/index` to/from cloud between bash calls, causing the git index to revert to a near-empty state. This caused commits to appear to delete ~818 tracked files.
- **Fix:** Two restore commits (`f6bb23d`, `a5c0b86`) used `git add -A` to re-stage all files. The feature content was correctly committed in both task commits.
- **Files modified:** All codebase files (restore only, no content changes)
- **Verification:** `git ls-files --cached | wc -l` confirms 1399 files tracked after restore

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking infrastructure issue)
**Impact on plan:** Git restore commits add noise to history but all feature content is correct. No functionality affected.

## Issues Encountered

- **iCloud Drive git index sync**: The project lives in `~/Library/Mobile Documents/com~apple~CloudDocs/` — iCloud actively syncs `.git/index` between bash tool calls, reverting the staged content. Each feature commit would inadvertently delete all previously-tracked files. Mitigated by running `git add -A && git commit` in a single bash chain, but the restore commits still appear in history.

## Known Stubs

None — all form fields are wired to real state and DB data.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 38-02 (Lesson management UI) can now proceed — `CourseForm` is complete, and new courses redirect to `?tab=lessons`
- The `app/academy/page.tsx` and `app/academy/[id]/page.tsx` pages still reference `course.category` and `course.duration` (old fields). These pages use runtime type casts (`as Course[]`) so TypeScript doesn't flag them, but they will display empty/undefined data for those fields until Phase 39 or a follow-up migration wires up the category join and duration display
- `app/academy/[id]/lesson/page.tsx` references `course.vimeo_url` — this will silently be `undefined` until Phase 39 lesson rendering is implemented

---
*Phase: 38-course-creation-form-ui-redesign*
*Completed: 2026-04-01*

## Self-Check: PASSED

- FOUND: lib/types.ts
- FOUND: app/admin/courses/components/CourseForm.tsx
- FOUND: app/admin/courses/new/page.tsx
- FOUND: app/admin/courses/[id]/edit/page.tsx
- FOUND: .planning/phases/38-course-creation-form-ui-redesign/38-01-SUMMARY.md
- FOUND: commit d96839f (Task 1)
- FOUND: commit 26f177e (Task 2)
- tsc --noEmit: only pre-existing type definition errors (linkify-it, mdurl), no new errors from this plan
