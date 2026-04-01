# Phase 5: Flow Player UI - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Users see the correct flow on authenticated pages, rendered in the right display type with full navigation and persistence. All 5 display types (modal, fullscreen, top banner, bottom banner, notification), all element renderers with Typeform-style choices, progress bar, back/next navigation, required field validation, and session persistence via flow_responses.

</domain>

<decisions>
## Implementation Decisions

### Display Types & Animation
- motion (AnimatePresence) for display type transitions — handles exit animations CSS can't do
- Non-dismissible modal: subtle shake animation on backdrop click
- Notification: top-right, no auto-dismiss — stays until user interacts or completes
- Banners: 48px fixed height, single line text + CTA button

### Element Renderers & Player State
- Choice elements: full-width pill cards with teal border + checkmark on select (Typeform-inspired)
- Image upload: click to browse + drag-drop zone with preview after upload
- Player state: React useState + useEffect for polling — simple, no store needed
- Global mount: in ClientProviders wrapper (existing global client provider)

### Claude's Discretion
- Exact animation timing and easing curves
- Mobile responsive breakpoints for player
- Loading skeleton design while fetching active flow
- Error state design for failed API calls

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- app/components/ClientProviders.tsx — global client provider, mount point for FlowPlayer
- lib/flows/types.ts — ActiveFlowResponse, FlowStep, FlowElement types
- API routes: /api/flows/active, /api/flows/[id]/respond, /api/flows/[id]/complete
- Existing form components in app/components/ui/ for input styling reference

### Established Patterns
- Client components use 'use client' directive
- Dynamic imports with ssr: false for client-only components (ChatWidget pattern)
- Fetch to API routes for data operations
- Design tokens from globals.css (teal primary, dark/light mode)

### Integration Points
- ClientProviders.tsx — add FlowPlayer component
- /api/flows/active — fetch active flow on mount
- /api/flows/[id]/respond — submit step responses
- /api/flows/[id]/complete — mark flow complete

</code_context>

<specifics>
## Specific Ideas

From user spec:
- Progress bar: teal, smooth transition between steps
- All choice elements: pill/card style (Typeform-inspired), NOT native radio/checkbox
- Fullscreen overlay: covers entire viewport
- macOS-style notification: slides in from right, GOYA icon + title + body + action button
- Dismissible modal: X button top right, clicking backdrop closes
- Non-dismissible: no X, clicking backdrop does nothing (shake animation)
- Persistence: save progress on every step completion, resume from last_step_id on reload

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
