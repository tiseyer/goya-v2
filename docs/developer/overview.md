---
title: Developer Guide Overview
audience: ["developer"]
section: developer
order: 1
last_updated: "2026-03-31"
---

# Developer Guide Overview

This guide covers everything you need to build, run, and contribute to GOYA v2 — the platform for the Global Online Yoga Association.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure at a Glance](#project-structure-at-a-glance)
- [Key Conventions](#key-conventions)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Database + Auth | Supabase (PostgreSQL + RLS) | ^2.95 |
| File Storage | Supabase Storage | — |
| Email | Resend | ^6.9 |
| Payments | Stripe | ^20.4 |
| Deployment | Vercel | — |
| AI / Chatbot | Anthropic Claude SDK + OpenAI | — |
| Testing | Vitest + Testing Library | ^2.1 |
| Rich Text | Tiptap | ^3.20 |
| Charts | Recharts | 3.8 |
| Maps | Mapbox GL | ^3.20 |

---

## Prerequisites

- Node.js 20+
- A Supabase project (with service role key)
- A Stripe account (with webhook endpoint configured)
- A Resend account and verified sending domain
- Vercel CLI (optional, for production deploys)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd "GOYA v2"
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SECRETS_MASTER_KEY=a-32-byte-hex-string
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

See [deployment.md](./deployment.md) for the full variable reference.

### 3. Apply database migrations

```bash
npx supabase db push
```

Always run this after pulling changes that add new migration files.

### 4. Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### 5. Lint

```bash
npm run lint
```

---

## Project Structure at a Glance

```
app/          Next.js App Router pages + API routes
lib/          Shared server-side utilities (Supabase, Stripe, email, etc.)
supabase/     Database migrations and schema
types/        Generated Supabase TypeScript types
public/       Static assets
__tests__     Vitest unit tests
```

See [architecture.md](./architecture.md) for the full annotated directory tree.

---

## Key Conventions

- **Server Components by default.** Only add `'use client'` when you need interactivity, browser APIs, or React hooks.
- **Server Actions for mutations.** Form submissions and data writes use Server Actions (`'use server'`), not client-side fetch to API routes.
- **`PageContainer` for layout width.** Every page content section must use `app/components/ui/PageContainer.tsx` to stay aligned with the header and footer. Never hardcode `max-width` or horizontal padding on pages.
- **Supabase migrations only.** All schema changes go through `supabase/migrations/`. Never modify the database manually.
- **Run `npx supabase db push` after every migration file.**

---

## See Also

- [architecture.md](./architecture.md) — Annotated folder tree and key patterns
- [database-schema.md](./database-schema.md) — All tables and RLS policies
- [authentication.md](./authentication.md) — Auth flow and role system
- [contributing.md](./contributing.md) — Code conventions and PR process
