# Phase 3: Admin Flow Builder UI - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can create, configure, and preview any flow entirely from the admin panel without writing code. New sidebar item "Flows" in AdminShell. Flow list page with tabs, drag-sort priority, CRUD actions. Three-panel flow editor with step sidebar, element canvas, and settings panel. All 9 element types configurable. Branch configuration for single_choice. Conditions builder. Preview mode.

</domain>

<decisions>
## Implementation Decisions

### Editor Layout & Interaction
- Auto-save with 2-second debounce — Typeform/Formsort standard, no "forgot to save" risk
- Step list sidebar: 280px fixed width, matching AdminShell sidebar pattern
- Element type picker: popover grid (3 columns) for quick scan and one-click add
- Navigate-away warning via browser beforeunload when unsaved changes exist

### Conditions & Settings UX
- Condition builder inline in the right sidebar — no modal context switch
- Flow settings in a collapsible panel at top of editor — saves vertical space when editing steps
- Preview mode as in-editor modal overlay with "PREVIEW MODE" watermark — stays in context

### Visual Design & Components
- Flow cards on list page: compact row with status badge, type icon, trigger, conditions chips — like existing admin tables, higher density
- Drag handle: 6-dot grip icon (⠿) — standard pattern, solves dnd-kit touch conflict per research (scoped touch-action: none on handle only)
- Empty states: text-only with CTA button — matches existing GOYA admin empty states
- Full dark mode support using existing GOYA design tokens (bg-background, text-foreground, border-border)

### Claude's Discretion
- Specific component decomposition within the three-panel layout
- State management approach (zustand store shape for editor state)
- Animation details for drag-drop interactions
- Exact breakpoints for responsive behavior

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- AdminShell sidebar pattern (app/admin/layout.tsx) — add "Flows" nav item
- Existing admin page patterns (e.g., chatbot config with tabs)
- @dnd-kit/core + @dnd-kit/sortable already installed
- Lucide React icons already in use

### Established Patterns
- Admin pages use createSupabaseServerClient() for server-side data fetching
- Client components use 'use client' with fetch() to API routes
- Tabs pattern used in chatbot config and API keys pages
- Modal pattern used throughout admin (e.g., coupon create, order detail)

### Integration Points
- AdminShell sidebar: add Flows link between Chatbot and API Keys
- API routes at /api/admin/flows/ (created in Phase 2)
- lib/flows/types.ts for TypeScript interfaces

</code_context>

<specifics>
## Specific Ideas

From user spec:
- Three-panel layout: left sidebar (step list), center (step canvas), right (settings/branch config)
- 9 element types: info_text, short_text, long_text, single_choice, multi_choice, dropdown, image_upload, image, video
- Profile field mapping dropdown with all mappable profile columns
- Conditions: role, onboarding_complete, has_profile_picture, subscription_status, birthday, flow completion — shown as removable chips with AND logic
- Step actions: save_to_profile, send_email, kit_tag, stripe_checkout, redirect, trigger_flow, success_popup, mark_complete

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
