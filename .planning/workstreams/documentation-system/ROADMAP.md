# Roadmap: Documentation System (v1.12)

## Overview

Build a comprehensive documentation system where Markdown files are the single source of truth, surfaced through an admin 3-column viewer, a role-filtered user help viewer, full-text search, and Mattea chatbot integration. Content comes first (Phase 1), then the admin viewer (Phase 2), user-facing help (Phase 3), search (Phase 4), chatbot doc injection (Phase 5), automation rules (Phase 6), and responsive polish (Phase 7).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Documentation Content** - Write all Markdown documentation files across 5 audiences with frontmatter and index
- [ ] **Phase 2: Admin Documentation Viewer** - 3-column doc viewer at /admin/docs with filtered nav, rendered content, and TOC
- [ ] **Phase 3: User-Facing Help Integration** - Role-filtered documentation viewer at /settings/help for non-admin users
- [ ] **Phase 4: Full-Text Search** - Client-side search with JSON index, Cmd+K modal, and role-scoped results
- [ ] **Phase 5: Chatbot Doc Integration** - Mattea answers questions using role-scoped documentation context
- [ ] **Phase 6: CLAUDE.md Automation Rules** - Automation rules ensuring docs stay current after every task
- [ ] **Phase 7: Navigation & Polish** - Mobile responsiveness, 404 handling, print CSS, and animations

## Phase Details

### Phase 1: Documentation Content
**Goal**: All platform documentation exists as well-structured Markdown files covering every feature for every audience
**Depends on**: Nothing (first phase)
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. Admin documentation covers all 15 admin features (user management, events, courses, credits, shop, API keys, chatbot, etc.) with accurate content verified against the codebase
  2. Moderator, teacher, and student docs each provide complete role-specific guides for every feature that role can access
  3. Developer docs cover architecture, database schema, API reference, and deployment with accurate technical detail
  4. Every doc file has valid frontmatter (title, audience, section, order) and a docs/README.md index lists all pages
**Plans**: TBD

### Phase 2: Admin Documentation Viewer
**Goal**: Admins can browse, filter, and read all documentation in a polished 3-column viewer at /admin/docs
**Depends on**: Phase 1
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, VIEW-06, VIEW-07, VIEW-08, VIEW-09
**Success Criteria** (what must be TRUE):
  1. Admin can navigate to /admin/docs from the admin sidebar and sees a landing page with section grid, audience badges, and page counts
  2. Selecting a doc page shows 3-column layout: filtered navigation tree (left), rendered Markdown content (center), auto-generated TOC with active heading highlighting (right)
  3. Admin can filter docs by audience (All/Admin/Moderator/Teacher/Student/Developer) and navigation tree updates accordingly
  4. Breadcrumb navigation shows current position and Previous/Next links allow sequential reading
  5. Markdown renders correctly with GFM support (tables, code blocks, task lists) styled with GOYA design tokens
**Plans**: TBD
**UI hint**: yes

### Phase 3: User-Facing Help Integration
**Goal**: Non-admin users see role-appropriate documentation in /settings/help without manual filtering
**Depends on**: Phase 2
**Requirements**: HELP-01, HELP-02, HELP-03, HELP-04
**Success Criteria** (what must be TRUE):
  1. Users see a "Help & Guides" section on /settings/help below existing support tickets
  2. Documentation content is automatically scoped to the user's role (student sees student docs, teacher sees teacher+student docs, moderator sees moderator+teacher+student docs)
  3. Non-admin users have no audience filter UI -- content is pre-filtered server-side based on their role
**Plans**: TBD
**UI hint**: yes

### Phase 4: Full-Text Search
**Goal**: Users can instantly search documentation with keyboard shortcut and see role-filtered results
**Depends on**: Phase 2
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. Running `npm run docs:index` generates a search-index.json file from all documentation Markdown files
  2. User can press Cmd+K (or Ctrl+K) to open a search modal, type at least 2 characters, and see matching results with title, audience badges, and highlighted excerpts
  3. Search results respect the current user's role scoping (same rules as HELP-03)
**Plans**: TBD
**UI hint**: yes

### Phase 5: Chatbot Doc Integration
**Goal**: Mattea uses documentation content to answer user questions, scoped to the user's role
**Depends on**: Phase 1
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04
**Success Criteria** (what must be TRUE):
  1. When a user asks Mattea a platform question, the chatbot response draws on documentation content relevant to that user's role
  2. Mattea's system prompt includes role-scoped doc context (using the same XML injection pattern as FAQ)
  3. Mattea declines to answer questions about features outside the user's role scope (e.g., a student asking about admin user management)
**Plans**: TBD

### Phase 6: CLAUDE.md Automation Rules
**Goal**: Documentation stays current automatically through enforced update rules
**Depends on**: Phase 1
**Requirements**: AUTO-01, AUTO-02
**Success Criteria** (what must be TRUE):
  1. CLAUDE.md contains a `## Documentation` section with mandatory rules for updating docs after feature changes
  2. The build process includes search index regeneration so the index is never stale after deployment
**Plans**: TBD

### Phase 7: Navigation & Polish
**Goal**: Documentation viewer works well on all devices and handles edge cases gracefully
**Depends on**: Phase 2, Phase 3
**Requirements**: POLSH-01, POLSH-02, POLSH-03, POLSH-04
**Success Criteria** (what must be TRUE):
  1. On mobile, the left sidebar collapses to a hamburger menu and the right TOC sidebar is hidden
  2. Navigating to a non-existent doc page shows a clear 404 placeholder instead of a blank screen or error
  3. Printing a doc page produces clean output with sidebars hidden and full-width content
  4. Sidebar collapse/expand transitions use smooth animations
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
(Phases 3, 4, 5 all depend on earlier phases but are independent of each other)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Documentation Content | 0/TBD | Not started | - |
| 2. Admin Documentation Viewer | 0/TBD | Not started | - |
| 3. User-Facing Help Integration | 0/TBD | Not started | - |
| 4. Full-Text Search | 0/TBD | Not started | - |
| 5. Chatbot Doc Integration | 0/TBD | Not started | - |
| 6. CLAUDE.md Automation Rules | 0/TBD | Not started | - |
| 7. Navigation & Polish | 0/TBD | Not started | - |
