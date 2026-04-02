# Technology Stack

**Project:** GOYA v2 — v1.18 User Profile Redesign (`/members/[id]`)
**Researched:** 2026-04-01
**Scope:** New capabilities only. Existing stack (Next.js 16, Tailwind CSS 4, Supabase, embla-carousel-react, framer-motion) is validated and excluded.

---

## Summary Verdict

**Zero new dependencies required.** Every capability needed for the profile redesign is already present in the installed packages or achievable with plain HTML/CSS/Tailwind patterns. Do not add libraries.

---

## Capability Analysis

### Mapbox Inline Map

**Verdict:** Use the existing `mapbox-gl@3.20.0` directly. No wrapper library (react-map-gl, etc.) needed.

**Rationale:**
- `mapbox-gl` is already installed at `^3.20.0` (resolved `3.20.0`). `NEXT_PUBLIC_MAPBOX_TOKEN` is already configured.
- `app/members/MapPanel.tsx` is a working reference implementation: raw `mapboxgl` API via `useRef<mapboxgl.Map>`, loaded via `dynamic(() => import('./MapPanel'), { ssr: false })` from the parent page. This pattern builds successfully in production today.
- No `transpilePackages` entry is needed in `next.config.ts` — confirmed absent and working in the existing build.
- A profile-page inline map is simpler than the full members-directory MapPanel (single marker, no clustering, smaller viewport). The same raw API handles this with fewer lines.
- `react-map-gl` would add ~120 KB and a dependency update surface for no benefit over the already-working raw approach.

**Integration pattern (follow MapPanel.tsx exactly):**

```tsx
// ProfileMap.tsx — 'use client'
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Parent: dynamic(() => import('./ProfileMap'), { ssr: false })
```

Use a fixed-height container (`h-48` or `h-56`), single marker at the profile coordinates, zoom 11, `interactive: false` (no pan/zoom for inline display), `navigationControl` omitted. Match the existing `goya-map-pin` marker style from MapPanel.

**Static vs interactive:** Use `interactive: false` for the profile page inline map. The full members directory already provides the interactive experience. Static keeps the embed lightweight and prevents accidental scroll-hijacking inside the page.

---

### YouTube / Vimeo Video Embeds

**Verdict:** Plain `<iframe>` with regex ID extraction. No library.

**Rationale:**
- This pattern is already implemented twice in the codebase:
  - `app/components/flow-player/elements/VideoRenderer.tsx` — YouTube iframe embed with `extractYouTubeId()` regex
  - `app/academy/[id]/lesson/[lessonId]/page.tsx` — both `extractVimeoId()` and `extractYouTubeId()` with iframes
- Copy those extraction utilities into a shared `lib/video.ts` helper. The profile page intro video field stores a URL (YouTube or Vimeo). Detect provider, extract ID, render iframe.
- Libraries like `react-player` or `@vidstack/react` add significant bundle weight (react-player is ~190 KB gzipped). The existing regex approach is 12 lines and already handles all formats in use on the platform.

**Shared utility to extract (create `lib/video.ts`):**

```ts
export function extractVideoEmbed(url: string): { provider: 'youtube' | 'vimeo'; id: string } | null
```

YouTube embed URL: `https://www.youtube.com/embed/{id}?rel=0`
Vimeo embed URL: `https://player.vimeo.com/video/{id}`

Iframe attrs: `allowFullScreen`, `allow="autoplay; encrypted-media; picture-in-picture"`, `loading="lazy"`, `title="Intro video"`, `className="w-full h-full"`, wrapper `aspect-video rounded-xl overflow-hidden bg-black`.

---

### Pill / Badge UI Components

**Verdict:** Pure Tailwind CSS utility classes. No library.

**Rationale:**
- Role badges, designation badges, teaching-style pills, and specialty pills all exist across the codebase as inline Tailwind spans (confirmed in `MapPanel.tsx`, `members/page.tsx`, `members/[id]/page.tsx`).
- The profile redesign requires the same pattern: `px-3 py-1 rounded-full text-xs font-medium border` with role-specific color classes.
- The existing `ROLE_HERO` map in `app/members/[id]/page.tsx` already defines role badge color classes. Extend it for the new hero section — do not duplicate.

---

## What NOT to Add

| Library | Reason to Skip |
|---------|----------------|
| `react-map-gl` | mapbox-gl is already installed and working with the same API surface |
| `react-player` | iframe regex is already used in 2 places; no streaming/event integration needed |
| `@vidstack/react` | Overkill for a single embed; adds ~190 KB |
| Any color picker | Not needed for this milestone |
| Any icon library addition | `lucide-react` already installed |

---

## next.config.ts — No Changes Required

Current config has `images.remotePatterns` for `i.pravatar.cc`. For the profile redesign, Supabase Storage avatars and cover images are fetched via existing patterns. If profile cover images can come from Supabase Storage domains, add the Supabase storage hostname to `remotePatterns`:

```ts
{ protocol: 'https', hostname: '*.supabase.co' }
```

This is conditional on whether `next/image` is used for cover images (recommended). Not a new dependency — a config entry.

---

## Integration Points

| Capability | Component | Load Strategy | CSS |
|------------|-----------|---------------|-----|
| Inline map | `ProfileMap.tsx` (new) | `dynamic(ssr:false)` | `mapbox-gl/dist/mapbox-gl.css` imported inside component |
| Video embed | `ProfileVideoEmbed.tsx` (new, client) | Normal import (no dynamic needed — just an iframe) | Tailwind only |
| Pill sections | Inline spans | Server component | Tailwind only |
| Carousels | Reuse `HorizontalCarousel` + `EventCard` + `CourseCard` from v1.17 dashboard | Server component with client carousel | Existing |

---

## Confidence

| Area | Level | Reason |
|------|-------|--------|
| mapbox-gl usage pattern | HIGH | Verified against working MapPanel.tsx in codebase |
| Video iframe pattern | HIGH | Verified against 2 working implementations in codebase |
| No new dependencies | HIGH | Cross-checked package.json against all required capabilities |
| next.config.ts Supabase image domain | MEDIUM | Depends on whether next/image is used for cover images — verify at implementation time |

---

## Sources

- `app/members/MapPanel.tsx` — working mapbox-gl integration reference
- `app/academy/[id]/lesson/[lessonId]/page.tsx` — working YouTube + Vimeo iframe extraction
- `app/components/flow-player/elements/VideoRenderer.tsx` — YouTube iframe pattern
- `package.json` — confirmed installed versions
- `next.config.ts` — confirmed no transpilePackages needed
