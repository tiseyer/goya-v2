---
phase: quick
plan: 260403-bpe
type: execute
wave: 1
depends_on: []
files_modified:
  - app/dashboard/components/DashboardStudent.tsx
  - app/dashboard/components/DashboardTeacher.tsx
  - app/dashboard/components/DashboardWellness.tsx
  - app/dashboard/components/DashboardSchool.tsx
  - app/dashboard/components/DashboardGreeting.tsx
  - app/components/PageHero.tsx
autonomous: true
must_haves:
  truths:
    - "All 4 dashboard layouts show a full-width PageHero with role pill, time-of-day greeting, and subtitle"
    - "DashboardGreeting component is deleted and not imported anywhere"
    - "PageHero.tsx has a TODO comment listing pages that could adopt PageHero"
  artifacts:
    - path: "app/dashboard/components/DashboardStudent.tsx"
      provides: "Student dashboard with PageHero"
      contains: "PageHero"
    - path: "app/dashboard/components/DashboardTeacher.tsx"
      provides: "Teacher dashboard with PageHero"
      contains: "PageHero"
    - path: "app/dashboard/components/DashboardWellness.tsx"
      provides: "Wellness dashboard with PageHero"
      contains: "PageHero"
    - path: "app/dashboard/components/DashboardSchool.tsx"
      provides: "School dashboard with PageHero"
      contains: "PageHero"
  key_links:
    - from: "app/dashboard/components/Dashboard*.tsx"
      to: "app/components/PageHero.tsx"
      via: "import and render"
      pattern: "import.*PageHero"
---

<objective>
Replace DashboardGreeting with PageHero across all 4 dashboard layouts, then audit for other pages that should adopt PageHero.

Purpose: Standardize hero sections site-wide using the existing PageHero component.
Output: Updated dashboard layouts, removed DashboardGreeting, TODO list of adoption candidates.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/PageHero.tsx
@app/dashboard/components/DashboardStudent.tsx
@app/dashboard/components/DashboardTeacher.tsx
@app/dashboard/components/DashboardWellness.tsx
@app/dashboard/components/DashboardSchool.tsx
@app/dashboard/components/DashboardGreeting.tsx
@app/dashboard/components/utils.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace DashboardGreeting with PageHero in all 4 dashboard layouts</name>
  <files>
    app/dashboard/components/DashboardStudent.tsx,
    app/dashboard/components/DashboardTeacher.tsx,
    app/dashboard/components/DashboardWellness.tsx,
    app/dashboard/components/DashboardSchool.tsx
  </files>
  <action>
For each of the 4 dashboard layout files:

1. Add import: `import PageHero from '@/app/components/PageHero';`
2. Remove import of DashboardGreeting.
3. Keep using `getTimeOfDay()` from `./utils` to compute a dynamic title.
4. Restructure the JSX so PageHero sits OUTSIDE and BEFORE the PageContainer:

```tsx
<div className="min-h-screen bg-slate-50">
  <PageHero
    variant="dark"
    pill="{role pill}"
    title={`Good ${getTimeOfDay()}, ${firstName}.`}
    subtitle="{subtitle}"
  />
  <PageContainer>
    <div className="py-8 space-y-8">
      {/* ... existing dashboard content unchanged ... */}
    </div>
  </PageContainer>
</div>
```

Role mapping:
- DashboardStudent: pill="Student", subtitle="Ready to practice today?"
- DashboardTeacher: pill="Teacher", subtitle="What will you teach today?"
- DashboardWellness: pill="Wellness Practitioner", subtitle="Ready to support your clients?"
- DashboardSchool: pill="School Owner", title uses schoolName not firstName, subtitle="Manage your school and students."

5. Remove any DashboardGreeting JSX usage from each file.
6. Do NOT change any other dashboard content or layout below the hero.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>All 4 dashboard layouts render PageHero with variant="dark", correct pill, dynamic time-of-day title, and role-specific subtitle. No DashboardGreeting imports remain in any dashboard file.</done>
</task>

<task type="auto">
  <name>Task 2: Audit pages for PageHero adoption candidates and clean up DashboardGreeting</name>
  <files>
    app/components/PageHero.tsx,
    app/dashboard/components/DashboardGreeting.tsx
  </files>
  <action>
Part A — Scan for adoption candidates:

Search all `app/**/page.tsx` files (excluding `app/admin/`) for hero-like patterns:
- Large headings (`text-3xl`, `text-4xl`, `font-bold` near top of JSX)
- Inline hero sections with background colors
- Any pattern that looks like a hand-rolled page header

Add a TODO comment block at the top of `app/components/PageHero.tsx` (after any 'use client' or imports, before the component) listing pages that could adopt PageHero but don't yet. Format:

```tsx
// TODO: Pages that could adopt PageHero:
// - app/path/to/page.tsx — has inline hero with [description]
// - app/path/to/other/page.tsx — has custom header section
```

If no candidates found beyond the ones already using PageHero, note that instead.

Part B — Delete DashboardGreeting:

1. Grep the entire codebase for imports of DashboardGreeting.
2. If NO remaining imports exist (Task 1 removed them all), delete `app/dashboard/components/DashboardGreeting.tsx`.
3. If `getTimeOfDay` in `app/dashboard/components/utils.tsx` is still imported by the dashboard files, keep it. Only delete utils.tsx if nothing imports from it.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30 && echo "---" && grep -r "DashboardGreeting" app/ --include="*.tsx" --include="*.ts" -l; echo "Exit: $?"</automated>
  </verify>
  <done>DashboardGreeting.tsx is deleted. PageHero.tsx has a TODO comment listing any pages that could adopt it. TypeScript compiles clean.</done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with 0 errors
- `grep -r "DashboardGreeting" app/ -l` returns no results
- All 4 Dashboard*.tsx files contain `<PageHero` with `variant="dark"`
- PageHero.tsx contains a TODO comment about adoption candidates
</verification>

<success_criteria>
All dashboard layouts use PageHero with role-aware content. DashboardGreeting is removed. Adoption audit is documented as TODO in PageHero.tsx.
</success_criteria>

<output>
After completion, create `.planning/quick/260403-bpe-standardize-page-hero-sections-with-reus/260403-bpe-SUMMARY.md`
</output>
