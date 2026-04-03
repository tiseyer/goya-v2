---
phase: quick
plan: 260403-bsn
type: execute
wave: 1
depends_on: []
files_modified:
  - app/events/page.tsx
  - app/globals.css
autonomous: true
requirements: []
must_haves:
  truths:
    - "Events page outer background is dark in dark mode"
    - "Events page looks unchanged in light mode"
    - "No other pages are affected by these changes"
  artifacts:
    - path: "app/events/page.tsx"
      provides: "Events page with dark-compatible background"
    - path: "app/globals.css"
      provides: "Dark mode override for events page background hex"
  key_links: []
---

<objective>
Fix the Events page outer background to respect dark mode. Currently the page wrapper uses a hardcoded `bg-[#F8FAFC]` (line 320 of app/events/page.tsx) which has no `.dark` override in globals.css, so it stays light gray in dark mode while the cards/sidebar/calendar correctly go dark.

Purpose: Visual consistency — the events page should be fully dark in dark mode.
Output: Events page with correct dark background, no regressions.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/events/page.tsx
@app/globals.css
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dark mode override for events page background</name>
  <files>app/globals.css, app/events/page.tsx</files>
  <action>
Two changes needed:

1. In `app/globals.css`, add a dark override for `bg-[#F8FAFC]` alongside the existing overrides around lines 208-210. Add:
```css
.dark .bg-\[\#F8FAFC\] { background-color: var(--background) !important; }
```
This follows the exact same pattern as the existing `.dark .bg-\[\#F9FAFB\]` and `.dark .bg-\[\#F3F4F6\]` overrides already in the file.

2. In `app/events/page.tsx`, also update the `bg-white` usages on the mobile filter bar (line 328) to add dark mode compatibility. The mobile sticky bar uses `bg-white/95 backdrop-blur-sm` — add a dark variant by changing it to:
```
bg-white/95 dark:bg-[#0F1117]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700
```

Do NOT touch:
- Card styles, sidebar styles, calendar styles
- Any logic, filtering, or data fetching
- The PageHero component
- Any file other than events/page.tsx and globals.css
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
- `bg-[#F8FAFC]` has a `.dark` override in globals.css mapping to `var(--background)`
- Mobile filter bar has dark mode background variant
- `tsc --noEmit` passes with 0 errors
- No other pages affected (the only other usage of `bg-[#F8FAFC]` is in admin/shop which is unrelated and benefits from the same fix)
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes
- `grep -n 'F8FAFC' app/globals.css` shows the new dark override
- Events page renders with dark background in dark mode
</verification>

<success_criteria>
Events page outer background matches the dark theme in dark mode. Light mode is unchanged. No other pages affected. TypeScript compiles cleanly.
</success_criteria>

<output>
After completion, create `.planning/quick/260403-bsn-fix-events-page-dark-background/260403-bsn-SUMMARY.md`
</output>
