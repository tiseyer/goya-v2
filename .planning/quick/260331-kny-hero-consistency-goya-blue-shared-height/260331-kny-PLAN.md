---
phase: quick
plan: 260331-kny
type: execute
wave: 1
depends_on: []
files_modified:
  - app/globals.css
  - app/events/[id]/page.tsx
  - app/academy/[id]/page.tsx
  - app/members/[id]/page.tsx
autonomous: true
requirements: [hero-color, hero-height, hero-centering]

must_haves:
  truths:
    - "All detail page heroes use the same GOYA primary blue background (--goya-primary via bg-primary), not category gradients or hardcoded hex"
    - "All detail page heroes have the same height as overview page heroes (h-[200px] sm:h-[220px] md:h-[240px])"
    - "Hero content on all detail pages is vertically centered within the hero container"
  artifacts:
    - path: "app/globals.css"
      provides: "Shared CSS variable --hero-height (optional, or use Tailwind classes directly)"
    - path: "app/events/[id]/page.tsx"
      provides: "Event detail hero with GOYA blue bg, shared height, vertical centering"
    - path: "app/academy/[id]/page.tsx"
      provides: "Course detail hero with GOYA blue bg, shared height, vertical centering"
    - path: "app/members/[id]/page.tsx"
      provides: "Member profile hero with GOYA blue bg, shared height, vertical centering"
  key_links:
    - from: "detail page heroes"
      to: "PageHero.tsx"
      via: "matching height classes and bg-primary color"
      pattern: "h-\\[200px\\] sm:h-\\[220px\\] md:h-\\[240px\\].*bg-primary"
---

<objective>
Make all detail page heroes visually consistent with the overview page heroes: same GOYA primary blue background, same height, and vertically centered content.

Purpose: Eliminate visual jarring when navigating between overview and detail pages — heroes should feel like the same system.
Output: Updated event detail, course detail, and member profile pages with consistent hero sections.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/globals.css (CSS variables: --goya-primary is #345c83, Tailwind token: bg-primary)
@app/components/PageHero.tsx (reference hero: h-[200px] sm:h-[220px] md:h-[240px], flex items-center justify-center, bg-primary for dark variant)

<interfaces>
<!-- Reference hero pattern from PageHero.tsx (dark variant) — all detail heroes must match this structure -->

Height classes: h-[200px] sm:h-[220px] md:h-[240px]
Centering: flex items-center (on the outer hero container)
Background: bg-primary (maps to var(--goya-primary) = #345c83)
Decorations: dot-grid texture overlay (opacity-[0.04]), soft glow top-right (bg-primary-light/20 blur-3xl)

From app/components/ui/PageContainer.tsx:
- Provides max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Already imported in event detail page; must be used in all detail heroes
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix event detail and course detail hero sections</name>
  <files>app/events/[id]/page.tsx, app/academy/[id]/page.tsx</files>
  <action>
**Event detail page (app/events/[id]/page.tsx):**

The gradient hero (no-image branch, lines 85-119) currently uses `bg-primary-dark pt-24 pb-12` with no fixed height and no vertical centering.

1. Change the outer div from `bg-primary-dark relative overflow-hidden pt-24 pb-12` to:
   `bg-primary relative overflow-hidden flex items-center h-[200px] sm:h-[220px] md:h-[240px]`
   - `bg-primary` instead of `bg-primary-dark` (matches PageHero dark variant exactly)
   - Fixed height classes matching PageHero
   - `flex items-center` for vertical centering
   - Remove pt-24 and pb-12 (height is now fixed, centering is via flexbox)

2. Keep all decorative elements (dot-grid texture, soft glow) unchanged.

3. The PageContainer content block: remove `mb-6` from the back link (centering handles spacing). Keep all other content (back link, badges, title, date) unchanged.

4. The image hero branch (lines 46-82): Leave UNCHANGED — image heroes have their own design with the gradient overlay on the image. The task description only mentions "gradient hero" consistency.

**Course detail page (app/academy/[id]/page.tsx):**

The hero (lines 67-132) currently uses an inline `style={{ background: linear-gradient(135deg, ${course.gradient_from}dd, ${course.gradient_to}dd) }}` with category-specific colors and `pt-24 pb-16 px-4`.

1. Replace the entire hero outer div from:
   ```
   <div className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8" style={{ background: `linear-gradient(...)` }}>
   ```
   to:
   ```
   <div className="bg-primary relative overflow-hidden flex items-center h-[200px] sm:h-[220px] md:h-[240px]">
   ```
   - Remove the inline `style` attribute entirely (no more category gradient colors)
   - Remove px-4 sm:px-6 lg:px-8 from the outer div (PageContainer handles padding)
   - Add the same dot-grid texture overlay and soft glow decorations from PageHero dark variant for consistency

2. The inner div currently is `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`. Replace with `<PageContainer className="relative">` — import PageContainer (already available in the project).

3. Remove `mb-8` from the back link, remove `mb-4` from badges div, reduce `mb-3` on h1 to `mb-2`, remove `mb-5` from short_description. The flexbox centering handles vertical distribution. Keep small gaps (mb-2, mb-3) for internal content spacing only.

4. Keep all content unchanged: back link, category/access/level badges, title, short_description, meta row (instructor, duration, lessons).
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Both event detail (gradient branch) and course detail heroes use bg-primary background color, h-[200px] sm:h-[220px] md:h-[240px] height, and flex items-center vertical centering — matching PageHero dark variant exactly. No category gradient colors remain in course detail hero.</done>
</task>

<task type="auto">
  <name>Task 2: Fix member profile hero and write activity log</name>
  <files>app/members/[id]/page.tsx, activity/quick-tasks/quick-task_HeroConsistency_31-03-2026.md</files>
  <action>
**Member profile page (app/members/[id]/page.tsx):**

The hero (line 59) currently uses `bg-gradient-to-b from-[#1B3A5C] via-[#1B3A5C] to-[#1e3a5f] pt-20 pb-20 px-4 sm:px-6 lg:px-8` with hardcoded hex colors and no fixed height.

1. Replace the hero outer div from:
   ```
   <div className="bg-gradient-to-b from-[#1B3A5C] via-[#1B3A5C] to-[#1e3a5f] pt-20 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
   ```
   to:
   ```
   <div className="bg-primary relative overflow-hidden flex items-center h-[200px] sm:h-[220px] md:h-[240px]">
   ```
   - `bg-primary` replaces the hardcoded hex gradient (Fix 4: correct CSS variable)
   - Fixed height matching PageHero
   - `flex items-center` for vertical centering
   - Remove pt-20, pb-20, px-4 sm:px-6 lg:px-8 (height is fixed, centering is flexbox, PageContainer handles horizontal padding)

2. The decorative glow element (line 61, the absolute div with bg-[#4E87A0]) — replace `bg-[#4E87A0]` with `bg-primary-light` to use the CSS variable instead of hardcoded hex. Keep the rest of the styling.

3. The inner content div (line 64): change `<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">` to use PageContainer: `<PageContainer className="relative">`. Import PageContainer at the top of the file.

4. Reduce `mb-10` on the back link to `mb-4` (the fixed height + centering means less manual spacing needed). Keep avatar, name, role badge, location info unchanged.

**Activity log:**

Create `activity/quick-tasks/quick-task_HeroConsistency_31-03-2026.md` with:
- Task description: Hero consistency across detail pages — GOYA blue, shared height, vertical centering
- Status: Complete
- Solution summary: Applied bg-primary, h-[200px]/sm:h-[220px]/md:h-[240px], flex items-center to event detail, course detail, and member profile heroes. Removed category gradient colors from course detail. Replaced hardcoded hex values with CSS variables on member profile.
- Files changed: app/events/[id]/page.tsx, app/academy/[id]/page.tsx, app/members/[id]/page.tsx
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Member profile hero uses bg-primary (CSS variable, not hardcoded hex), same fixed height as all other heroes, content vertically centered. Activity log written. All four fixes from the task description are addressed across both tasks.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. All three detail pages use `bg-primary` (not hardcoded hex, not category gradients)
3. All three detail pages use `h-[200px] sm:h-[220px] md:h-[240px]` (matching PageHero)
4. All three detail pages use `flex items-center` for vertical centering
5. No hardcoded #345c83, #1B3A5C, or gradient_from/to in any hero section
6. Activity log exists at activity/quick-tasks/quick-task_HeroConsistency_31-03-2026.md
</verification>

<success_criteria>
- Navigating from Events overview to an event detail: hero height stays the same, color is GOYA blue
- Navigating from Academy overview to a course: hero height stays the same, color is GOYA blue (not category purple/orange/etc.)
- Navigating to a member profile: hero is GOYA blue, same height, content centered
- TypeScript compiles cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/260331-kny-hero-consistency-goya-blue-shared-height/260331-kny-SUMMARY.md`
</output>
