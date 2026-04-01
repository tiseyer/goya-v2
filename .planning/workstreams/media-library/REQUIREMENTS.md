# Requirements: GOYA v2 — v1.11 Media Library

**Defined:** 2026-03-31
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.11 Requirements

### Database & Storage

- [ ] **DB-01**: media_items table exists with all specified columns (id, bucket, folder, file_name, file_path, file_url, file_type, file_size, width, height, title, alt_text, caption, uploaded_by, uploaded_by_role, created_at, updated_at)
- [ ] **DB-02**: media_folders table exists with columns (id, name, parent_id, bucket, sort_order, created_by, created_at)
- [ ] **DB-03**: RLS: admins and moderators can SELECT all media_items and INSERT/UPDATE media_folders
- [ ] **DB-04**: RLS: admins only can DELETE media_items and media_folders
- [ ] **DB-05**: RLS: members can SELECT own media_items (uploaded_by = auth.uid()) — read only
- [ ] **DB-06**: RLS: public has no access to media_items or media_folders
- [ ] **DB-07**: Supabase Storage buckets exist for avatars, event-images, school-logos, upgrade-certificates, chatbot-avatars (map existing)
- [ ] **DB-08**: Types regenerated via supabase gen types after migration

### Upload Instrumentation

- [ ] **INST-01**: Avatar upload (app/api/avatar/route.ts) writes to media_items after successful storage upload
- [ ] **INST-02**: Admin event image upload (app/admin/events/components/EventForm.tsx) writes to media_items
- [ ] **INST-03**: Member event image upload (app/settings/my-events/MyEventsClient.tsx) writes to media_items
- [ ] **INST-04**: Teacher certificate upload (app/upgrade/actions.ts) writes to media_items
- [ ] **INST-05**: School logo upload — onboarding (app/schools/create/onboarding/page.tsx) writes to media_items
- [ ] **INST-06**: School logo upload — settings (app/schools/[id]/settings/SchoolSettingsClient.tsx) writes to media_items
- [ ] **INST-07**: Chatbot avatar upload (app/admin/chatbot/chatbot-actions.ts) writes to media_items
- [ ] **INST-08**: Feed post media upload (lib/feed.ts) writes to media_items

### Admin Media Library

- [ ] **ADMIN-01**: "Media" link appears in admin sidebar between Users and Events
- [ ] **ADMIN-02**: Left sidebar folder tree showing All Media and buckets as top-level items
- [ ] **ADMIN-03**: Custom media_folders nested under buckets in folder tree
- [ ] **ADMIN-04**: Grid view with responsive thumbnail cards (4-6 columns)
- [ ] **ADMIN-05**: List view with table rows showing thumbnail/icon, name, type, size, date, uploaded by
- [ ] **ADMIN-06**: Toggle between grid and list view (persisted in localStorage)
- [ ] **ADMIN-07**: Debounced search bar (300ms) searching file_name and title
- [ ] **ADMIN-08**: Filters: file type (All/Images/PDFs/Videos), upload date (All/Today/This week/This month), uploaded by (All/GOYA team/Members)
- [ ] **ADMIN-09**: Sort options: newest first (default), oldest first, name A-Z, file size
- [ ] **ADMIN-10**: URL params reflect active folder, search, and filters (shareable/bookmarkable)
- [ ] **ADMIN-11**: Right detail panel slides in on item click with large preview or file icon
- [ ] **ADMIN-12**: Detail panel editable fields: title, alt_text, caption with save button
- [ ] **ADMIN-13**: Detail panel read-only info: file name, MIME, size (human readable), dimensions, upload date, uploaded by (name + role), file URL with copy button
- [ ] **ADMIN-14**: Delete button in detail panel (admin only, confirmation modal)
- [ ] **ADMIN-15**: Upload button (admin/mod) with drag-and-drop support
- [ ] **ADMIN-16**: Upload supports JPEG, PNG, WebP, GIF, PDF, MP4 up to 50MB
- [ ] **ADMIN-17**: Upload writes to Supabase Storage and inserts into media_items with MIME type and image dimensions
- [ ] **ADMIN-18**: Image thumbnails show actual preview; non-images show file-type icon
- [ ] **ADMIN-19**: Empty states with appropriate messaging per context

### Member Media

- [ ] **MEMBER-01**: "Media" page in user settings sidebar (teacher, wellness_practitioner, admin roles)
- [ ] **MEMBER-02**: Page is read-only — no upload button, no delete button
- [ ] **MEMBER-03**: Left folder list showing Avatars, Certificates, Uploads (no management controls)
- [ ] **MEMBER-04**: Grid/list toggle and search matching admin pattern, filtered to uploaded_by = current user
- [ ] **MEMBER-05**: Detail panel same as admin but no delete and no "Uploaded by" field
- [ ] **MEMBER-06**: Empty state: "No media files yet. Files you upload (like certificates and profile photos) will appear here."

### Folder Management

- [ ] **FOLD-01**: Create folder via modal with name and parent selector
- [ ] **FOLD-02**: Rename folder inline on double-click
- [ ] **FOLD-03**: Reorder folders via drag-and-drop (updates sort_order)
- [ ] **FOLD-04**: Delete folder (admin only) with confirmation and file-exist warning

### Search & Polish

- [ ] **POLISH-01**: Real-time search debounced 300ms with all filters combinable
- [ ] **POLISH-02**: Skeleton loading states for grid and list views
- [ ] **POLISH-03**: Smooth panel open/close animations
- [ ] **POLISH-04**: Mobile: sidebar collapses to dropdown, detail panel becomes bottom sheet

## Future Requirements

None — this milestone covers the full media library scope.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Member upload/delete in their media library | Members get read-only view; management is only via the original upload flows |
| Video transcoding/streaming | Too complex for v1.11; raw MP4 upload only |
| Image editing/cropping in media library | Use external tools; platform stores as-is |
| Bulk operations (multi-select delete/move) | Defer to future enhancement |
| CDN/image transforms | Use Supabase Storage defaults for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| DB-04 | Phase 1 | Pending |
| DB-05 | Phase 1 | Pending |
| DB-06 | Phase 1 | Pending |
| DB-07 | Phase 1 | Pending |
| DB-08 | Phase 1 | Pending |
| INST-01 | Phase 1 | Pending |
| INST-02 | Phase 1 | Pending |
| INST-03 | Phase 1 | Pending |
| INST-04 | Phase 1 | Pending |
| INST-05 | Phase 1 | Pending |
| INST-06 | Phase 1 | Pending |
| INST-07 | Phase 1 | Pending |
| INST-08 | Phase 1 | Pending |
| ADMIN-01 | Phase 2 | Pending |
| ADMIN-02 | Phase 2 | Pending |
| ADMIN-03 | Phase 2 | Pending |
| ADMIN-04 | Phase 2 | Pending |
| ADMIN-05 | Phase 2 | Pending |
| ADMIN-06 | Phase 2 | Pending |
| ADMIN-07 | Phase 2 | Pending |
| ADMIN-08 | Phase 2 | Pending |
| ADMIN-09 | Phase 2 | Pending |
| ADMIN-10 | Phase 2 | Pending |
| ADMIN-11 | Phase 2 | Pending |
| ADMIN-12 | Phase 2 | Pending |
| ADMIN-13 | Phase 2 | Pending |
| ADMIN-14 | Phase 2 | Pending |
| ADMIN-15 | Phase 2 | Pending |
| ADMIN-16 | Phase 2 | Pending |
| ADMIN-17 | Phase 2 | Pending |
| ADMIN-18 | Phase 2 | Pending |
| ADMIN-19 | Phase 2 | Pending |
| MEMBER-01 | Phase 3 | Pending |
| MEMBER-02 | Phase 3 | Pending |
| MEMBER-03 | Phase 3 | Pending |
| MEMBER-04 | Phase 3 | Pending |
| MEMBER-05 | Phase 3 | Pending |
| MEMBER-06 | Phase 3 | Pending |
| FOLD-01 | Phase 4 | Pending |
| FOLD-02 | Phase 4 | Pending |
| FOLD-03 | Phase 4 | Pending |
| FOLD-04 | Phase 4 | Pending |
| POLISH-01 | Phase 5 | Pending |
| POLISH-02 | Phase 5 | Pending |
| POLISH-03 | Phase 5 | Pending |
| POLISH-04 | Phase 5 | Pending |

**Coverage:**
- v1.11 requirements: 45 total
- Mapped to phases: 45
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
