# Technology Stack — Flow Builder

**Project:** GOYA v2 Flow Builder
**Researched:** 2026-03-27
**Confidence:** HIGH (all primary claims verified via npm/official sources)

---

## Existing Stack (Already Installed — No Changes Needed)

| Package | Version in package.json | Role in Flow Builder |
|---------|------------------------|---------------------|
| `@dnd-kit/core` | ^6.3.1 | Step reordering in admin builder |
| `@dnd-kit/sortable` | ^10.0.0 | Step list sortable preset |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform helpers for drag handles |
| `next` | 16.1.6 | App Router, Server Components, Route Handlers |
| `@supabase/ssr` | ^0.8.0 | Server-side condition evaluation, auth |
| `@supabase/supabase-js` | ^2.95.2 | JSONB reads/writes for flow data |
| `lucide-react` | ^1.7.0 | Icons for flow editor UI |
| `recharts` | 3.8.0 | Flow analytics charts |
| `tailwindcss` | ^4 | Styling all new components |

**Assessment:** The drag-and-drop foundation (@dnd-kit/*) is already present at correct versions. No upgrades needed. @dnd-kit/core 6.3.1 and @dnd-kit/sortable 10.0.0 are the current published versions (last published ~12 months ago; library is stable, not abandoned).

---

## New Dependencies to Add

### 1. State Management for Flow Editor

**Add:** `zustand@^5.0.12`

**Why:** The admin flow builder requires complex shared editor state: selected step, canvas history, unsaved changes flag, and drag-in-progress state. This state needs to be accessible across deeply nested components (step list, element palette, properties panel, preview pane) without prop drilling. Zustand 5 is the lightest solution (~1.2KB) that handles this cleanly. It uses native `useSyncExternalStore`, works with React 19.2.3, and requires zero boilerplate.

**Why not React Context:** Context causes full subtree re-renders on every state update. The builder has many components and frequent updates (drag events, text edits). Zustand only re-renders components subscribed to changed slices.

**Why not Redux Toolkit:** Massive overkill for a single-workstream editor state. RTK adds 40KB+ and architectural overhead (actions, reducers, selectors) for a problem Zustand solves in ~30 lines.

```bash
npm install zustand
```

---

### 2. Form Validation for Flow Config and Element Config Panels

**Add:** `zod@^4.3.6` + `react-hook-form@^7.72.0` + `@hookform/resolvers@^5.2.2`

**Why zod:** Flow step elements (choice options, text questions, button labels) have structured schemas that need runtime + compile-time validation. Zod 4 is 57% smaller than Zod 3 and compiles 10x faster. Since the project has no existing Zod dependency, go straight to v4.

**Why react-hook-form:** The element properties panel and flow settings form will have many small forms (5-15 fields each). RHF avoids per-keystroke re-renders via uncontrolled components + refs. It pairs with Zod via `@hookform/resolvers`.

**Zod v4 + @hookform/resolvers compatibility:** Confirmed. `@hookform/resolvers@5.2.2` supports Zod v3 and v4, with auto-detection. No special configuration required — import from `'zod'` normally.

**Why not native HTML5 validation:** Cannot do cross-field rules (e.g., "at least 2 choices required for a choice element"), cannot share schemas between client validation and server-side flow evaluation logic.

```bash
npm install zod react-hook-form @hookform/resolvers
```

---

### 3. Animation for Flow Player Display Types

**Add:** `motion@^12.x` (formerly `framer-motion`, package name is now `motion`)

**Why:** The Flow Player renders 5 display types with enter/exit animations:
- **Modal:** fade + scale in, fade + scale out
- **Fullscreen:** slide up/down
- **Top Banner:** slide down from top, slide up to dismiss
- **Bottom Banner:** slide up from bottom, slide down to dismiss
- **Notification:** slide in from corner, auto-dismiss with fade

CSS transitions alone cannot animate elements being *removed* from the DOM (unmounting). `AnimatePresence` from `motion/react` solves exactly this — wraps conditionally-rendered components and plays exit animations before removal.

**Why not CSS-only:** Tailwind transitions (`transition`, `duration-*`) cannot animate unmounting components. You'd need to keep elements mounted and toggle opacity/transform, adding complexity and a11y issues. Motion's `AnimatePresence` handles this in ~5 lines.

**Import path:** Use `motion/react`, not `framer-motion`. The package was renamed mid-2025. The old `framer-motion` package still works but new installs should use `motion`.

**React 19 support:** Confirmed. Motion 12 has full React 19 concurrent rendering support.

**Scope:** Import ONLY in the Flow Player components (client components). Do not add motion animations to the admin builder — native dnd-kit drag transforms are sufficient there.

```bash
npm install motion
```

---

## What NOT to Add

| Library | Reason to Exclude |
|---------|------------------|
| `react-flow` / `xyflow` | Node graph editor — designed for DAG-style flowcharts. GOYA flows are sequential lists with branching, not arbitrary node graphs. @dnd-kit sortable list is correct for this shape. |
| `@typeform/embed-react` | Embeds external Typeform forms. We're building our OWN Typeform-style elements. |
| `immer` | Zustand 5 has built-in immer middleware (`immer` from `zustand/middleware`). Add the middleware only if nested state mutations become deeply complex — defer until needed. |
| `react-beautiful-dnd` | Deprecated in 2023. @dnd-kit (already installed) is the correct replacement. |
| `@radix-ui/*` | Not in existing codebase. The project uses a minimal custom UI (`Button.tsx`, `Card.tsx`, `Badge.tsx`). Adding Radix creates a parallel component system. Build FlowPlayer display shells from scratch using existing patterns. |
| `react-query / tanstack-query` | Not needed. Flow player data is fetched once server-side per page load via Supabase SSR. Admin builder uses local Zustand state + saves to Supabase on explicit "Save" actions. No complex cache invalidation. |
| `shadcn/ui` | Not in existing codebase. Would create a component system conflict with the existing minimal UI. |

---

## JSONB Strategy (No New Library — Architecture Decision)

Flow data (conditions, step elements, branch rules) is stored as JSONB. The existing `@supabase/supabase-js` handles reads/writes.

**Pattern:**
- **Simple queries** (fetch flow by ID): `supabase.from('flows').select('*').eq('id', flowId)` — plain JS object, TypeScript types via generated Supabase types.
- **Complex condition evaluation** (server-side): Use RPC (`supabase.rpc('get_active_flow_for_user', {...})`) for multi-condition AND logic. A Postgres function handles JSONB operators. This keeps business logic in SQL where it belongs and prevents client-side bypass.
- **Admin writes**: Full JSONB replace on save — no partial patch needed. The editor holds full state in Zustand; saving = one `upsert` call.

No ORM or query builder library needed. Zod schemas validate the JSONB shape on read in TypeScript.

---

## Integration Points with Existing Stack

| Integration | Approach |
|-------------|----------|
| AdminShell sidebar | Add "Flows" nav item — follows identical pattern to existing admin pages |
| Supabase auth | Server-side condition evaluation uses `createServerClient` from `@supabase/ssr` (already installed) |
| Kit.com | Actions engine reuses `KITCOM_API_KEY` env var + existing fetch pattern |
| Stripe | Redirect action uses existing Stripe checkout session creation |
| Email | Flow action triggers existing Resend email sender |
| Recharts | Analytics dashboard reuses existing Recharts components already in the codebase |
| Design tokens | FlowPlayer reads CSS custom properties from `globals.css` — no new tokens needed |

---

## Summary: Install Commands

```bash
# New dependencies only
npm install zustand zod react-hook-form @hookform/resolvers motion
```

That is 4 packages. Everything else is already installed.

---

## Sources

- [@dnd-kit/core npm](https://www.npmjs.com/package/@dnd-kit/core)
- [@dnd-kit/sortable npm](https://www.npmjs.com/package/@dnd-kit/sortable)
- [Zustand v5 announcement](https://pmnd.rs/blog/announcing-zustand-v5)
- [Zustand npm](https://www.npmjs.com/package/zustand)
- [Zod v4 release notes](https://zod.dev/v4)
- [zod npm](https://www.npmjs.com/package/zod)
- [react-hook-form npm](https://www.npmjs.com/package/react-hook-form)
- [@hookform/resolvers npm](https://www.npmjs.com/package/@hookform/resolvers)
- [Zod v4 + hookform/resolvers compatibility issue](https://github.com/react-hook-form/resolvers/issues/799)
- [Motion (formerly Framer Motion) docs](https://motion.dev/docs/react)
- [Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
- [motion npm](https://www.npmjs.com/package/motion)
- [React Flow (xyflow)](https://reactflow.dev) — evaluated and excluded
- [Supabase JSONB docs](https://supabase.com/docs/guides/database/json)
