# Technology Stack

**Project:** GOYA v2 — v1.17 Dashboard Redesign
**Researched:** 2026-04-01
**Scope:** Stack additions for horizontal carousels, profile completion scoring UI, and role-specific layouts ONLY. Existing stack (Next.js 16, Tailwind CSS 4, Supabase, framer-motion, recharts, @dnd-kit, lucide-react) is not re-evaluated.

---

## Decision Summary

| Capability | Decision | Rationale |
|------------|----------|-----------|
| Horizontal carousels (desktop scroll) | Native CSS — Tailwind snap-x utilities | Already in stack, zero bytes added |
| Horizontal carousels (mobile swipe) | `embla-carousel-react` ^8.6.0 | Lightest option (~6 KB), SSR-safe, no conflicts with framer-motion |
| Hide scrollbar on carousel track | `@utility no-scrollbar` in globals.css | tailwind-scrollbar-hide has confirmed v4 compatibility issues |
| Progress bars | Native Tailwind div | No library needed — CSS width animation is sufficient |
| Profile completion scoring | Pure TypeScript utility function | Stateless weighted scoring, no library |
| Role-specific layouts | Conditional rendering in RSC | Standard Next.js pattern, no new dependency |
| Stat hero count-up animation | framer-motion (already installed) | `animate()` + `useMotionValue` for number interpolation |

---

## New Dependencies to Add

### embla-carousel-react

| Field | Value |
|-------|-------|
| Package | `embla-carousel-react` |
| Version | `^8.6.0` (current stable; 9.x is RC, not production-ready) |
| Peer dependency | `embla-carousel` (installed automatically as a peer) |
| Bundle impact | ~6 KB gzipped total for both packages |
| SSR | Supported — hook only initialises after mount |
| framer-motion conflict | None — Embla delegates to the browser scroll engine; framer-motion operates on transform layers |

**Why not framer-motion `drag` instead?** framer-motion is already installed and its `drag` prop can produce swipeable lists. However, it does not respect CSS `scroll-snap-stop` points, requires manual velocity/inertia tuning per device, and fights native scroll physics on Android. The result on low-end devices is observable jank — the opposite of the Apple/Netflix aesthetic goal. Embla adds exactly the missing desktop-drag-to-scroll behaviour on top of the browser's native scroll engine, so physics are native everywhere.

**Why not Swiper?** Swiper ships ~40 KB gzipped and pulls in its own CSS module system. Its CSS custom-property approach conflicts with Tailwind CSS 4's utility-first output. Overkill for a single horizontal card rail.

**Why not pure CSS only?** CSS `scroll-snap` handles touch-swipe on mobile and keyboard navigation natively. The gap is desktop: mouse drag is not a native browser scroll gesture on non-touch screens, so users on desktop cannot drag the carousel. Embla fills exactly that gap.

### Installation

```bash
npm install embla-carousel-react
```

`embla-carousel` (core) is installed automatically as a peer dependency.

---

## No New Dependencies — Built from Existing Stack

### Scrollbar Hide

Do NOT install `tailwind-scrollbar-hide`. There is an open confirmed issue (reslear/tailwind-scrollbar-hide #31) that the plugin produces no output under Tailwind CSS 4's `@import "tailwindcss"` import model — the `@config` hook it relies on is not supported in v4.

Instead, add this once to `globals.css`:

```css
@utility no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}
```

The `@utility` directive is the correct Tailwind CSS 4 mechanism for custom utility classes. Apply the `no-scrollbar` class directly to carousel track elements.

### Progress Bars (Profile Completion)

The profile completion bar is a styled `<div>` with an inline `style={{ width: `${pct}%` }}` inside a fixed-height rounded container. Tailwind already provides the transition utilities needed:

```tsx
<div className="h-2 w-full rounded-full bg-[var(--goya-border)]">
  <div
    className="h-2 rounded-full bg-[var(--goya-primary)] transition-[width] duration-500 ease-out"
    style={{ width: `${score}%` }}
  />
</div>
```

No library. If a spring-physics feel is preferred over CSS easing, `framer-motion`'s `motion.div` with `animate={{ width: `${score}%` }}` is a drop-in replacement — framer-motion is already installed.

### Profile Completion Scoring

A pure TypeScript function in `lib/profile/completion.ts`. Stateless, no imports, computable in a Server Component:

```ts
type FieldCheck = {
  key: string
  weight: number
  label: string
  href: string
  complete: boolean
}

export function calcProfileCompletion(profile: ProfileShape): {
  score: number        // 0–100, integer
  checklist: FieldCheck[]
  missing: FieldCheck[]
}
```

The 6 weighted fields (avatar, bio, location, website, designation, certification) and their weights are project-defined, not library-defined. No external dependency justified.

### Role-Specific Layouts

Conditional rendering in a Server Component based on `profile.role`. The authenticated user's profile is already available in the dashboard layout via Supabase. Pattern:

```tsx
// app/dashboard/page.tsx — Server Component
if (profile.role === 'teacher')             return <TeacherDashboard profile={profile} />
if (profile.role === 'school')              return <SchoolDashboard  profile={profile} />
if (profile.role === 'wellness_practitioner') return <WellnessDashboard profile={profile} />
return <StudentDashboard profile={profile} />
```

Co-locate layout components at `app/dashboard/_layouts/`. No new routing library, no new dependency.

### Stat Hero Count-Up Animation

`framer-motion` at `^12.38.0` is already installed. Use `animate()` from `framer-motion/dom` or `useMotionValue` + `useTransform` for a count-up effect on mount:

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: v => { if (ref.current) ref.current.textContent = Math.round(v).toString() }
    })
  }, [value])
  return <span ref={ref}>0</span>
}
```

Keep the client component boundary tight — wrap only the number span, not the entire hero section.

---

## Tailwind CSS 4 Carousel Classes (No Config Needed)

All scroll-snap utilities work out of the box in Tailwind CSS 4 with no plugin or config file:

| Class | CSS Property |
|-------|-------------|
| `overflow-x-auto` | `overflow-x: auto` |
| `snap-x` | `scroll-snap-type: x var(--tw-scroll-snap-strictness)` |
| `snap-mandatory` | `--tw-scroll-snap-strictness: mandatory` |
| `snap-proximity` | `--tw-scroll-snap-strictness: proximity` |
| `snap-start` | `scroll-snap-align: start` |
| `snap-center` | `scroll-snap-align: center` |
| `scroll-smooth` | `scroll-behavior: smooth` |

**Recommended carousel track classes:** `flex overflow-x-auto snap-x snap-mandatory gap-4 no-scrollbar scroll-smooth pb-2`

**Recommended card classes:** `snap-start shrink-0 w-[280px]` (or `w-[calc(100vw-3rem)]` on mobile for full-width cards)

---

## Alternatives Considered and Rejected

| Category | Rejected Option | Reason |
|----------|-----------------|--------|
| Carousel | Swiper | ~40 KB gzipped; CSS module system conflicts with Tailwind 4 |
| Carousel | keen-slider | Smaller community than Embla; no meaningful advantage for this use case |
| Carousel | react-snap-carousel | Headless-only; less mature ecosystem; Embla is the community standard |
| Carousel | framer-motion drag | No CSS scroll-snap integration; jank on Android; manual physics tuning |
| Carousel | Pure CSS only | Desktop drag-to-scroll is not a native browser behaviour; requires JS |
| Scrollbar hide | tailwind-scrollbar-hide | Open confirmed issue: broken under Tailwind CSS 4 |
| Progress bar | react-circular-progressbar | Adds a dependency for a shape achievable in ~8 lines of CSS |
| Animation | CSS `@keyframes` counter | CSS has no native counter animation; JS required regardless |

---

## Final Install Command

```bash
npm install embla-carousel-react
```

This is the only new dependency this milestone requires. Everything else uses existing stack capabilities.

---

## Sources

- [embla-carousel-react npm (v8.6.0 stable)](https://www.npmjs.com/package/embla-carousel-react) — MEDIUM confidence (npm page returned 403; version confirmed via multiple secondary sources)
- [Embla Carousel official docs — React setup](https://www.embla-carousel.com/docs/get-started/react) — HIGH confidence (fetched directly)
- [Tailwind CSS scroll-snap-type documentation](https://tailwindcss.com/docs/scroll-snap-type) — HIGH confidence (fetched directly)
- [tailwind-scrollbar-hide v4 compatibility — Issue #31](https://github.com/reslear/tailwind-scrollbar-hide/issues/31) — HIGH confidence (GitHub issue thread, multiple confirmations)
- [Tailwind CSS v4 custom @utility directive discussion](https://github.com/tailwindlabs/tailwindcss/discussions/14093) — HIGH confidence
- [React carousel library comparison 2025/2026](https://enstacked.com/react-carousel-component-libraries/) — LOW confidence (blog post, not primary source; used for bundle size cross-reference only)
- [framer-motion + Embla conflict report #317](https://github.com/davidjerleke/embla-carousel/issues/317) — MEDIUM confidence (GitHub issue thread confirming they do not conflict when used on separate layers)

---

*Stack research for: GOYA v2 — v1.17 Dashboard Redesign*
*Researched: 2026-04-01*
