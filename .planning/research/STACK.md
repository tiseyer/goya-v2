# Stack Research

**Domain:** Course system redesign — categories, multi-lesson, video/audio, drag-and-drop ordering
**Researched:** 2026-04-01
**Confidence:** HIGH

## Context

This research covers ONLY net-new additions for v1.15. The validated base stack (Next.js 16, React 19, TypeScript 5, Tailwind v4, Supabase, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, framer-motion, react-markdown, @tiptap/react) is in production and not re-evaluated here.

Five capability gaps need filling:

1. **YouTube embedding** — lazy-load, privacy-safe iframe with poster image
2. **Audio playback UI** — cross-browser consistent player with progress/volume
3. **Vimeo embedding** — already works; needs extraction into shared component
4. **Drag-and-drop lesson ordering** — vertical sortable list already in project
5. **Duration slider + form card sections** — UI polish for course creation form

---

## Recommended Stack

### Core Technologies (NEW)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `react-lite-youtube-embed` | `^3.5.0` | YouTube video embedding with lazy load | Loads only a thumbnail until the user clicks play (~5KB gzipped). Avoids the ~500KB YouTube IFrame API on initial render. Privacy-safe (youtube-nocookie.com by default). React 19 confirmed compatible (v3.5.0, Feb 2026). |
| `react-h5-audio-player` | `^3.10.2` | Audio lesson player UI | Styled, accessible audio player with play/pause/seek/volume/time. TypeScript. Mobile-friendly. Building equivalent cross-browser from scratch is ~200 lines of CSS + JS with no differentiating value. Last release Mar 2026. |

### No New Libraries Required

| Capability | Approach | Rationale |
|------------|----------|-----------|
| Vimeo embedding | Raw `<iframe>` (existing pattern) | Already in `app/academy/[id]/lesson/page.tsx` with correct 16:9 padding-top trick. Extract into `components/lessons/VimeoEmbed.tsx`. Do not add a Vimeo SDK. |
| Drag-and-drop lesson ordering | `@dnd-kit/sortable` v10 + `@dnd-kit/core` v6 (already installed) | Products admin already uses these packages. Use `SortableContext` with `verticalListSortingStrategy`. Zero new packages. |
| Duration slider | Native `<input type="range">` | Tailwind v4 arbitrary variants handle cross-browser track/thumb styling. Single-value slider is trivial — no component library justified. Store as `duration_minutes` integer, not free-text string. |
| Category CRUD form | Supabase + existing Tailwind form patterns | Reuse `INPUT`/`LABEL`/`SELECT` constants from `CourseForm.tsx`. No UI library. |
| Lesson rich text body | `@tiptap/react` v3.20 (already installed) | Already used for other rich text in the project. Use `StarterKit` + existing extensions. |
| Form card sections (SaaS UI) | Tailwind + existing design tokens | `bg-white border border-[#E5E7EB] rounded-xl p-6` card sections. Matches existing admin UI patterns. framer-motion (already installed) for any collapse animations. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-lite-youtube-embed` | `^3.5.0` | YouTube lazy embed | When `lesson.platform === 'youtube'` in lesson renderer |
| `react-h5-audio-player` | `^3.10.2` | Audio lesson playback | When `lesson.lesson_type === 'audio'` in lesson renderer |

---

## Installation

```bash
# New additions only — everything else already installed
npm install react-lite-youtube-embed react-h5-audio-player
```

No dev dependency changes needed.

---

## Integration Notes

### react-lite-youtube-embed

Requires a CSS import. Add at the component file level:

```typescript
import LiteYouTubeEmbed from 'react-lite-youtube-embed';
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
```

Extract the YouTube video ID from the URL before passing — the `id` prop takes the bare ID, not the full URL. Same regex approach already used for Vimeo in `lesson/page.tsx`:

```typescript
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
}

// Render:
<LiteYouTubeEmbed id={youtubeId} title={lesson.title} />
```

### react-h5-audio-player

Requires a CSS import. Add at the component file level:

```typescript
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
```

Override theme variables in `globals.css` to match GOYA design tokens:

```css
:root {
  --rhap_theme-color: #4E87A0;
  --rhap_background-color: #F9FAFB;
  --rhap_bar-color: #E5E7EB;
}
```

Key props: `src` (audio URL), `autoPlay={false}`, `showSkipControls={false}`.

### Duration Slider

Render as a native range input. Store as integer minutes in the DB — sortable, filterable, and no string parsing:

```typescript
// minutes 5–300, step 5
<input
  type="range" min={5} max={300} step={5}
  value={durationMinutes}
  onChange={e => setDurationMinutes(Number(e.target.value))}
  className="w-full accent-[#4E87A0]"
/>
<span className="text-sm text-[#6B7280]">
  {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
</span>
```

The existing `duration` text field in `CourseForm.tsx` should be replaced with `duration_minutes` integer in the DB migration.

### Drag-and-Drop Lesson Ordering

Lessons need an `order_index` integer column. On drag end, use `arrayMove` from `@dnd-kit/sortable` to reorder local state, then batch-update affected rows via a server action. Follow the same pattern used in admin products:

```typescript
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { DndContext, closestCenter, PointerSensor, useSensor } from '@dnd-kit/core';
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `react-lite-youtube-embed` | Raw `<iframe src="youtube.com/embed/...">` | Raw iframe loads the full YouTube IFrame API JS (~500KB) immediately on mount, wrecking Lighthouse performance score. The lite embed defers the full iframe until click. |
| `react-lite-youtube-embed` | `react-youtube` | `react-youtube` loads the full IFrame API on mount — same performance problem. Also heavier (no thumbnail-first approach). |
| `react-h5-audio-player` | Native `<audio>` element | Native `<audio>` styling is deeply inconsistent across Safari/Chrome/Firefox. Building a consistent UI with progress bar, volume, and time display requires significant CSS and JS. Not worth it for one lesson type. |
| `react-h5-audio-player` | `wavesurfer.js` | WaveSurfer draws a waveform visualization using canvas — adds ~40KB and canvas rendering. Overkill for podcast-style audio lessons. |
| Native `<input type="range">` | `rc-slider` / `@radix-ui/react-slider` | A single-thumb duration slider doesn't need a component library. Tailwind v4 `accent-*` utility and arbitrary pseudo-element variants are sufficient. Adding a dependency here is not justified. |
| `@dnd-kit/sortable` (existing) | `react-beautiful-dnd` | react-beautiful-dnd is deprecated and unmaintained. @dnd-kit is the modern replacement and is already installed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `react-player` | Kitchen-sink library (~80KB) wrapping YouTube, Vimeo, SoundCloud, etc. We only need two platforms and already have working Vimeo iframe code. Overkill. | Platform-specific: raw `<iframe>` for Vimeo, `react-lite-youtube-embed` for YouTube |
| `@vimeo/player` JS SDK | Adds ~30KB for programmatic playback control events we do not need. The lesson page displays video, it does not need to seek or inspect player state. | Raw `<iframe>` (already working, zero cost) |
| `@dnd-kit/react` (new next-gen package) | The `@dnd-kit/react` package is a beta rewrite, not production stable. GitHub issues #1664 and #1695 report broken `onDragEnd` event detection in the new API. | `@dnd-kit/sortable` v10 (already installed, stable, tested in products admin) |
| Any external UI component library (Radix, shadcn, Headless UI) | Project uses design tokens from `globals.css` + custom components in `app/components/ui/`. Adding an external component library introduces style conflicts and import bloat. | Continue with existing custom component pattern |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `react-lite-youtube-embed@3.5.0` | React 19.2.3, Next.js 16 | Confirmed React 19 compatible. Released Feb 2026. |
| `react-h5-audio-player@3.10.2` | React 19.2.3 | Latest release Mar 2026; TypeScript, modern React patterns. |
| `@dnd-kit/sortable@10.0.0` | React 19.2.3 | Already installed and used in products admin. No upgrade needed. |

---

## Sources

- [react-lite-youtube-embed GitHub](https://github.com/ibrahimcesar/react-lite-youtube-embed) — version 3.5.0, React 19 compat, props API (HIGH confidence)
- [react-h5-audio-player GitHub](https://github.com/lhz516/react-h5-audio-player) — version 3.10.2, CSS import requirement, key props (HIGH confidence)
- [npm: @dnd-kit/sortable](https://www.npmjs.com/package/@dnd-kit/sortable) — v10.0.0 current, verticalListSortingStrategy confirmed (HIGH confidence)
- [Next.js Guides: Videos](https://nextjs.org/docs/app/guides/videos) — YouTube iframe embed best practice, performance considerations (HIGH confidence)
- Existing codebase: `app/admin/products/AdminProductsClient.tsx` (dnd-kit usage), `app/academy/[id]/lesson/page.tsx` (Vimeo iframe pattern), `app/admin/courses/components/CourseForm.tsx` (form patterns) — verified directly (HIGH confidence)

---

*Stack research for: GOYA v2 — v1.15 Course System Redesign*
*Researched: 2026-04-01*
