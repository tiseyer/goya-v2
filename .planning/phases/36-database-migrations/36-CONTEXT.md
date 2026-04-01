# Phase 36: Database Migrations - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The database fully supports the course system redesign — course_categories and lessons tables exist, courses schema updated, RLS policies enforced, and TypeScript types pass.

Requirements: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from user specs:
- course_categories: id uuid PK, name text NOT NULL, slug text NOT NULL UNIQUE, description text, color text NOT NULL DEFAULT '#345c83', parent_id uuid self-ref, sort_order integer DEFAULT 0, created_at timestamptz
- Seed: Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research
- lessons: id uuid PK, course_id FK CASCADE, title text NOT NULL, type CHECK (video/audio/text), sort_order integer DEFAULT 0, short_description text, description text, video_platform CHECK (vimeo/youtube), video_url text, audio_url text, featured_image_url text, duration_minutes integer, created_at/updated_at timestamptz
- courses: add category_id FK, remove category text + vimeo_url after backfill
- RLS: course_categories (admin/mod CRUD, public SELECT), lessons (admin/mod CRUD, members SELECT published, creator SELECT own)
- After migration: regenerate types, tsc --noEmit must pass

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- event_categories migration (20260331100714_event_categories.sql) — pattern reference for course_categories
- Existing courses table with category string, vimeo_url, course_type columns
- Standard RLS pattern: admin/mod via auth.jwt()->'user_role', public via anon

### Established Patterns
- Migration files at supabase/migrations/ with timestamp prefix
- Types regenerated via: npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts
- Supabase Management API with SUPABASE_ACCESS_TOKEN for direct SQL when CLI history is out of sync

### Integration Points
- types/supabase.ts — must be regenerated after all schema changes
- All files importing from types/supabase.ts may need updates after column changes

</code_context>

<specifics>
## Specific Ideas

- Research flagged: category FK backfill must be a multi-step process (add column → seed categories → UPDATE courses → verify → drop old column)
- Research flagged: consider duration_minutes migration for existing freeform duration strings
- Research flagged: float numeric sort_order for lessons enables single-row drag reorder

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
