# Phase 1: Documentation Content - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Write all 44 Markdown documentation files across 5 audiences (admin, moderator, teacher, student, developer) plus a README.md index. Each file must have accurate content based on codebase inspection, valid frontmatter (title, audience, section, order, last_updated), and a table of contents for files over ~300 words. Priority files require deep codebase inspection for accuracy.

</domain>

<decisions>
## Implementation Decisions

### Documentation Tone & Depth
- Friendly-professional tone — conversational but clear, "Click X to do Y" style
- Task-oriented detail level — describe what to do, not every UI element. Assume basic web literacy
- Reference exact UI labels in docs — "Click **Approve**" not "click the approval button"
- Target 300-800 words per file, longer for complex workflows (inbox, credits)

### Developer Documentation Approach
- Mid-level technical depth — assume TypeScript/Next.js competence, explain GOYA-specific patterns
- Database schema docs use table format with columns, types, and RLS notes (not raw SQL)
- API reference doc references API_DOCS.md — brief overview + "See API_DOCS.md for full reference"
- Architecture doc includes annotated folder tree diagram

### Content Organization & Frontmatter
- Frontmatter includes section and order fields for deterministic nav sorting
- Cross-reference related pages with "See also" links at bottom of each file
- README.md index organized by audience section
- No visible "Last updated" footer — frontmatter last_updated field is sufficient

### Claude's Discretion
- Exact H2/H3 structure within each doc file
- Which codebase details to verify for each priority file
- How to handle features still in development (media library workstream)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- API_DOCS.md exists at repo root — comprehensive REST API reference (49 endpoints)
- design-system/MASTER.md — brand tokens, component standards
- supabase/migrations/ — 69 migration files defining all tables
- .planning/PROJECT.md — validated requirements listing all features

### Established Patterns
- Admin panel: AdminShell.tsx with Settings group, 8 children
- Settings: SettingsShell.tsx with role-filtered nav items
- Chatbot: FAQ XML context injection in chat-service.ts
- Roles: student, teacher, wellness_practitioner, moderator, admin

### Integration Points
- docs/ directory exists with unrelated superpowers/ subfolder — new docs go alongside
- Frontmatter will be parsed by viewer in Phase 2

</code_context>

<specifics>
## Specific Ideas

Priority files requiring deep codebase inspection:
- admin/inbox.md — all 6 tabs, approval workflows, badge counts, status meanings
- admin/events.md — GOYA vs Member events, full status workflow, audit log, soft delete
- moderator/verification-guide.md — verify teachers, document checks, approve/reject
- moderator/event-review.md — approve/reject workflow, rejection reasons, post-rejection
- teacher/my-events.md — full submission workflow, all statuses, what user can do at each
- teacher/credits-hours.md — how credits work, CE vs Teaching Hours, manual submission
- developer/database-schema.md — all tables, relationships, RLS policies per role
- developer/architecture.md — folder structure, key patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
