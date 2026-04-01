# Phase 41: ThemeProvider Infrastructure - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Color settings are stored in site_settings and injected as CSS variables globally so any page can consume them via CSS custom properties.

Requirements: INFRA-01, INFRA-02, BRAND-05, ROLE-03, MAINT-02

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance:
- site_settings table already uses single-row upsert pattern (established in v1.8 for chatbot_config)
- Store colors as JSON objects: `brand_colors`, `role_colors` as keys, `maintenance_indicator_color` as a simple string
- ThemeProvider should be a server component that fetches from site_settings and renders a `<style>` tag or sets CSS vars on html
- CSS variable names: --color-primary, --color-accent, --color-bg, --color-surface, --color-border, --color-foreground, --color-student, --color-teacher, --color-wellness, --color-school, --color-moderator, --color-admin, --color-maintenance

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getSupabaseService()` for server-side DB reads
- `site_settings` table with single-row upsert pattern
- `globals.css` has current CSS variable definitions to reference

### Established Patterns
- Server components for data fetching, client components only when interactivity needed
- layout.tsx wraps the app — ThemeProvider goes here

### Integration Points
- app/layout.tsx — wrap children with ThemeProvider
- globals.css — default values that ThemeProvider overrides

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
