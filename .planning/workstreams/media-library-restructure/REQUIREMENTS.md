# Requirements: Media Library Restructure

**Defined:** 2026-04-01
**Core Value:** Media files organized by purpose with intuitive bucket-based navigation.

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Schema

- [ ] **SCHEMA-01**: media_folders table has `bucket` column (text, default 'media')
- [ ] **SCHEMA-02**: media_folders table has `is_system` column (boolean, default false)
- [ ] **SCHEMA-03**: Supabase TypeScript types regenerated with new columns

### Sidebar UI

- [ ] **SIDE-01**: Sidebar shows 3 top-level bucket sections: All Media (Image icon), Certificates (Award icon), Avatars (User icon)
- [ ] **SIDE-02**: Clicking All Media selects it AND toggles collapsible list of user-created folders (bucket='media', is_system=false)
- [ ] **SIDE-03**: Clicking Certificates selects it AND toggles 4 system subfolders
- [ ] **SIDE-04**: Clicking Avatars selects it (no subfolders)
- [ ] **SIDE-05**: Add folder button only appears when All Media is active/expanded
- [ ] **SIDE-06**: Active state highlighting on selected bucket/folder matches existing style
- [ ] **SIDE-07**: Subfolder selection keeps parent section expanded and active

### Query Logic

- [ ] **QUERY-01**: All Media selected (no subfolder) → query media_items where bucket='media'
- [ ] **QUERY-02**: All Media subfolder selected → filter by folder_id
- [ ] **QUERY-03**: Certificates selected → query media_items where bucket='certificates'
- [ ] **QUERY-04**: Certificate subfolder selected → filter by folder_id
- [ ] **QUERY-05**: Avatars selected → query media_items where bucket='avatars'

## Out of Scope

| Feature | Reason |
|---------|--------|
| Drag-and-drop between buckets | Files belong to fixed buckets based on upload context |
| Member-facing media page changes | Admin sidebar restructure only |
| New upload flows | Existing upload instrumentation unchanged |
| Bucket CRUD | Buckets are hardcoded (media, certificates, avatars) |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCHEMA-01 | Phase 1 | Pending |
| SCHEMA-02 | Phase 1 | Pending |
| SCHEMA-03 | Phase 1 | Pending |
| SIDE-01 | Phase 2 | Pending |
| SIDE-02 | Phase 2 | Pending |
| SIDE-03 | Phase 2 | Pending |
| SIDE-04 | Phase 2 | Pending |
| SIDE-05 | Phase 2 | Pending |
| SIDE-06 | Phase 2 | Pending |
| SIDE-07 | Phase 2 | Pending |
| QUERY-01 | Phase 2 | Pending |
| QUERY-02 | Phase 2 | Pending |
| QUERY-03 | Phase 2 | Pending |
| QUERY-04 | Phase 2 | Pending |
| QUERY-05 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after initial definition*
