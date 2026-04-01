# Requirements: GOYA v2 — Documentation System

**Defined:** 2026-03-31
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.12 Requirements

Requirements for the Documentation System milestone. Each maps to roadmap phases.

### Documentation Content

- [ ] **DOCS-01**: All admin documentation files (15 files) with frontmatter, TOC, and accurate content based on codebase inspection
- [ ] **DOCS-02**: All moderator documentation files (6 files) with role-specific workflow guides
- [ ] **DOCS-03**: All teacher documentation files (7 files) with user-facing how-to guides
- [ ] **DOCS-04**: All student documentation files (6 files) with getting-started and feature guides
- [ ] **DOCS-05**: All developer documentation files (10 files) with architecture, schema, API reference
- [ ] **DOCS-06**: docs/README.md index file listing all documentation pages

### Admin Documentation Viewer

- [ ] **VIEW-01**: Admin sidebar "Documentation" link under Settings group (book icon)
- [ ] **VIEW-02**: 3-column layout at `/admin/docs/[...slug]` — left nav (250px), fluid content, right TOC (220px)
- [ ] **VIEW-03**: Audience filter tabs (All/Admin/Moderator/Teacher/Student/Developer) in left sidebar
- [ ] **VIEW-04**: Collapsible navigation tree filtered by selected audience, active page highlighted
- [ ] **VIEW-05**: Markdown rendered with react-markdown + remark-gfm, styled with GOYA design system
- [ ] **VIEW-06**: Breadcrumb navigation (Documentation > Section > Page)
- [ ] **VIEW-07**: Previous/Next navigation at bottom of content
- [ ] **VIEW-08**: Right sidebar auto-generated from H2/H3 headings with IntersectionObserver active highlighting
- [ ] **VIEW-09**: Landing page at `/admin/docs` with section grid, descriptions, audience badges, page counts

### User Help Viewer

- [ ] **HELP-01**: "Help & Guides" section in `/settings/help` below existing support tickets
- [ ] **HELP-02**: Same 3-column doc viewer with role-based content filtering (server-side)
- [ ] **HELP-03**: Role mapping: student→student, teacher/WP/school→teacher+student, moderator→moderator+teacher+student
- [ ] **HELP-04**: No audience filter UI for non-admins — content automatically scoped to role

### Search

- [ ] **SRCH-01**: Search index generator script (`npm run docs:index`) producing `docs/search-index.json`
- [ ] **SRCH-02**: Client-side search with debounced input (200ms, min 2 chars), results with title, badges, highlighted excerpt
- [ ] **SRCH-03**: Cmd+K / Ctrl+K keyboard shortcut to open search modal
- [ ] **SRCH-04**: Search results filtered by current user's role (same scoping as HELP-03)

### Chatbot Integration

- [ ] **CHAT-01**: `lib/docs/context.ts` utility returning role-scoped doc content as concatenated string
- [ ] **CHAT-02**: Role lookup in chatbot API route (query profiles table for user_type)
- [ ] **CHAT-03**: Doc context injection into Mattea system prompt with role boundary instructions
- [ ] **CHAT-04**: Cross-role doc access blocked — Mattea declines questions outside user's role scope

### Automation & Polish

- [ ] **AUTO-01**: CLAUDE.md `## Documentation` section with mandatory update rules
- [ ] **AUTO-02**: Search index regeneration in build process
- [ ] **POLSH-01**: Mobile responsive — left sidebar collapses to hamburger, right sidebar hidden
- [ ] **POLSH-02**: 404/missing doc placeholder page
- [ ] **POLSH-03**: Print-friendly CSS (hide sidebars, full-width content)
- [ ] **POLSH-04**: Smooth sidebar collapse/expand animations

## Future Requirements

### Documentation Content Expansion

- **DOCS-F01**: Wellness practitioner-specific documentation (separate from teacher)
- **DOCS-F02**: School admin documentation
- **DOCS-F03**: Video tutorials embedded in documentation pages
- **DOCS-F04**: Changelog/release notes documentation section

### Advanced Features

- **ADV-F01**: In-app documentation editing for admins
- **ADV-F02**: Documentation versioning tied to milestones
- **ADV-F03**: User feedback on doc pages (helpful/not helpful)
- **ADV-F04**: Documentation analytics (most viewed pages, search queries)

## Out of Scope

| Feature | Reason |
|---------|--------|
| In-app doc editing | Read-only viewer for v1.12 — editing adds complexity |
| Doc versioning | Single-version docs sufficient initially |
| Multilingual docs | English-only for v1.12 |
| Supabase doc storage | Markdown files on filesystem are the source of truth |
| User doc feedback | Defer to future — focus on content accuracy first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DOCS-01 | Phase 1 | Pending |
| DOCS-02 | Phase 1 | Pending |
| DOCS-03 | Phase 1 | Pending |
| DOCS-04 | Phase 1 | Pending |
| DOCS-05 | Phase 1 | Pending |
| DOCS-06 | Phase 1 | Pending |
| VIEW-01 | Phase 2 | Pending |
| VIEW-02 | Phase 2 | Pending |
| VIEW-03 | Phase 2 | Pending |
| VIEW-04 | Phase 2 | Pending |
| VIEW-05 | Phase 2 | Pending |
| VIEW-06 | Phase 2 | Pending |
| VIEW-07 | Phase 2 | Pending |
| VIEW-08 | Phase 2 | Pending |
| VIEW-09 | Phase 2 | Pending |
| HELP-01 | Phase 3 | Pending |
| HELP-02 | Phase 3 | Pending |
| HELP-03 | Phase 3 | Pending |
| HELP-04 | Phase 3 | Pending |
| SRCH-01 | Phase 4 | Pending |
| SRCH-02 | Phase 4 | Pending |
| SRCH-03 | Phase 4 | Pending |
| SRCH-04 | Phase 4 | Pending |
| CHAT-01 | Phase 5 | Pending |
| CHAT-02 | Phase 5 | Pending |
| CHAT-03 | Phase 5 | Pending |
| CHAT-04 | Phase 5 | Pending |
| AUTO-01 | Phase 6 | Pending |
| AUTO-02 | Phase 6 | Pending |
| POLSH-01 | Phase 7 | Pending |
| POLSH-02 | Phase 7 | Pending |
| POLSH-03 | Phase 7 | Pending |
| POLSH-04 | Phase 7 | Pending |

**Coverage:**
- v1.12 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
