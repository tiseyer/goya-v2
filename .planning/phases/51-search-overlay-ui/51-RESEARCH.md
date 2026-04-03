# Phase 51: Search Overlay UI - Research

**Researched:** 2026-04-03
**Domain:** React overlay UI, keyboard navigation, Framer Motion, SearchContext
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Component Architecture**
- Use React Portal (`createPortal`) for overlay rendering — matches FlowPlayerModal pattern, escapes stacking context issues
- Use Framer Motion for enter/exit animations — already in deps, consistent with FlowPlayerModal
- Use React Context (SearchContext) for search state — matches CartContext/ConnectionsContext pattern, enables Cmd+K trigger from anywhere
- Adapt structure from existing SearchModal.tsx (docs search) — it already has debounce, keyboard nav, scoring patterns to lift

**Visual Design Details**
- Backdrop: `bg-black/40 backdrop-blur-sm` (per user spec)
- Overlay animation: scale + fade (0.95→1.0, opacity 0→1, 200ms) — matches FlowPlayerModal
- Result row avatars: 32px (`w-8 h-8`) — compact, matches header avatar size
- Category group headers: small uppercase label (`text-[10px] font-medium text-slate-400 uppercase tracking-wide`) — changed from semibold to medium per typography constraint (max 2 weights)

**Mobile Layout & Interaction**
- Mobile input anchoring: CSS `flex-col-reverse` — input visually at bottom, results scroll above naturally
- Mobile overlay background: `bg-white` — project uses light theme primarily
- Mobile close button: top-right, absolute positioned
- Keyboard hint bar: hidden on mobile — touch users don't need keyboard hints

### Claude's Discretion
- Exact z-index value for overlay (at least z-50, match FlowPlayerModal's z-[9999] if needed)
- Internal component decomposition (single file vs split into sub-components)
- Exact skeleton pill widths/count for loading state

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | User can open a centered search overlay by clicking the search icon in the nav header | SearchContext.open() called from Header.tsx SearchWidget; Portal renders centered modal |
| SRCH-02 | User can close the overlay via Esc key, X button, or clicking outside the backdrop | keydown listener for Escape + backdrop onClick + X button all call SearchContext.close() |
| SRCH-03 | User sees category filter pills (All / Members / Events / Courses / Pages) that toggle search scope | SearchFilterPills component with activeCategory state, filters mock results array |
| SRCH-04 | User can navigate results with arrow keys and open highlighted result with Enter | handleKeyDown in overlay: ArrowDown/Up increments selectedIdx, Enter calls router.push + close |
| SRCH-05 | User sees results grouped by category with best match highlighted at top | groupResultsByCategory() renders MEMBERS → EVENTS → COURSES → PAGES sections; first result gets border-l-2 border-primary |
| SRCH-06 | User sees contextual action icons on result rows (message icon for members, map/directions icon for members with full address) | SearchResultRow variant="member" renders MessageCircle always + MapPin when has_full_address |
| SRCH-07 | User on mobile sees a full-screen overlay with input at bottom and horizontally scrollable filter pills | flex-col-reverse layout, overflow-x-auto pills, full-screen fixed inset-0 at < 640px |
| SRCH-08 | Opening the overlay auto-focuses the search input, ready to type immediately | useEffect on isOpen watches for true, then setTimeout(() => inputRef.current?.focus(), 50) |
</phase_requirements>

---

## Summary

Phase 51 builds the GlobalSearch overlay as a pure UI component with mock data — no API calls. The architectural foundation is already settled in CONTEXT.md: React Portal for overlay rendering (matching the FlowPlayerModal pattern), Framer Motion AnimatePresence for 200ms enter/exit, and a new SearchContext mounted in ClientProviders to hold open/close state app-wide.

The codebase has two perfect reference implementations. `app/components/docs/SearchModal.tsx` provides the exact debounce pattern (useRef + setTimeout 200ms), keyboard navigation (ArrowDown/Up/Enter/Escape via onKeyDown), auto-focus (useEffect watching isOpen, setTimeout 50ms), result scoring, and footer keyboard hints. `app/components/flow-player/FlowPlayerModal.tsx` provides the Portal + AnimatePresence + motion.div scale/fade pattern with backdrop handling.

The main implementation tasks are: (1) creating SearchContext in the pattern of CartContext/ConnectionsContext, (2) building the overlay component by compositing the two reference patterns above, (3) wiring mock SearchResult data with grouping by category and the "best match" highlight, (4) implementing the mobile `flex-col-reverse` layout, and (5) replacing the stub SearchWidget in Header.tsx with a button that calls `SearchContext.open()`.

**Primary recommendation:** Copy the Portal + AnimatePresence shell from FlowPlayerModal.tsx and the keyboard/debounce/focus internals from SearchModal.tsx — this phase is primarily assembly, not invention.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| framer-motion | ^12.38.0 | Overlay enter/exit animation (AnimatePresence + motion.div) | Already in project deps; used by FlowPlayerModal |
| react (createPortal) | 19.2.3 | Escape stacking context for overlay | Locked decision; matches FlowPlayerModal pattern |
| lucide-react | ^1.7.0 | Icons: Search, X, MessageCircle, MapPin, ArrowRight | Already in project deps |
| tailwindcss | ^4 | All styling including responsive breakpoints | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/navigation useRouter | 16.1.6 | router.push() on Enter key result selection | Needed for keyboard Enter navigation |
| React Context API | built-in | SearchContext open/close/query state | Same pattern as CartContext, ConnectionsContext |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom Portal + motion.div | Radix UI Dialog | Radix not initialized; custom matches existing FlowPlayerModal exactly |
| React Context | Zustand/Jotai | Over-engineering for a single open/close boolean state |

**Installation:** No new packages required. All dependencies already in package.json.

---

## Architecture Patterns

### Recommended Project Structure
```
app/
├── context/
│   └── SearchContext.tsx        # Open/close state + query, mounts in ClientProviders
├── components/
│   └── search/
│       ├── GlobalSearchOverlay.tsx   # Portal + AnimatePresence + full overlay layout
│       ├── SearchFilterPills.tsx     # Category pill row (All/Members/Events/Courses/Pages)
│       ├── SearchResultRow.tsx       # Single row (member | event | course | page variants)
│       └── types.ts                  # SearchResult, SearchCategory type definitions
```

Note: Single-file vs split is Claude's discretion per CONTEXT.md. The split above is recommended by the UI spec; an executor may consolidate if simpler.

### Pattern 1: SearchContext — Open/Close Global State
**What:** React Context that exposes `isOpen`, `open()`, `close()` — enables the search icon in Header and the Cmd+K shortcut (Phase 53) to both trigger the same overlay.
**When to use:** Any component that needs to open or close the search overlay.
**Example (modeled on CartContext):**
```typescript
// app/context/SearchContext.tsx
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
```

### Pattern 2: Portal + AnimatePresence Overlay (from FlowPlayerModal)
**What:** `createPortal` mounts overlay into document.body; `AnimatePresence` drives enter/exit; two stacked `div`s — backdrop at z-[9999], panel container at z-[10000].
**When to use:** Any full-screen overlay that must escape stacking contexts.
**Example (from FlowPlayerModal.tsx — verified):**
```typescript
return createPortal(
  <AnimatePresence>
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm" onClick={close} />
    <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[10vh] pointer-events-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* overlay content */}
      </motion.div>
    </div>
  </AnimatePresence>,
  document.body
);
```

### Pattern 3: Debounce + Keyboard Nav (from SearchModal.tsx)
**What:** `useRef<ReturnType<typeof setTimeout>>` debounce, `useCallback` for search/handler stability, `selectedIdx` state for keyboard highlight, `ArrowDown/Up/Enter/Escape` in `onKeyDown`.
**When to use:** Any typeahead/search input with keyboard navigation.
**Example (from SearchModal.tsx — verified):**
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleInput = useCallback((value: string) => {
  setQuery(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => search(value), 200);
}, [search]);

const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
  else if (e.key === 'Enter' && results[selectedIdx]) { router.push(results[selectedIdx].href); close(); }
  else if (e.key === 'Escape') { close(); }
}, [results, selectedIdx, close, router]);
```

### Pattern 4: Auto-Focus on Open (from SearchModal.tsx)
**What:** `useEffect` watching `isOpen`, `setTimeout(..., 50)` to allow DOM paint before focusing.
**Example (from SearchModal.tsx — verified):**
```typescript
useEffect(() => {
  if (isOpen) {
    setTimeout(() => inputRef.current?.focus(), 50);
    setQuery('');
    setSelectedIdx(0);
  }
}, [isOpen]);
```

### Pattern 5: Mobile flex-col-reverse Layout
**What:** Outer container uses `flex flex-col-reverse` so the input row (last in DOM) renders at visual bottom, and the results/pills area (first in DOM) fills the space above.
**When to use:** Mobile full-screen overlay with input anchored to bottom.
**Example:**
```typescript
// Mobile: fixed inset-0 bg-white flex flex-col-reverse (< sm breakpoint)
// Desktop: centered modal with pt-[10vh]
<div className="sm:hidden fixed inset-0 z-[10000] bg-white flex flex-col-reverse">
  {/* Input bar — renders at visual bottom */}
  <div className="border-t border-slate-200 px-4 py-3 flex items-center gap-3">
    ...input...
  </div>
  {/* Filter pills + results — scroll area above input */}
  <div className="flex-1 overflow-y-auto flex flex-col">
    ...pills...
    ...results...
  </div>
</div>
```

### Pattern 6: Mount SearchProvider in ClientProviders
**What:** Add `<SearchProvider>` and `<GlobalSearchOverlay />` to ClientProviders.tsx — same pattern as FlowPlayerLoader which is already mounted there.
**Example:**
```typescript
// app/components/ClientProviders.tsx — add to existing providers
<SearchProvider>
  {children}
  <GlobalSearchOverlay />  {/* renders via Portal, always mounted */}
  <FlowPlayerLoader />
</SearchProvider>
```

### Pattern 7: Replace SearchWidget in Header.tsx
**What:** The current SearchWidget (lines 77-148 in Header.tsx) is a placeholder with an expanding inline input. Replace the `toggle()` call and internal state with `useSearch().open()`.
**Example:**
```typescript
// In SearchWidget component within Header.tsx
function SearchWidget() {
  const { open } = useSearch();
  return (
    <button onClick={open} className="w-8 h-8 rounded-lg flex items-center justify-center ..." aria-label="Search">
      <Search size={16} />
    </button>
  );
}
```

### Pattern 8: Mock SearchResult Data for Phase 51
**What:** Phase 51 delivers UI before API (Phase 52). Use a static mock array typed with the SearchResult interface. The mock should cover all categories so every code path is exercised.
**Example:**
```typescript
// app/components/search/types.ts
export type SearchCategory = 'members' | 'events' | 'courses' | 'pages';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  href: string;
  avatarUrl?: string;
  // member-specific
  has_full_address?: boolean;
  // for grouping display
  score?: number;
}

// Mock data array in GlobalSearchOverlay.tsx (or separate mockData.ts)
const MOCK_RESULTS: SearchResult[] = [
  { id: '1', category: 'members', title: 'Jane Smith', subtitle: 'Teacher · Berlin, DE', href: '/members/jane-smith', has_full_address: true },
  { id: '2', category: 'members', title: 'Alex Chen', subtitle: 'Student · Remote', href: '/members/alex-chen', has_full_address: false },
  { id: '3', category: 'events', title: 'Spring Yoga Retreat', subtitle: 'Apr 15, 2026', href: '/events/spring-retreat' },
  { id: '4', category: 'courses', title: 'Yin Yoga Fundamentals', subtitle: '8 lessons', href: '/academy/yin-yoga' },
  { id: '5', category: 'pages', title: 'Members Directory', subtitle: 'Browse all members', href: '/members' },
];
```

### Pattern 9: Results Grouped by Category
**What:** Group the filtered results array by category and render each group with a header label.
**Example:**
```typescript
function groupByCategory(results: SearchResult[]): Record<SearchCategory, SearchResult[]> {
  return results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<SearchCategory, SearchResult[]>);
}

const CATEGORY_ORDER: SearchCategory[] = ['members', 'events', 'courses', 'pages'];
const CATEGORY_LABELS: Record<SearchCategory, string> = {
  members: 'Members', events: 'Events', courses: 'Courses', pages: 'Pages',
};
```

### Anti-Patterns to Avoid
- **Mounting GlobalSearchOverlay per page:** Mount once in ClientProviders, not per-page, so the context and keyboard shortcut (Phase 53) work everywhere.
- **Inline search state in Header.tsx:** Header already has a complex SearchWidget stub — do not add more local state there; delegate to SearchContext.
- **`document.body` access in SSR:** `createPortal(content, document.body)` must be inside a `'use client'` component with a mounted check (or just rely on AnimatePresence rendering null when closed). FlowPlayerModal does not use a mounted guard because it's always conditionally rendered — follow the same pattern.
- **Using `focus()` without setTimeout:** The DOM is not always ready immediately on state change; the 50ms setTimeout from SearchModal.tsx is intentional and must be kept.
- **ArrowUp/Down without `e.preventDefault()`:** Without preventDefault, the browser scrolls the page, not just the result list.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Overlay animations | CSS transition hacks, keyframe animations | Framer Motion AnimatePresence (already in project) | Exit animations require AnimatePresence; exit is invisible without it |
| Portal mounting | Appending divs to body manually | React `createPortal` | Already established pattern; avoids stacking context bugs |
| Debounce function | Custom debounce utility | `useRef + setTimeout` pattern (already in SearchModal.tsx) | No extra library needed; pattern already proven in codebase |
| Icon components | SVG strings or inline SVGs | `lucide-react` (already in project) | Consistent sizing, accessible, tree-shaken |
| Focus management | Custom focus trap library | Native `autoFocus` + `useEffect + inputRef.focus()` | Phase 51 does not need full focus trap; accessibility spec only requires input auto-focus and return-focus-on-close |

**Key insight:** This phase is almost entirely assembly of existing project patterns — the novel work is wiring them together correctly (SearchContext → Header trigger → Portal overlay → mock results).

---

## Common Pitfalls

### Pitfall 1: AnimatePresence Not Wrapping the Conditional
**What goes wrong:** The exit animation never plays; the overlay disappears instantly.
**Why it happens:** `AnimatePresence` must be the direct parent of the `motion.div` that conditionally renders. Wrapping only the backdrop or only the panel breaks exit.
**How to avoid:** Follow FlowPlayerModal exactly — both backdrop and panel inside `<AnimatePresence>`.
**Warning signs:** Component disappears with no animation on close.

### Pitfall 2: Portal Renders on Server (SSR TypeError)
**What goes wrong:** `document.body` is undefined during SSR, crashing with `TypeError: Cannot read properties of undefined`.
**Why it happens:** `createPortal` requires DOM. If the component tries to render on the server, it fails.
**How to avoid:** The component must be `'use client'`; the Portal call should only run client-side. AnimatePresence with `isOpen` boolean means nothing renders until open — this is safe. Alternatively add a `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), [])` guard before the portal call.
**Warning signs:** Build error or hydration mismatch mentioning `document`.

### Pitfall 3: Backdrop z-index Below Other Fixed Elements
**What goes wrong:** The search overlay appears behind the Header or other fixed elements.
**Why it happens:** Header.tsx likely uses `z-50` or similar. If the backdrop is only `z-50`, it loses.
**How to avoid:** Use `z-[9999]` for backdrop and `z-[10000]` for panel — matching FlowPlayerModal exactly. This is noted as Claude's Discretion in CONTEXT.md but the answer is clear from the existing pattern.
**Warning signs:** Header nav items appear on top of the overlay.

### Pitfall 4: selectedIdx Going Stale on Results Change
**What goes wrong:** Arrow key navigation jumps to wrong result after query changes.
**Why it happens:** `selectedIdx` retains its previous value when `setResults()` fires with a new array.
**How to avoid:** Reset `setSelectedIdx(0)` whenever `setResults()` is called. SearchModal.tsx already does this — copy the pattern.
**Warning signs:** Pressing Enter opens the wrong result after typing.

### Pitfall 5: Mobile Filter Pills Forcing Two Rows
**What goes wrong:** On small screens, "All / Members / Events / Courses / Pages" wraps onto a second line, breaking the layout.
**Why it happens:** Default flex wrapping is `flex-wrap`.
**How to avoid:** Use `overflow-x-auto flex-nowrap` on the pill container for mobile. UI spec confirms: `overflow-x-auto` on mobile, no wrap.
**Warning signs:** Filter row is taller than expected on small screens.

### Pitfall 6: Keyboard Events Leaking to Page When Overlay is Closed
**What goes wrong:** ArrowUp/Down scroll the page even when search is closed.
**Why it happens:** A `keydown` listener on `document` is added but not cleaned up, or is added unconditionally.
**How to avoid:** Only attach the Escape keydown listener when `isOpen === true`. The ArrowDown/Up handling lives on the `<input>` element's `onKeyDown`, so it only fires when the input is focused — naturally safe.
**Warning signs:** Page scrolling is suppressed when search is closed.

### Pitfall 7: SearchWidget Stub Still Active After Replacement
**What goes wrong:** Two search UI elements appear, or the old stub's `useClickOutside` handler conflicts with the new overlay.
**Why it happens:** The old SearchWidget in Header.tsx has internal state and a `useClickOutside` handler. If not fully replaced, both run.
**How to avoid:** Completely replace the SearchWidget function body with a single button calling `useSearch().open()` — remove all internal state, the input, and the Dropdown from the old implementation.
**Warning signs:** Two search-related elements visible in the header.

---

## Code Examples

Verified patterns from official sources (SearchModal.tsx, FlowPlayerModal.tsx, CartContext.tsx — all in this codebase):

### SearchContext (complete minimal implementation)
```typescript
// Source: modeled on app/context/CartContext.tsx (verified)
'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <SearchContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}
```

### GlobalSearchOverlay skeleton (desktop + portal)
```typescript
// Source: FlowPlayerModal.tsx (portal/animation) + SearchModal.tsx (internals)
'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageCircle, MapPin } from 'lucide-react';
import { useSearch } from '@/app/context/SearchContext';
import { useRouter } from 'next/navigation';
import type { SearchResult, SearchCategory } from './types';

export default function GlobalSearchOverlay() {
  const { isOpen, close } = useSearch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Auto-focus on open (from SearchModal.tsx)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
    }
  }, [isOpen]);

  // Debounced search (from SearchModal.tsx)
  const handleInput = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // Phase 51: filter mock data; Phase 52: call API
      setSelectedIdx(0);
    }, 200);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIdx]) { router.push(results[selectedIdx].href); close(); }
    else if (e.key === 'Escape') { close(); }
  }, [results, selectedIdx, close, router]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="fixed inset-0 z-[10000] hidden sm:flex items-start justify-center pt-[10vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Input bar, filter pills, results, keyboard hints */}
            </motion.div>
          </div>
          {/* Mobile: full-screen flex-col-reverse */}
          <div className="fixed inset-0 z-[10000] sm:hidden bg-white flex flex-col-reverse">
            {/* Input bar at visual bottom */}
            {/* Results + pills above */}
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline expanding search input in header (current placeholder) | Separate full overlay via Portal | Phase 51 | Enables category filtering, keyboard nav, grouped results |
| Framer Motion v10/v11 API | v12 API (same animate/exit props, minor internal changes) | Upgraded recently | No API changes needed — project already on v12 |
| AnimatePresence children must be keyed | Still true in v12 | Ongoing | Wrap motion.div children with `key` if using conditional renders |

**No deprecated patterns relevant to this phase.**

---

## Open Questions

1. **Return focus on overlay close**
   - What we know: Accessibility contract requires returning focus to the element that opened the overlay (search icon in header)
   - What's unclear: Whether to use `document.activeElement` capture before open or a ref passed to the context
   - Recommendation: Capture `document.activeElement` as `HTMLElement | null` in `SearchContext.open()` and call `.focus()` in `close()`. Simple, no extra library.

2. **Focus trap completeness**
   - What we know: UI spec lists Tab cycling through input → pills → results → X button
   - What's unclear: Whether a full focus trap (trapping Tab at overlay boundaries) is required for Phase 51 or is in scope for a later accessibility pass
   - Recommendation: Implement auto-focus (SRCH-08 requirement) and return-focus-on-close for Phase 51. Full Tab trap is not in the SRCH requirements and can defer to a polish phase.

3. **AnimatePresence and SSR hydration**
   - What we know: `createPortal` requires DOM; `'use client'` directive is required
   - What's unclear: Whether Next.js 16 / React 19 has any new behavior for Portals
   - Recommendation: Use the same pattern as FlowPlayerModal (verified working in this project). Add a `mounted` guard only if SSR errors appear in testing.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — all required libraries are already installed in package.json, verified above: framer-motion ^12.38.0, lucide-react ^1.7.0, react 19.2.3, next 16.1.6, tailwindcss ^4)

---

## Validation Architecture

`workflow.nyquist_validation` key is absent from `.planning/config.json` — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Not detected — no test config files or test directories found in project |
| Config file | none |
| Quick run command | N/A — no test infrastructure exists |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Search icon click opens overlay | manual | — | ❌ |
| SRCH-02 | Esc/X/backdrop close overlay | manual | — | ❌ |
| SRCH-03 | Category pills filter results | manual | — | ❌ |
| SRCH-04 | Arrow keys navigate, Enter opens | manual | — | ❌ |
| SRCH-05 | Results grouped by category, top result highlighted | manual | — | ❌ |
| SRCH-06 | Member rows show message icon; map icon if has_full_address | manual | — | ❌ |
| SRCH-07 | Mobile full-screen overlay with input at bottom | manual | — | ❌ |
| SRCH-08 | Auto-focus on open | manual | — | ❌ |

All Phase 51 requirements are interaction/visual — appropriate for manual smoke testing against `vercel dev` or `npm run dev`.

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (required by CLAUDE.md — 0 errors before any commit)
- **Per wave merge:** manual smoke test in browser at localhost
- **Phase gate:** `npx tsc --noEmit` green + manual verification of all 8 SRCH requirements

### Wave 0 Gaps
No automated test infrastructure exists in this project. No test files to create for this phase — all verification is manual + TypeScript compilation. This matches the project's current testing approach.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| After completing ANY task, update `docs/` files for affected features | After Phase 51 completes, add/update `docs/` entry for Global Search feature |
| Only commit when `npx tsc --noEmit` passes with 0 errors | Every commit must be TypeScript-clean |
| Create milestone activity file in `activity/` | Create `activity/vX-X-X_GlobalSearch_DD-MM-YYYY.md` when milestone starts |
| All page content sections must use `PageContainer` | Not directly applicable — search overlay is a fixed Portal, not a page content section |
| `'use client'` components require explicit directive | `SearchContext.tsx`, `GlobalSearchOverlay.tsx` must both have `'use client'` at top |
| Create branch before starting milestone work: `git checkout -b feature/[milestone-name]` | Branch should be `feature/global-search` before any Phase 51 work begins |
| No `select('*')` for profile fetches — use PUBLIC_PROFILE_COLUMNS | Applies in Phase 52 (API), not Phase 51 (mock data only) |

---

## Sources

### Primary (HIGH confidence)
- `app/components/docs/SearchModal.tsx` (this codebase) — debounce pattern, keyboard nav, auto-focus, result scoring, footer hints
- `app/components/flow-player/FlowPlayerModal.tsx` (this codebase) — Portal + AnimatePresence + scale/fade animation, backdrop z-index pattern
- `app/context/CartContext.tsx` (this codebase) — React Context structure, Provider/useContext pattern
- `app/components/ClientProviders.tsx` (this codebase) — provider mounting location, FlowPlayerLoader mounting pattern
- `app/layout.tsx` (this codebase) — layout structure, where ClientProviders wraps everything
- `app/components/Header.tsx` lines 77-148 (this codebase) — SearchWidget to replace, useClickOutside hook
- `.planning/phases/51-search-overlay-ui/51-UI-SPEC.md` (this codebase) — complete visual/interaction/accessibility contract
- `package.json` (this codebase) — verified versions: framer-motion ^12.38.0, lucide-react ^1.7.0, react 19.2.3, next 16.1.6

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` research notes — confirms SearchContext at layout level, useRef debounce, Map cache pattern, has_full_address derivation logic
- `.planning/REQUIREMENTS.md` — full SRCH-01 through SRCH-08 requirement text

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in package.json, all patterns verified in existing codebase files
- Architecture: HIGH — direct reference implementations exist (FlowPlayerModal, SearchModal, CartContext)
- Pitfalls: HIGH — all pitfalls derived from reading actual codebase code and known React/Portal/Framer Motion behaviors
- Mock data approach: HIGH — explicitly stated in UI spec (Phase 51 = UI with mock data, API in Phase 52)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable — framer-motion and React APIs are stable; no external service dependencies)
