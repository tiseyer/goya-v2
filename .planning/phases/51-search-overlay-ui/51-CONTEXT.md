# Phase 51: Search Overlay UI - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the GlobalSearch overlay component — a macOS Spotlight-style search UI triggered from the nav header. Desktop: centered modal with backdrop. Mobile: full-screen overlay with input at bottom. Includes category filter pills, keyboard navigation, grouped results with contextual actions, and auto-focus on open.

</domain>

<decisions>
## Implementation Decisions

### Component Architecture
- Use React Portal (`createPortal`) for overlay rendering — matches FlowPlayerModal pattern, escapes stacking context issues
- Use Framer Motion for enter/exit animations — already in deps, consistent with FlowPlayerModal
- Use React Context (SearchContext) for search state — matches CartContext/ConnectionsContext pattern, enables Cmd+K trigger from anywhere
- Adapt structure from existing SearchModal.tsx (docs search) — it already has debounce, keyboard nav, scoring patterns to lift

### Visual Design Details
- Backdrop: `bg-black/40 backdrop-blur-sm` (per user spec)
- Overlay animation: scale + fade (0.95→1.0, opacity 0→1, 200ms) — matches FlowPlayerModal
- Result row avatars: 32px (`w-8 h-8`) — compact, matches header avatar size
- Category group headers: small uppercase label (`text-[10px] font-medium text-slate-400 uppercase tracking-wide`) — changed from semibold to medium per typography constraint (max 2 weights)

### Mobile Layout & Interaction
- Mobile input anchoring: CSS `flex-col-reverse` — input visually at bottom, results scroll above naturally
- Mobile overlay background: `bg-white` — project uses light theme primarily
- Mobile close button: top-right, absolute positioned
- Keyboard hint bar: hidden on mobile — touch users don't need keyboard hints

### Claude's Discretion
- Exact z-index value for overlay (at least z-50, match FlowPlayerModal's z-[9999] if needed)
- Internal component decomposition (single file vs split into sub-components)
- Exact skeleton pill widths/count for loading state

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/components/docs/SearchModal.tsx` — full search modal with debounce, keyboard nav, scoring (adapt patterns)
- `app/components/flow-player/FlowPlayerModal.tsx` — Portal + Framer Motion overlay pattern
- `app/components/ui/Button.tsx` — variant-based button component
- `app/components/ui/Badge.tsx` — role-colored badges
- `lucide-react` — icon library (Search, X, MapPin, MessageCircle, ArrowRight, etc.)
- `framer-motion` v12.38.0 — animation library

### Established Patterns
- React Context for shared UI state (CartContext, ConnectionsContext, ImpersonationContext)
- createPortal for overlays (FlowPlayerModal)
- Framer Motion AnimatePresence for enter/exit
- Tailwind CSS 4 with CSS variables for branding
- `--goya-primary` (#4E87A0), primary dark `#345c83`

### Integration Points
- SearchWidget in Header.tsx (lines 77-148) — currently placeholder "Search is coming soon"
- Header renders SearchWidget in the right-side area for logged-in users
- ClientProviders wraps app with context providers (ThemeProvider, ImpersonationProvider, etc.)

</code_context>

<specifics>
## Specific Ideas

- User spec: highlight color `#345c83` for best/top result
- User spec: category pills — All / Members / Events / Courses / Pages
- User spec: result rows — icon/avatar + title + subtitle
- User spec: member rows — message icon + map icon (if full address)
- User spec: overlay max-w-2xl, white bg, rounded-xl, shadow-2xl
- User spec: keyboard hints footer — "up/down navigate, Enter to open, Esc to close"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
