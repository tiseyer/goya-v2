# GOYA Design System — Master Reference

> Single source of truth for all visual decisions in the GOYA v2 platform.
> All components and pages must derive their colours, spacing, and typography
> from these tokens — never from raw hex values.

---

## 1. Brand Color Tokens

Defined in `app/globals.css` and exposed as Tailwind utilities via `@theme inline`.

### Primary Blue Family (main palette)

| Token class        | CSS variable              | Hex value  | Usage                                    |
|--------------------|---------------------------|------------|------------------------------------------|
| `primary-50`       | `--goya-primary-50`       | `#eef4f9`  | Subtle badge backgrounds, hover fills    |
| `primary-100`      | `--goya-primary-100`      | `#d6e7f1`  | Badge backgrounds (medium)               |
| `primary-200`      | `--goya-primary-200`      | `#afd0e4`  | Muted text on dark surfaces, decorative  |
| `primary`          | `--goya-primary`          | `#345c83`  | Interactive elements, links, active tabs |
| `primary-light`    | `--goya-primary-light`    | `#4e87a0`  | CTA buttons, highlights, icon accents    |
| `primary-dark`     | `--goya-primary-dark`     | `#1e3a52`  | Headings, hero backgrounds, date blocks  |

### Accent Red Family (use sparingly)

| Token class   | Hex value  | Usage                              |
|---------------|------------|------------------------------------|
| `accent-50`   | `#fef2f2`  | Admin badge background             |
| `accent`      | `#831618`  | Admin badge text, destructive CTAs |
| `accent-light`| `#a91c1f`  | Hover state for destructive        |

### Surface & Border

| Token class      | Hex value  | Usage                      |
|------------------|------------|----------------------------|
| `surface`        | `#ffffff`  | Card/panel backgrounds     |
| `surface-muted`  | `#f8f9fa`  | Page background            |

> **Rule:** Never use raw hex values in component className strings.
> Map every colour to a token above, a Tailwind slate/slate scale, or an opacity
> modifier of a token (e.g. `bg-primary-light/10`).

---

## 2. Badge System

All badges live in `app/components/ui/Badge.tsx`. Import the record maps — never re-define colour maps inline.

### Available Exports

```ts
import Badge, {
  ROLE_BADGE,      // member role → className string
  CATEGORY_BADGE,  // event/course category → className string
  CATEGORY_DOT,    // category → dot bg class (for sidebar dots)
  FORMAT_BADGE,    // event format → className string
} from '@/app/components/ui/Badge';
```

### ROLE_BADGE keys
`Teacher` · `School` · `Student` · `Wellness` · `Moderator` · `Admin`

> **Note:** member role `'Wellness Practitioner'` maps to the `'Wellness'` key.
> Use a helper: `ROLE_BADGE[role] ?? ROLE_BADGE['Wellness']`

### CATEGORY_BADGE keys
`Workshop` · `Teacher Training` · `Dharma Talk` · `Conference` · `Yoga Sequence` · `Music Playlist` · `Research`

### FORMAT_BADGE keys
`Online` · `In Person` · `Hybrid`

### Badge Component Props
```ts
<Badge variant="default|solid|subtle|outline|muted" size="sm|md">
  Label
</Badge>
```

---

## 3. Typography

Font family set in `globals.css` via `--font-sans` (Geist Sans) and `--font-mono` (Geist Mono).

| Use case              | Classes                               |
|-----------------------|---------------------------------------|
| Page hero heading     | `text-4xl sm:text-5xl font-black`     |
| Section heading       | `text-xl font-bold text-primary-dark` |
| Card title            | `text-sm font-semibold text-primary-dark` |
| Body / description    | `text-sm text-slate-700 leading-relaxed` |
| Caption / meta        | `text-xs text-slate-400`              |
| Label / badge text    | `text-[10px] font-semibold uppercase tracking-widest` |
| Monospace (IDs, code) | `font-mono tabular-nums`              |

---

## 4. Spacing & Layout

- **Max content width:** `max-w-7xl` (pages), `max-w-5xl` (detail pages), `max-w-3xl` (legal/prose)
- **Page padding:** `px-4 sm:px-6 lg:px-8`
- **Page top spacing:** `py-10` (list), `py-14 pb-24` (prose)
- **Card radius:** `rounded-2xl`
- **Button radius:** `rounded-xl` (primary), `rounded-full` (pill/badge)
- **Spacing scale:** 4/8/12/16/20/24/32/40/48 (multiples of 4)

---

## 5. Shadows

Defined in `globals.css` as custom shadow tokens:

| Token          | Usage                          |
|----------------|--------------------------------|
| `shadow-soft`  | Default card shadow            |
| `shadow-card`  | Elevated card shadow           |
| `shadow-elevated` | Modals, sticky sidebars     |

Use Tailwind's `shadow-sm`, `shadow-md`, `shadow-lg` for standard utility shadows.

---

## 6. Component Patterns

### Cards
```html
<div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
```

### Hero sections
Use `<PageHero pill="..." title="..." subtitle="..." />` — never inline hero divs.
The component handles the `bg-primary-dark` background, dot texture, and glow.

### Active filter / selected state
```
bg-primary-dark text-white   ← selected pill/button
bg-primary-light/8 border-primary-light  ← highlighted row
```

### CTA button (primary)
```
bg-primary-light hover:bg-primary active:bg-primary-dark text-white font-bold rounded-xl
```

### CTA button (secondary)
```
border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl
```

### Link / text action
```
text-primary-light hover:text-primary-dark font-semibold transition-colors
```

---

## 7. Semantic Level Colors (Exception)

These are **not** part of the GOYA blue family but are semantically meaningful and permitted:

| Meaning       | Color classes                                   | Usage                        |
|---------------|-------------------------------------------------|------------------------------|
| Free / success | `bg-emerald-50 text-emerald-700 border-emerald-200` | Free event/course badge  |
| Warning / low stock | `text-amber-500`                          | "Spots remaining" warning    |
| Course level: Beginner | `text-emerald-500`                   | Course level indicator       |
| Course level: Intermediate | `text-amber-500`               | Course level indicator       |
| Course level: Advanced | `text-rose-500`                    | Course level indicator       |

> All other UI chrome, badges, and interactive elements use the primary blue family only.

---

## 8. Anti-Patterns

- **Never** define per-file `CATEGORY_STYLES`, `CATEGORY_COLORS`, `ROLE_STYLES` maps with rainbow colours.
- **Never** use raw hex in `className` strings (e.g. `text-[#1B3A5C]`).
- **Never** use `bg-teal-*`, `bg-purple-*`, `bg-orange-*`, `bg-pink-*`, `bg-indigo-*` for role/category UI.
- **Always** import badge maps from `@/app/components/ui/Badge`.
- **Always** use `PageHero` for page-level hero sections.
