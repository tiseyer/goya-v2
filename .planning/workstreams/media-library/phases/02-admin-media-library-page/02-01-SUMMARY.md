---
phase: 2
plan: 1
subsystem: admin-media-library
tags: [admin, media, navigation, layout, url-state]
dependency_graph:
  requires: [media-01-01]  # media_folders table + RLS from Phase 1
  provides: [media-02-02, media-02-03]  # grid/detail panels can now build into the three-panel shell
  affects: [admin-shell]
tech_stack:
  added: []
  patterns:
    - Server component + Client component split (page.tsx + MediaPageClient.tsx)
    - URL search params for bookmarkable state (folder, view)
    - localStorage for UI preferences (view mode, sidebar collapsed)
    - Service role Supabase queries for admin folder listing
key_files:
  created:
    - app/admin/media/actions.ts
    - app/admin/media/page.tsx
    - app/admin/media/MediaPageClient.tsx
    - app/admin/media/FolderSidebar.tsx
  modified:
    - app/admin/components/AdminShell.tsx
decisions:
  - "FolderSidebar placed directly in app/admin/media/ (not a components/ subdirectory) to match the plan artifacts spec and admin page conventions"
  - "Bucket key as activeFolder string distinguishes bucket-level vs folder-level selection for EmptyState messaging"
  - "Detail panel slot reserved as w-0 div so Plans 02-03 can animate it open without layout shift"
  - "useEffect hydrates localStorage after mount to avoid SSR/hydration mismatch on view mode and sidebar state"
metrics:
  duration: "~20 minutes"
  completed: "2026-03-31"
  tasks: 3
  files: 5
---

# Phase 2 Plan 1: Core Page Layout, Sidebar & Folder Navigation Summary

**One-liner:** Three-panel admin media page shell with URL-bookmarkable folder selection, collapsible sidebar, and localStorage-persisted view toggle.

## What Was Built

### AdminShell.tsx — Media nav link
Inserted a new `NavLink` entry between Users and Events using a photo/landscape SVG icon (`M4 16l4.586...`). The link navigates to `/admin/media` and highlights when `pathname.startsWith('/admin/media')`.

### app/admin/media/actions.ts
- Exports `MEDIA_BUCKETS` const array (5 buckets: avatars, event-images, school-logos, upgrade-certificates, uploads) and `BucketKey` type — shared with Plans 02-02 and 02-03
- Exports `MediaFolder` type aliased from `Database['public']['Tables']['media_folders']['Row']`
- Exports `getFolders()` — uses `getSupabaseService()` (service role), orders by `sort_order asc, name asc`, non-throwing (logs + returns `[]` on error)

### app/admin/media/page.tsx
- Next.js 15 async `searchParams: Promise<{folder?, view?}>` pattern
- `Promise.all([getFolders(), searchParams])` to parallelise the two async operations
- Passes `initialFolders`, `folder`, `view` to `MediaPageClient`

### app/admin/media/FolderSidebar.tsx
- 240px expanded / 56px collapsed, `transition-[width] duration-200` matching AdminShell
- All Media button at top (null activeFolder), divider, then 5 MEDIA_BUCKETS sections
- Bucket rows are clickable (sets activeFolder to bucket key) — expanded shows label, collapsed shows colored dot
- Top-level folders filtered by `f.bucket === bucket.key && !f.parent_id`
- Sub-folders filtered by `f.parent_id === parentFolder.id`, indented 1 extra level
- Active item: `bg-primary/10 text-primary font-semibold`; inactive: `text-slate-500 hover:text-primary-dark hover:bg-primary-50`
- `title` tooltip in collapsed mode for accessibility

### app/admin/media/MediaPageClient.tsx
- Three-panel flex layout: `FolderSidebar | main area | detail panel slot (w-0)`
- `activeFolder` state: initialized from `folder` prop, null = All Media
- `viewMode` state: initialized from `view` prop → localStorage → default `'grid'`
- `sidebarCollapsed` state: hydrated from `localStorage('media-sidebar-collapsed')` in `useEffect`
- `buildParams()` helper merges updates into current `useSearchParams()` string
- Folder selection: `router.push('/admin/media?folder=...', { scroll: false })`
- View toggle: writes to localStorage AND pushes `?view=` param
- Toolbar with grid/list toggle buttons (active: `bg-primary/10 text-primary`)
- `EmptyState` inline component with 3 context-aware messages
- Detail panel slot reserved as `w-0 shrink-0` div for Plans 02-03 animation

## Deviations from Plan

None — plan executed exactly as written.

## Notes for Plans 02-02 and 02-03

**For Plan 02-02 (Media Grid):**
- Import `MEDIA_BUCKETS`, `BucketKey`, `MediaFolder` from `./actions`
- The toolbar placeholder div (`<div className="flex-1" />`) is where search + filter controls go
- The `<EmptyState />` section in `MediaPageClient` is the replacement point for the actual grid/list render — pass `viewMode` down or lift the grid into this component
- `activeFolder` state already flows to FolderSidebar; pass it to the grid fetch as a filter param

**For Plan 02-03 (Detail Panel):**
- The `w-0 shrink-0` div at the end of the three-panel flex is the detail panel slot
- Toggle it to `w-[380px]` when an item is selected — push-content layout, no overlay
- Wire selectedItem state into MediaPageClient alongside activeFolder

## Known Stubs

- Toolbar search and filter slots: empty (`<div className="flex-1" />`) — intentionally deferred to Plan 02-02
- Content area: `EmptyState` only — media grid deferred to Plan 02-02
- Detail panel: `w-0` slot — deferred to Plan 02-03

These stubs are structural placeholders, not data stubs. The page's Plan 01 goal (navigable shell, folder selection, URL state) is fully achieved.

## Self-Check: PASSED

Files verified:
- app/admin/media/actions.ts — exists
- app/admin/media/page.tsx — exists
- app/admin/media/MediaPageClient.tsx — exists
- app/admin/media/FolderSidebar.tsx — exists
- app/admin/components/AdminShell.tsx — modified (Media link between Users and Events)

Commits verified:
- 9a2e5e0 feat(media-02-01): add Media nav link and server page scaffold
- 6d827d7 feat(media-02-01): FolderSidebar with All Media, bucket sections, and nested folders
- a8d627d feat(media-02-01): MediaPageClient three-panel shell with URL state and view toggle

TypeScript: zero new errors (only pre-existing linkify-it/mdurl definition errors unrelated to this plan).
