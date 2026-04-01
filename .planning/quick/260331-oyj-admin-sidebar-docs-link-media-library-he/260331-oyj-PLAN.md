---
type: quick-task
name: Admin sidebar docs link + media library header alignment
status: planned
---

<objective>
Two small fixes: (1) add a Documentation link to the admin sidebar Settings group, and (2) fix the vertical misalignment between the Media Library's folder sidebar header and the main content toolbar.
</objective>

<context>
@app/admin/components/AdminShell.tsx — sidebar navigation with NAV_ITEMS array
@app/admin/media/FolderSidebar.tsx — folder sidebar with h-12 header (line 433)
@app/admin/media/MediaToolbar.tsx — toolbar with h-14 row on sm+ (line 152)
@app/admin/media/MediaPageClient.tsx — composes FolderSidebar + MediaToolbar
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Documentation link to admin sidebar Settings group</name>
  <files>app/admin/components/AdminShell.tsx</files>
  <action>
    NOTE: After reading AdminShell.tsx, the Documentation link ALREADY EXISTS at line 114 in the Settings group children array:
    ```
    { href: '/admin/docs', label: 'Documentation', paths: ['M12 6.253v13m0-13C10.832...'] }
    ```
    However, it uses a book/open-book SVG path (same as Courses icon). The user wants a BookOpen icon from lucide-react.

    Replace the current Documentation entry's inline SVG paths with a proper lucide-react BookOpen icon. Since AdminShell uses raw SVG path data (not lucide-react components), use the BookOpen SVG path from lucide-react:
    - d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" (first path)
    - d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" (second path)

    Update the Documentation entry in the Settings children array (line 114) to use these two paths instead of the current single book path. This differentiates it from the Courses icon which uses a similar open-book path.
  </action>
  <verify>Run `npx next build 2>&1 | tail -5` — build completes without errors. Visually confirm the Documentation item appears under Settings in the sidebar with a distinct icon.</verify>
  <done>Documentation sidebar link uses BookOpen icon paths distinct from the Courses icon.</done>
</task>

<task type="auto">
  <name>Task 2: Fix Media Library header vertical alignment</name>
  <files>app/admin/media/FolderSidebar.tsx, app/admin/media/MediaToolbar.tsx</files>
  <action>
    The misalignment is caused by differing header heights:
    - FolderSidebar header: `h-12` (48px) at line 433
    - MediaToolbar sm+ row: `h-14` (56px) at line 152

    Fix by making both headers the same height. Change FolderSidebar header from `h-12` to `h-14` (line 433):
    ```
    <div className="flex items-center h-14 px-2 border-b border-slate-200 shrink-0">
    ```

    This ensures the "Folders" text and the search/filter toolbar row sit at the same vertical position. The h-14 (56px) is the standard toolbar height used across the admin — matching it is the correct approach.

    Do NOT change MediaToolbar's height — h-14 is the established pattern.
  </action>
  <verify>Run the dev server (`npm run dev`) and navigate to /admin/media. Confirm the "Folders" header text and the search/filter bar are on the same horizontal line. The bottom border of both headers should align perfectly.</verify>
  <done>FolderSidebar header and MediaToolbar are both h-14, visually aligned on the same horizontal line.</done>
</task>

</tasks>

<verification>
1. `npx next build` completes without errors
2. /admin/media — Folders header and search toolbar are vertically aligned
3. Admin sidebar Settings group — Documentation link present with BookOpen icon
</verification>
