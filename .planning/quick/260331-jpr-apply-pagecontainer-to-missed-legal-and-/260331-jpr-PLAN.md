---
phase: quick-260331-jpr
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/privacy/page.tsx
  - app/terms/page.tsx
  - app/code-of-conduct/page.tsx
  - app/code-of-ethics/page.tsx
  - app/events/[id]/page.tsx
autonomous: true
requirements: [LAYOUT-CONSISTENCY]

must_haves:
  truths:
    - "All 4 legal pages use PageContainer for hero and body content width"
    - "Event detail page uses PageContainer for hero overlays and main content"
    - "No page hardcodes max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 inline"
    - "Visual layout unchanged — same widths, same padding"
  artifacts:
    - path: "app/privacy/page.tsx"
      provides: "Privacy page with PageContainer"
      contains: "PageContainer"
    - path: "app/terms/page.tsx"
      provides: "Terms page with PageContainer"
      contains: "PageContainer"
    - path: "app/code-of-conduct/page.tsx"
      provides: "Code of Conduct page with PageContainer"
      contains: "PageContainer"
    - path: "app/code-of-ethics/page.tsx"
      provides: "Code of Ethics page with PageContainer"
      contains: "PageContainer"
    - path: "app/events/[id]/page.tsx"
      provides: "Event detail page with PageContainer"
      contains: "PageContainer"
  key_links:
    - from: "all 5 pages"
      to: "app/components/ui/PageContainer.tsx"
      via: "import PageContainer"
      pattern: "import PageContainer from.*PageContainer"
---

<objective>
Replace hardcoded `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` with the `PageContainer` component on 4 legal pages and the event detail page.

Purpose: These pages were missed when the PageContainer standard was established in quick-260331-j10. The component exists but was never imported into any page.
Output: 5 pages using PageContainer consistently, zero hardcoded layout widths on these pages.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/ui/PageContainer.tsx
@CLAUDE.md

<interfaces>
From app/components/ui/PageContainer.tsx:
```typescript
export default function PageContainer({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'main'
})
// Renders: <Tag className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 {className}">
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Apply PageContainer to 4 legal pages</name>
  <files>app/privacy/page.tsx, app/terms/page.tsx, app/code-of-conduct/page.tsx, app/code-of-ethics/page.tsx</files>
  <action>
All 4 legal pages share an identical structure. For each page:

1. Add import at top: `import PageContainer from '@/app/components/ui/PageContainer'`

2. HERO section — the full-bleed bg-primary-dark wrapper stays as-is (full-bleed background is fine per CLAUDE.md). Replace the inner `<div className="max-w-7xl mx-auto">` with `<PageContainer>`. Example for privacy:
   - Before: `<div className="bg-primary-dark pt-24 pb-14 px-4 sm:px-6 lg:px-8"><div className="max-w-7xl mx-auto">`
   - After: `<div className="bg-primary-dark pt-24 pb-14"><PageContainer>`
   - Remove the `px-4 sm:px-6 lg:px-8` from the outer bg div since PageContainer provides padding.

3. BODY section — per CLAUDE.md, prose pages use inner max-w-3xl for readability but outer container must be max-w-7xl. Replace:
   - Before: `<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24">`
   - After: `<PageContainer className="py-14 pb-24"><div className="max-w-3xl mx-auto">`
   - Close the new `</div>` and `</PageContainer>` correctly.

Do NOT change any content, text, colors, or other styling. Only swap the width/padding containers.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All 4 legal pages import and use PageContainer for both hero content and body content. No hardcoded max-w-7xl or px-4 sm:px-6 lg:px-8 remains on these pages. TypeScript compiles cleanly.</done>
</task>

<task type="auto">
  <name>Task 2: Apply PageContainer to event detail page</name>
  <files>app/events/[id]/page.tsx</files>
  <action>
The event detail page has 3 areas with hardcoded max-w-7xl:

1. Add import: `import PageContainer from '@/app/components/ui/PageContainer'`

2. IMAGE HERO (line ~58-79) — the absolute-positioned overlay inside the image hero. Replace:
   - Before: `<div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8"><div className="max-w-7xl mx-auto">`
   - After: `<div className="absolute bottom-0 left-0 right-0 pb-8"><PageContainer>`
   - Close `</PageContainer>` and `</div>` correctly.

3. GRADIENT HERO (line ~84-118) — the no-image fallback hero. The outer div has full-bleed bg. Replace:
   - Before: `<div className="bg-primary-dark relative overflow-hidden pt-24 pb-12 px-4 sm:px-6 lg:px-8">` ... `<div className="max-w-7xl mx-auto relative">`
   - After: `<div className="bg-primary-dark relative overflow-hidden pt-24 pb-12">` ... `<PageContainer className="relative">`
   - Remove `px-4 sm:px-6 lg:px-8` from the outer bg div.

4. MAIN CONTENT (line ~122) — Replace:
   - Before: `<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">`
   - After: `<PageContainer className="py-10">`
   - Close with `</PageContainer>` instead of `</div>`.

Do NOT change any content, grid layout, sticky sidebar, badges, SVGs, or other styling.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>Event detail page imports PageContainer and uses it in all 3 content areas (image hero overlay, gradient hero, main content). No hardcoded max-w-7xl or inline px-4 sm:px-6 lg:px-8 for layout width remains. TypeScript compiles cleanly.</done>
</task>

</tasks>

<verification>
After both tasks:
1. `npx tsc --noEmit` passes with no errors
2. `grep -rn "max-w-7xl" app/privacy/ app/terms/ app/code-of-conduct/ app/code-of-ethics/ app/events/\[id\]/` returns zero matches (all replaced by PageContainer)
3. `grep -rn "PageContainer" app/privacy/ app/terms/ app/code-of-conduct/ app/code-of-ethics/ app/events/\[id\]/` returns import + usage lines in each file
</verification>

<success_criteria>
- All 5 pages import and use PageContainer
- Zero hardcoded max-w-7xl on these 5 pages
- TypeScript compiles cleanly
- Visual layout is identical (same widths, same padding — just sourced from component)
</success_criteria>

<output>
After completion, create `.planning/quick/260331-jpr-apply-pagecontainer-to-missed-legal-and-/260331-jpr-SUMMARY.md`
</output>
