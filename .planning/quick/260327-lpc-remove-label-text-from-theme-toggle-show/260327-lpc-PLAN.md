---
phase: quick
plan: 260327-lpc
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/ThemeToggle.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Theme toggle buttons show only icons, no text labels"
    - "Toggle still functions correctly to switch between light/dark/system"
    - "Button layout remains evenly distributed with flex-1"
  artifacts:
    - path: "app/components/ThemeToggle.tsx"
      provides: "Icon-only ThemeInline component"
  key_links: []
---

<objective>
Remove label text from ThemeInline toggle buttons so only icons are displayed.

Purpose: Cleaner, more compact theme toggle UI — icons are self-explanatory with the existing `title` attribute providing accessibility.
Output: Updated ThemeToggle.tsx with icon-only buttons.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/components/ThemeToggle.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove label spans and unused text classes from ThemeInline buttons</name>
  <files>app/components/ThemeToggle.tsx</files>
  <action>
In the ThemeInline component (lines 102-135), make these changes to the button inside the THEMES.map:

1. Delete line 129: `<span>{t.label}</span>` — removes the visible text label
2. In the button className array (line 122), change:
   - FROM: `'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer'`
   - TO: `'flex-1 flex items-center justify-center py-1.5 rounded-md transition-all duration-150 cursor-pointer'`
   - Removes `gap-1.5` (no gap needed with single icon), `text-xs` and `font-medium` (no text to style)

Keep the `title={t.label}` attribute intact for hover tooltip accessibility.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next lint --file app/components/ThemeToggle.tsx 2>&1 | tail -5</automated>
  </verify>
  <done>ThemeInline buttons render icons only with no label text. Button className no longer includes gap-1.5, text-xs, or font-medium. title attribute preserved for accessibility.</done>
</task>

</tasks>

<verification>
- `grep -n "t.label" app/components/ThemeToggle.tsx` returns only the `title={t.label}` line, not a span
- `grep "gap-1.5" app/components/ThemeToggle.tsx` returns no matches
- `grep "text-xs" app/components/ThemeToggle.tsx` returns no matches in ThemeInline (may exist elsewhere in file)
</verification>

<success_criteria>
Theme toggle displays three icon-only buttons with no visible text. Layout and functionality unchanged.
</success_criteria>

<output>
After completion, create `.planning/quick/260327-lpc-remove-label-text-from-theme-toggle-show/260327-lpc-SUMMARY.md`
</output>
