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

## 2. Tabs

**Standard: Pill/Capsule Style** — used across ALL admin and settings pages.

```html
<!-- Container -->
<div class="flex bg-slate-100 rounded-lg p-1 overflow-x-auto">
  <!-- Active tab -->
  <button class="px-4 py-2 text-sm font-medium rounded-md bg-white text-[#1B3A5C] shadow-sm">
    Active Tab
  </button>
  <!-- Inactive tab -->
  <button class="px-4 py-2 text-sm font-medium rounded-md text-slate-500 hover:text-slate-700">
    Inactive Tab
  </button>
</div>
```

Count badges on tabs (e.g. Inbox): `bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full px-1.5 min-w-[18px]`

> **Rule:** Never use underline-style tabs. All tab navigation uses pill/capsule style.

---

## 3. Badge System — Semantic Colors

### Status Badges (semantic meaning)

| Status | Classes | Used for |
|--------|---------|----------|
| **Green** | `bg-emerald-50 text-emerald-700` | Active, Published, Approved, Connected, On Track, Free |
| **Amber** | `bg-amber-50 text-amber-700` | Pending, Draft, Warning, Expiring Soon |
| **Red** | `bg-red-50 text-red-700` | Rejected, Cancelled, Error, Needs Attention, Deleted |
| **Gray** | `bg-slate-100 text-slate-600` | Inactive, Guest, System, No Requirements, Default |
| **Blue** | `bg-blue-50 text-blue-700` | Informational only (categories, types, labels) |

### Category Badges

ALL category labels (event categories, course categories, member types in verification, audit log categories) use **blue** (`bg-blue-50 text-blue-700`). Categories are informational, not status.

### Role Badges

| Role | Classes | Rationale |
|------|---------|-----------|
| Teacher | `bg-teal-100 text-teal-700` | Primary elevated role |
| Student | `bg-slate-100 text-slate-600` | Default/base role |
| Wellness Practitioner | `bg-blue-100 text-blue-700` | Informational |
| School | `bg-blue-100 text-blue-700` | Informational |
| Admin | `bg-red-100 text-red-700` | Elevated/dangerous |
| Moderator | `bg-amber-100 text-amber-700` | Elevated |

### Badge Component

All badges live in `app/components/ui/Badge.tsx`. Import the record maps — never re-define colour maps inline.

```ts
import Badge, {
  ROLE_BADGE,      // member role → className string
  CATEGORY_BADGE,  // event/course category → className string
  CATEGORY_DOT,    // category → dot bg class (for sidebar dots)
  FORMAT_BADGE,    // event format → className string
} from '@/app/components/ui/Badge';
```

> **Rule:** Never define per-file `CATEGORY_STYLES`, `CATEGORY_COLORS`, `ROLE_STYLES` maps with rainbow colours.

---

## 4. Primary Action Buttons (CTAs)

### Top-right create/add button (admin list pages)

```html
<button class="flex items-center gap-2 bg-primary text-white hover:bg-primary-dark px-4 py-2 text-sm font-semibold rounded-lg transition-colors">
  <PlusIcon /> Create Item
</button>
```

Every admin list page where creation is possible MUST have this button.

### CTA button (secondary)

```html
<button class="border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-4 py-2 text-sm font-semibold">
```

### Link / text action

```
text-primary-light hover:text-primary-dark font-semibold transition-colors
```

---

## 5. Cards

### Standard card

```html
<div class="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
```

Used for: all admin tables, settings sections, content cards.

### Danger zone card

```html
<div class="rounded-xl border-2 border-red-100 bg-red-50/20 p-6">
```

> **Rule:** `rounded-xl` for ALL cards. Never `rounded-2xl` or `rounded-lg` for page-level cards.
> Modals may use `rounded-2xl`.

---

## 6. Destructive Actions

### In table rows: Icon-only trash

```html
<button class="p-1 text-slate-400 hover:text-red-500 transition-colors">
  <TrashIcon class="w-4 h-4" />
</button>
```

### In modals/forms: Outlined red button

```html
<button class="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm font-medium">
  Delete
</button>
```

### In bulk action bars: Solid red button

```html
<button class="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-1.5 text-sm font-medium">
  Delete Selected
</button>
```

### Confirmation dialogs

Keep existing modal/inline confirmation patterns — only standardize the trigger buttons.

> **Rule:** Never use standalone red text "Delete" links in table rows.
> **Rule:** Revoke actions use a slash/ban icon, same gray→red hover pattern.

---

## 7. Empty States

```html
<div class="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
  <svg class="w-10 h-10 mx-auto text-slate-300 mb-3"><!-- contextual icon --></svg>
  <p class="text-sm font-medium text-[#374151]">No items found</p>
  <p class="text-xs text-[#6B7280] mt-1">Try adjusting your filters.</p>
</div>
```

---

## 8. Typography

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

## 9. Spacing & Layout

- **Max content width:** `max-w-7xl` (pages), `max-w-5xl` (detail pages), `max-w-3xl` (legal/prose)
- **Page padding:** `px-4 sm:px-6 lg:px-8`
- **Page top spacing:** `py-10` (list), `py-14 pb-24` (prose)
- **Card radius:** `rounded-xl`
- **Button radius:** `rounded-xl` (primary), `rounded-lg` (admin CTA), `rounded-full` (pill/badge)
- **Spacing scale:** 4/8/12/16/20/24/32/40/48 (multiples of 4)

---

## 10. Shadows

Defined in `globals.css` as custom shadow tokens:

| Token          | Usage                          |
|----------------|--------------------------------|
| `shadow-soft`  | Default card shadow            |
| `shadow-card`  | Elevated card shadow           |
| `shadow-elevated` | Modals, sticky sidebars     |

Use Tailwind's `shadow-sm`, `shadow-md`, `shadow-lg` for standard utility shadows.

---

## 11. Semantic Level Colors (Exception)

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

## 12. Anti-Patterns

- **Never** define per-file `CATEGORY_STYLES`, `CATEGORY_COLORS`, `ROLE_STYLES` maps with rainbow colours.
- **Never** use raw hex in `className` strings (e.g. `text-[#1B3A5C]`) for new components.
- **Never** use `bg-teal-*`, `bg-purple-*`, `bg-orange-*`, `bg-pink-*`, `bg-indigo-*` for category badges.
- **Never** use underline-style tabs — always pill/capsule.
- **Never** use `rounded-2xl` for page-level cards — always `rounded-xl`.
- **Never** use text "Delete" links in table rows — always icon-only trash.
- **Always** import badge maps from `@/app/components/ui/Badge`.
- **Always** use `PageHero` for page-level hero sections.
- **Always** use `bg-primary text-white hover:bg-primary-dark` for admin CTA buttons.
