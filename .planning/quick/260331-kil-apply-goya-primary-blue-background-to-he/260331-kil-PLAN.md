---
phase: quick
plan: 260331-kil
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/PageHero.tsx
  - app/dashboard/page.tsx
  - app/events/page.tsx
  - app/academy/page.tsx
  - app/addons/page.tsx
  - activity/quick-tasks/quick-task_HeroBlueBackground_31-03-2026.md
autonomous: true
requirements: [QUICK]
must_haves:
  truths:
    - "Dashboard hero has dark blue (#345c83) background with white text"
    - "Events overview hero has dark blue (#345c83) background with white text"
    - "Academy hero has dark blue (#345c83) background with white text"
    - "Add-Ons hero has dark blue (#345c83) background with white text"
    - "Pills/badges in hero sections use white text with semi-transparent white border (matching event detail hero style)"
    - "Event detail page hero is unchanged"
    - "Members Directory page is unchanged"
  artifacts:
    - path: "app/components/PageHero.tsx"
      provides: "Dark variant support for hero sections"
    - path: "activity/quick-tasks/quick-task_HeroBlueBackground_31-03-2026.md"
      provides: "Activity log"
  key_links:
    - from: "app/dashboard/page.tsx"
      to: "app/components/PageHero.tsx"
      via: "variant='dark' prop"
      pattern: "variant.*dark"
---

<objective>
Apply the GOYA primary blue background (#345c83, var(--goya-primary)) to the hero/top sections of the Dashboard, Events, Academy, and Add-Ons pages. Use the event detail page's gradient hero (no-image variant) as the visual reference.

Purpose: Establish consistent brand identity across all main public pages with the signature GOYA dark blue hero sections.
Output: Updated PageHero component with dark variant, four pages using it, activity log.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/PageHero.tsx
@app/events/[id]/page.tsx (reference — gradient hero with no image, lines 85-119)
@app/dashboard/page.tsx
@app/events/page.tsx
@app/academy/page.tsx
@app/addons/page.tsx
@app/globals.css (lines 19-34 — CSS variable definitions)

<interfaces>
<!-- Current PageHero interface -->
From app/components/PageHero.tsx:
```typescript
interface PageHeroProps {
  pill?: string;
  pillIcon?: ReactNode;
  title: string;
  subtitle?: string;
  customPill?: ReactNode;
}
```

<!-- Reference hero style from event detail page (no-image variant, lines 85-119) -->
Key patterns from reference:
- Background: `bg-primary-dark` with dot-grid texture overlay at `opacity-[0.04]`
- Soft glow: `bg-primary-light/20 rounded-full blur-3xl`
- Pills: `bg-white/12 text-white/90 border border-white/15 rounded-full`
- Title: `text-white font-black`
- Subtitle text: `text-primary-200`

<!-- CSS variables from globals.css -->
- `--goya-primary: #345c83` (this is the target color)
- `--goya-primary-light: #4e87a0`
- `--goya-primary-dark: #1e3a52`
- Tailwind class `bg-primary` maps to `var(--goya-primary)` = #345c83
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dark variant to PageHero component</name>
  <files>app/components/PageHero.tsx</files>
  <action>
Add a `variant` prop to PageHeroProps: `variant?: 'light' | 'dark'` defaulting to `'light'`.

When `variant === 'dark'`:
- Section background: `bg-primary` (maps to --goya-primary = #345c83) instead of `bg-surface-muted`. Remove `border-b border-slate-200`.
- Add subtle dot-grid texture overlay (same as event detail hero reference):
  ```
  backgroundImage: radial-gradient(circle at 1px 1px, white 1px, transparent 0)
  backgroundSize: 28px 28px
  opacity: 0.04
  ```
- Add soft glow element: `absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2`
- Background glow: change `bg-primary opacity-[0.03]` to `bg-white opacity-[0.05]`
- Pill: change from `bg-primary/8 border-primary/15 text-primary` to `bg-white/12 text-white/90 border-white/15` (matching event detail hero badge style)
- Title: change from `text-primary-dark` to `text-white`
- Subtitle: change from `text-slate-500` to `text-primary-200`

When `variant === 'light'` (default): no changes to existing behavior.

Use conditional classes with the variant prop. Keep the component a server component (no 'use client' needed). Make sure to add `relative overflow-hidden` to the section element when dark, so the absolute-positioned decorative elements are contained.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>PageHero supports variant="dark" with blue background, white text, and decorative elements matching the event detail hero reference. Default "light" variant unchanged.</done>
</task>

<task type="auto">
  <name>Task 2: Apply dark variant to Dashboard, Events, Academy, and Add-Ons pages</name>
  <files>app/dashboard/page.tsx, app/events/page.tsx, app/academy/page.tsx, app/addons/page.tsx</files>
  <action>
In each of the four pages, add `variant="dark"` to the existing `<PageHero>` call:

1. **app/dashboard/page.tsx** (line ~123): `<PageHero variant="dark" pill="GOYA Dashboard" ...>`
2. **app/events/page.tsx** (line ~235): `<PageHero variant="dark" pill="Events" ...>`
3. **app/academy/page.tsx** (line ~113): `<PageHero variant="dark" pill="GOYA Academy" ...>`
4. **app/addons/page.tsx** (line ~155): `<PageHero variant="dark" pill="Brightcoms" ...>`

No other changes to these files. Do NOT touch:
- app/events/[id]/page.tsx (already correct, uses its own custom hero)
- app/members/page.tsx (intentionally no hero)
- Any admin pages

After edits, run `npx tsc --noEmit` and fix any type errors.
Write activity log to `activity/quick-tasks/quick-task_HeroBlueBackground_31-03-2026.md` with task description, status (complete), and solution summary.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All four pages render PageHero with variant="dark". TypeScript compiles cleanly. Activity log created.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `grep -n 'variant="dark"' app/dashboard/page.tsx app/events/page.tsx app/academy/page.tsx app/addons/page.tsx` shows all four pages using dark variant
- `grep -n 'variant' app/components/PageHero.tsx` shows variant prop with dark/light conditional logic
- Event detail page (`app/events/[id]/page.tsx`) has NO changes (git diff shows no modifications)
</verification>

<success_criteria>
- All four hero sections display #345c83 (bg-primary) background with white text
- Pills use white text with semi-transparent white border (bg-white/12 text-white/90 border-white/15)
- Event detail page hero is untouched
- Members Directory page is untouched
- TypeScript compiles cleanly
- All changes committed and pushed to develop
</success_criteria>

<output>
After completion, create `.planning/quick/260331-kil-apply-goya-primary-blue-background-to-he/260331-kil-SUMMARY.md`
</output>
