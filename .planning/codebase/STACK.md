# Technology Stack

**Analysis Date:** 2026-03-23

## Languages

**Primary:**
- TypeScript 5.x — All application code (`app/`, `lib/`, `middleware.ts`)
- TSX — React component files throughout `app/`

**Secondary:**
- SQL — Supabase migrations in `supabase/migrations/` and `supabase/schema.sql`

## Runtime

**Environment:**
- Node.js (via Next.js 16) — Server-side rendering, API routes, server actions
- Edge Runtime — `middleware.ts` runs on Vercel Edge

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js 16.1.6 — App Router, server components, server actions, API routes
- React 19.2.3 — UI rendering (`react-dom` 19.2.3)

**Styling:**
- Tailwind CSS 4.x — Utility-first CSS via `@tailwindcss/postcss`
- PostCSS — Config at `postcss.config.mjs`

**Rich Text:**
- Tiptap 3.20.4 — Rich text editor with extensions: color, link, placeholder, text-align, text-style, underline, starter-kit

**Email Templates:**
- `@react-email/components` 1.0.10 — React components for email layout
- `@react-email/render` 2.0.4 — Render React email templates to HTML

**Testing:**
- Vitest 2.1.9 — Test runner, config at `vitest.config.ts` (jsdom environment)
- `@testing-library/react` 15.0.7 — Component testing utilities
- `@testing-library/jest-dom` 6.4.5 — DOM assertion matchers
- jsdom 25.0.1 — DOM environment for tests

**Build/Dev:**
- `eslint` 9.x with `eslint-config-next` 16.1.6 — Linting, config at `eslint.config.mjs`
- TypeScript compiler — Config at `tsconfig.json` (strict mode, ES2017 target, bundler module resolution)

## Key Dependencies

**Critical:**
- `next` 16.1.6 — Core framework
- `react` / `react-dom` 19.2.3 — UI library
- `@supabase/supabase-js` 2.95.2 — Supabase database/auth client
- `@supabase/ssr` 0.8.0 — Supabase SSR helpers for Next.js (cookie-based session management)
- `resend` 6.9.4 — Email delivery service
- `mapbox-gl` 3.20.0 — Interactive maps
- `date-fns` 4.1.0 — Date utility library
- `@vercel/analytics` 2.0.1 — Vercel Analytics integration

**Rich Text (Tiptap):**
- `@tiptap/react` 3.20.4
- `@tiptap/starter-kit` 3.20.4
- `@tiptap/extension-color` 3.20.4
- `@tiptap/extension-link` 3.20.4
- `@tiptap/extension-placeholder` 3.20.4
- `@tiptap/extension-text-align` 3.20.4
- `@tiptap/extension-text-style` 3.20.4
- `@tiptap/extension-underline` 3.20.4

**Email:**
- `@react-email/components` 1.0.10
- `@react-email/render` 2.0.4

## Dev Dependencies

- `tailwindcss` 4.x + `@tailwindcss/postcss` 4.x — Styling
- `typescript` 5.x — TypeScript compiler
- `@types/node` 20.x, `@types/react` 19.x, `@types/react-dom` 19.x — Type definitions
- `vitest` 2.1.9 — Test runner
- `jsdom` 25.0.1 — DOM simulation for tests
- `eslint` 9.x + `eslint-config-next` 16.1.6 — Linting

## Configuration

**Path Aliases:**
- `@/*` maps to `./` (project root) — defined in `tsconfig.json`

**TypeScript:**
- Strict mode enabled
- Target: ES2017
- Module resolution: `bundler`
- JSX: `react-jsx`

**Build:**
- `next.config.ts` — Minimal config; remote image patterns allow `i.pravatar.cc` (avatar placeholders)

## Platform Requirements

**Development:**
- Node.js (Next.js 16 compatible version)
- Supabase CLI for migrations (`npx supabase db push`)

**Production:**
- Deployed to Vercel
- Vercel Edge Runtime for middleware
- Vercel Cron Jobs for scheduled tasks (configured in `vercel.json`)

---

*Stack analysis: 2026-03-23*
