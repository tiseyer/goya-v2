---
phase: quick
plan: 260330-oyn
type: execute
wave: 1
depends_on: []
files_modified:
  - app/members/[id]/page.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Member detail page no longer falls back to staticMembers lookup"
    - "Page still renders correctly for profiles found in database"
    - "Page returns 404 for profiles not found in database"
  artifacts:
    - path: "app/members/[id]/page.tsx"
      provides: "Member detail page without static fallback"
      contains: "const staticMember = null"
  key_links: []
---

<objective>
Remove the staticMembers lookup fallback in the members detail page. The line that searches staticMembers when profileData is missing should be replaced with a hard null assignment, ensuring the page relies solely on database-sourced profile data.

Purpose: Eliminate stale static member data fallback now that all member data is served from Supabase.
Output: Updated app/members/[id]/page.tsx
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/members/[id]/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace staticMembers lookup with null assignment</name>
  <files>app/members/[id]/page.tsx</files>
  <action>
On line 47 of app/members/[id]/page.tsx, replace:
```
const staticMember = !profileData ? staticMembers.find(m => m.id === id) : null;
```
with:
```
const staticMember = null;
```

After making this change, check if the `staticMembers` import is still used anywhere else in the file. If it is no longer referenced, remove the import as well to keep the file clean.

Then verify the file has no TypeScript errors by running `npx tsc --noEmit --pretty` on the file.

Commit the change with message: "fix: remove stale staticMembers lookup fallback in members detail page"
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>Line 47 reads `const staticMember = null;`, unused staticMembers import removed if applicable, TypeScript compiles without errors, change committed.</done>
</task>

</tasks>

<verification>
- `grep -n "staticMembers.find" app/members/[id]/page.tsx` returns no matches
- `grep -n "const staticMember = null" app/members/[id]/page.tsx` returns line 47
- TypeScript compilation succeeds
</verification>

<success_criteria>
- staticMembers lookup fallback is removed
- File compiles without TypeScript errors
- Change is committed to git
</success_criteria>

<output>
After completion, create `.planning/quick/260330-oyn-remove-staticmembers-lookup-fallback-in-/260330-oyn-SUMMARY.md`
</output>
