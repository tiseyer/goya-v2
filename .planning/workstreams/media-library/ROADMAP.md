---
milestone: v1.11
milestone_name: Media Library
workstream: media-library
total_phases: 5
total_requirements: 45
created: 2026-03-31
---

# Roadmap: v1.11 Media Library

## Phases

- [x] **Phase 1: Database & Storage Foundation** — Schema, RLS, storage buckets, and instrumentation of all existing upload flows
- [x] **Phase 2: Admin Media Library Page** — Three-panel admin UI with upload, browse, filter, search, and detail editing
- [x] **Phase 3: Member Media Library in Settings** — Read-only member view of own uploads in Settings sidebar
- [x] **Phase 4: Folder Management** — Admin/mod folder CRUD with create, rename, reorder, and delete
- [x] **Phase 5: Search & Polish** — Combined search/filters, skeleton states, animations, and mobile responsiveness

---

## Phase Details

### Phase 1: Database & Storage Foundation
**Goal:** Every file uploaded on the platform is tracked in media_items, with correct permissions enforced at the database level
**Depends on:** Nothing (first phase)
**Requirements:** DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08
**Success Criteria** (what must be TRUE):
  1. An avatar upload inserts a row into media_items and that row is queryable by an admin
  2. Uploading an event image, school logo, certificate, chatbot avatar, and feed post each produce distinct media_items rows tied to the correct uploader
  3. A member querying media_items sees only their own rows; a public (unauthenticated) query returns zero rows
  4. Only admins can delete media_items or media_folders rows; moderators can read all but cannot delete
  5. Running supabase gen types produces updated TypeScript types covering media_items and media_folders
**Plans:** TBD

### Phase 2: Admin Media Library Page
**Goal:** Admins and moderators can browse, search, filter, upload, and annotate all platform media from a single page
**Depends on:** Phase 1
**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14, ADMIN-15, ADMIN-16, ADMIN-17, ADMIN-18, ADMIN-19
**Success Criteria** (what must be TRUE):
  1. Admin navigates to the Media page from the sidebar and sees all uploaded files organised by bucket/folder in a grid or list view they can toggle
  2. Admin types in the search bar and results filter within 300ms; applying file type, date, and uploader filters narrows the grid correctly
  3. Admin clicks a file and sees a detail panel with preview (image) or file-type icon, editable title/alt/caption, and read-only metadata including a copyable URL
  4. Admin uploads a new file via drag-and-drop or file picker and the file immediately appears in the grid with correct thumbnail and metadata
  5. Admin deletes a file from the detail panel after confirming the modal, and the file is removed from the grid
**Plans:** TBD
**UI hint**: yes

### Phase 3: Member Media Library in Settings
**Goal:** Members with the teacher or wellness_practitioner role can see all files they have uploaded to the platform from their Settings
**Depends on:** Phase 1
**Requirements:** MEMBER-01, MEMBER-02, MEMBER-03, MEMBER-04, MEMBER-05, MEMBER-06
**Success Criteria** (what must be TRUE):
  1. A teacher navigates to Settings and sees a "Media" link in the sidebar; a student does not see it
  2. The member's Media page shows only their own files — no upload button and no delete button are visible
  3. Member can switch between grid and list view and search within their own files using the same pattern as the admin library
  4. Member clicks a file and sees the detail panel with preview and metadata but without the delete action or the "Uploaded by" field
**Plans:** TBD
**UI hint**: yes

### Phase 4: Folder Management
**Goal:** Admins and moderators can organise media into a custom folder hierarchy within each bucket
**Depends on:** Phase 2
**Requirements:** FOLD-01, FOLD-02, FOLD-03, FOLD-04
**Success Criteria** (what must be TRUE):
  1. Admin creates a new folder via a modal, selecting a name and optional parent, and the folder appears immediately in the sidebar tree
  2. Admin double-clicks a folder name and renames it inline without a page reload
  3. Admin drags folders to reorder them within a bucket and the new order persists after page refresh
  4. Admin deletes a folder from a confirmation modal that warns if the folder contains files; after deletion the folder is gone from the tree
**Plans:** TBD
**UI hint**: yes

### Phase 5: Search & Polish
**Goal:** The media library is fast, visually polished, and fully usable on mobile
**Depends on:** Phase 2, Phase 3, Phase 4
**Requirements:** POLISH-01, POLISH-02, POLISH-03, POLISH-04
**Success Criteria** (what must be TRUE):
  1. Combining search text with file type, date, and uploader filters simultaneously returns the correct subset without resetting other active filters
  2. While files are loading, the grid and list display skeleton placeholder cards rather than blank space or spinners
  3. Opening and closing the detail panel animates smoothly without layout jump
  4. On a mobile viewport the folder sidebar collapses to a dropdown and the detail panel opens as a bottom sheet covering the grid
**Plans:** TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database & Storage Foundation | 1/1 | ✓ Complete | 2026-03-31 |
| 2. Admin Media Library Page | 3/3 | ✓ Complete | 2026-03-31 |
| 3. Member Media Library in Settings | 1/1 | ✓ Complete | 2026-03-31 |
| 4. Folder Management | 1/1 | ✓ Complete | 2026-03-31 |
| 5. Search & Polish | 1/1 | ✓ Complete | 2026-03-31 |

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| DB-01 | Phase 1 |
| DB-02 | Phase 1 |
| DB-03 | Phase 1 |
| DB-04 | Phase 1 |
| DB-05 | Phase 1 |
| DB-06 | Phase 1 |
| DB-07 | Phase 1 |
| DB-08 | Phase 1 |
| INST-01 | Phase 1 |
| INST-02 | Phase 1 |
| INST-03 | Phase 1 |
| INST-04 | Phase 1 |
| INST-05 | Phase 1 |
| INST-06 | Phase 1 |
| INST-07 | Phase 1 |
| INST-08 | Phase 1 |
| ADMIN-01 | Phase 2 |
| ADMIN-02 | Phase 2 |
| ADMIN-03 | Phase 2 |
| ADMIN-04 | Phase 2 |
| ADMIN-05 | Phase 2 |
| ADMIN-06 | Phase 2 |
| ADMIN-07 | Phase 2 |
| ADMIN-08 | Phase 2 |
| ADMIN-09 | Phase 2 |
| ADMIN-10 | Phase 2 |
| ADMIN-11 | Phase 2 |
| ADMIN-12 | Phase 2 |
| ADMIN-13 | Phase 2 |
| ADMIN-14 | Phase 2 |
| ADMIN-15 | Phase 2 |
| ADMIN-16 | Phase 2 |
| ADMIN-17 | Phase 2 |
| ADMIN-18 | Phase 2 |
| ADMIN-19 | Phase 2 |
| MEMBER-01 | Phase 3 |
| MEMBER-02 | Phase 3 |
| MEMBER-03 | Phase 3 |
| MEMBER-04 | Phase 3 |
| MEMBER-05 | Phase 3 |
| MEMBER-06 | Phase 3 |
| FOLD-01 | Phase 4 |
| FOLD-02 | Phase 4 |
| FOLD-03 | Phase 4 |
| FOLD-04 | Phase 4 |
| POLISH-01 | Phase 5 |
| POLISH-02 | Phase 5 |
| POLISH-03 | Phase 5 |
| POLISH-04 | Phase 5 |

**Total mapped: 45/45 — coverage 100%**

---
*Created: 2026-03-31*
