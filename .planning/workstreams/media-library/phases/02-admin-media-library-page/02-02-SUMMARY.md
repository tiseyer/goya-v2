---
phase: 2
plan: 2
subsystem: admin-media-library
tags: [admin, media, grid, list, search, filters, sort, infinite-scroll, url-state]
dependency_graph:
  requires: [media-02-01]
  provides: [media-02-03]
  affects: [admin-media-page]
tech_stack:
  added: []
  patterns:
    - Cursor-based infinite scroll with IntersectionObserver
    - Debounced search (300ms setTimeout + cleanup) synced to URL
    - Server action called client-side for filter/search changes (hybrid SSR + client)
    - Left join to profiles for uploader name via Supabase service role
key_files:
  created:
    - app/admin/media/actions.ts (extended — getMediaItems added)
    - app/admin/media/mediaUtils.ts
    - app/admin/media/MediaGrid.tsx
    - app/admin/media/MediaList.tsx
    - app/admin/media/MediaToolbar.tsx
  modified:
    - app/admin/media/MediaPageClient.tsx (fully rewritten to wire data)
    - app/admin/media/page.tsx (forwards q/type/date/by/sort params)
decisions:
  - "MediaItem type lives in actions.ts (source of truth); mediaUtils.ts re-exports it for convenience — Plan 02-03 should import from actions.ts directly"
  - "Cursor pagination only wired for newest/oldest sorts; name and size sorts fall back to no cursor (full re-fetch on scroll) — acceptable for current data volumes"
  - "Detail panel toggled between w-0 and w-[380px] based on selectedItem — push-content layout, no overlay"
  - "URL params use router.replace (not push) on filter changes to avoid polluting browser history with every keystroke"
  - "actions.ts got 'use server' directive added (was missing from Plan 02-01 implementation)"
metrics:
  duration: "~25 minutes"
  completed: "2026-03-31"
  tasks: 3
  files: 7
---

# Phase 2 Plan 2: Grid/List Views, Search, Filters & Sort Summary

**One-liner:** Full browse experience — responsive grid/list views rendering real media_items data with debounced search, combinable filters, sort, and cursor-based infinite scroll, all synced to URL params.

## What Was Built

### app/admin/media/actions.ts — getMediaItems()

Added `getMediaItems(params)` server action alongside the existing `getFolders()`:

- Left joins `media_items` with `profiles` via `media_items_uploaded_by_fkey` to get `uploader_name`
- Folder filter: bucket key → `bucket = key`; UUID → `folder = id`; null → all
- Search: `.or('file_name.ilike.%q%,title.ilike.%q%')` 
- Type filter: `image/%` like, `application/pdf` exact, `video/%` like
- Date filter: UTC midnight boundaries for today/week/month
- Uploader filter: team = `in ['admin','moderator']`; members = NOT IN those roles
- Cursor: `lt('created_at', cursor)` for newest, `gt` for oldest
- Limit: fetches `limit + 1` items; slices to `limit` and returns `nextCursor` if more exist
- Also added `'use server'` directive (was missing from Plan 02-01)

Also exported `MediaItem` type (flat shape) and `GetMediaItemsParams` interface.

### app/admin/media/mediaUtils.ts

Three utility functions plus type re-export:
- `getFileTypeColor(mimeType)` — Tailwind text+bg classes: emerald/red/blue/purple/slate
- `getFileTypeLabel(mimeType)` — Short uppercase label: JPEG/PDF/VIDEO/AUDIO/FILE
- `formatFileSize(bytes)` — Human-readable: B / KB / MB
- `getFileIconVariant(mimeType)` — Variant enum for icon selection
- Re-exports `MediaItem` type from actions.ts

### app/admin/media/MediaGrid.tsx

Client component accepting `MediaViewProps`:
- Responsive grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3`
- Each card: `aspect-square` image area; `<img>` for images, colored icon + label for others
- Selected state: `ring-2 ring-primary border-primary`
- Loading state: 12 `animate-pulse` skeleton cards
- SVG icons: DocumentIcon, VideoIcon, AudioIcon (inline, no extra dependencies)

### app/admin/media/MediaList.tsx

Client component accepting same `MediaViewProps`:
- Table with columns: Thumbnail | Name | Type | Size | Date | Uploaded by
- 40px thumbnail for images, colored icon badge for non-images
- TypeBadge component with same `getFileTypeColor` color classes
- Selected row: `bg-primary-50 border-l-2 border-l-primary`
- Loading state: 10 skeleton rows

### app/admin/media/MediaToolbar.tsx

Controlled client component:
- Search input with magnifier icon, flex-1 (max-w-xs)
- Three `<select>` filters: file type / date / uploader
- Sort `<select>`: newest/oldest/name/size
- View toggle buttons (grid/list) — moved out of MediaPageClient
- All values controlled via props; changes bubble up to parent handlers

### app/admin/media/MediaPageClient.tsx (rewritten)

Complete wiring layer:
- State: `q`, `debouncedQ`, `type`, `date`, `by`, `sort`, `viewMode`, `sidebarCollapsed`, `items`, `nextCursor`, `isLoading`, `isFetchingMore`, `selectedItem`
- Initializes from props (forwarded from SSR searchParams) for bookmarkable state
- 300ms debounce on `q` via `useEffect` + `setTimeout` cleanup
- `loadItems()` called via `useEffect` whenever `activeFolder/debouncedQ/type/date/by/sort` change
- URL sync: `router.replace` after debounce resolves (not on every keystroke)
- Infinite scroll: `IntersectionObserver` with `rootMargin: '200px'` on sentinel div at bottom
- Renders `<MediaGrid>` or `<MediaList>` based on `viewMode`; skeleton passed via `isLoading` prop
- Detail panel: `w-[380px]` when `selectedItem` is set, `w-0` otherwise (Plan 02-03 fills it)

### app/admin/media/page.tsx (updated)

Forwards `q`, `type`, `date`, `by`, `sort` search params to `MediaPageClient` for SSR-consistent initial state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing directive] Added 'use server' to actions.ts**
- **Found during:** Task 1
- **Issue:** actions.ts exported async functions callable as server actions but lacked the `'use server'` directive
- **Fix:** Added `'use server'` at top of file
- **Files modified:** app/admin/media/actions.ts

**2. [Rule 1 - Implementation adjustment] URL sync uses router.replace instead of router.push**
- **Found during:** Task 3 implementation
- **Issue:** Plan said "update URL params via router" — using `push` on every filter change pollutes browser history
- **Fix:** Used `router.replace` so filters are bookmarkable without creating a new history entry per filter change
- **Files modified:** app/admin/media/MediaPageClient.tsx

## Notes for Plan 02-03

- **MediaItem type:** Import from `./actions` (canonical) or `./mediaUtils` (re-export)
- **selectedItem state:** Lives in `MediaPageClient` as `selectedItem: MediaItem | null`. Plan 02-03 should either: (a) receive `selectedItem` as a prop from `MediaPageClient`, or (b) lift state into a context. Option (a) is simplest given the three-panel layout.
- **Detail panel slot:** Currently `w-[380px]` when `selectedItem` is set (empty white div). Plan 02-03 replaces that div with the actual panel content.
- **setSelectedItem:** Plan 02-03 needs access to deselect (e.g. close button). Pass `onClose={() => setSelectedItem(null)}` as a prop.

## Known Stubs

- Detail panel (w-[380px] white div): intentional placeholder — deferred to Plan 02-03 which will render file info, metadata editing, copy URL, and delete controls.

## Self-Check: PASSED
