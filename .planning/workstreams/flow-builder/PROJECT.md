# Flow Builder

## What This Is

A complete interactive flow builder system for GOYA v2 that allows admins to create conditional, multi-step user engagement flows — onboarding wizards, quizzes, notifications, popups, and banners. Flows are shown to users based on configurable triggers (login, page load, delay, scroll, exit intent) and conditions (role, onboarding status, subscription, profile completeness). Replaces the existing hardcoded onboarding system with a fully dynamic, admin-controlled alternative.

## Core Value

Admins can build and deploy any interactive user flow without developer involvement.

## Current State

**As of v1.0 start (2026-03-30):** Greenfield workstream. GOYA v2 has a hardcoded onboarding system at `app/onboarding/` with role-branched paths (student, teacher, wellness practitioner). This milestone replaces it with a generalized flow engine.

## Current Milestone: v1.0 Flow Builder

**Goal:** Build the complete flow builder system — schema, admin UI, user-facing player, actions engine, analytics, and onboarding migration.

**Target features:**
- Database schema for flows, steps, elements, branches, responses, analytics
- Admin Flow Builder UI with drag-drop editor, branch configuration, conditions builder, preview mode
- User-facing Flow Player with 5 display types and Typeform-style elements
- Actions engine (save to profile, email, Kit.com, Stripe checkout, redirect, trigger flow)
- Flow analytics dashboard
- Per-user flow management in admin
- 3 onboarding seed templates replacing hardcoded onboarding

## Requirements

### Active

See REQUIREMENTS.md for full scoped requirements with REQ-IDs.

### Out of Scope

- A/B testing between flow variants — future enhancement
- Public flow sharing / embedding on external sites
- Flow versioning / revision history
- Webhook-triggered flows (only UI triggers for v1.0)
- Multi-language / i18n for flow content

## Context

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase (auth + DB), Vercel
- Existing onboarding at `app/onboarding/` with role-branched wizard steps
- Admin panel uses AdminShell sidebar pattern at `app/admin/`
- Design tokens in `globals.css`; UI components in `app/components/ui/`
- Role system: `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`
- Kit.com integration uses KITCOM_API_KEY env var (graceful fallback if missing)
- @dnd-kit/core for drag-and-drop interactions

## Constraints

- **Tech Stack**: Next.js 16 App Router, Tailwind CSS 4, Supabase SSR — no new frameworks
- **Design**: Follow existing GOYA design tokens, teal primary, dark/light mode, Typeform-inspired choice elements
- **Admin Pattern**: Flows page follows AdminShell sidebar pattern, consistent with existing admin pages
- **Flow Conditions**: Evaluated server-side for security
- **API Routes**: Admin routes under `app/api/admin/flows/`, user routes under `app/api/flows/`

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| jsonb for step elements | Flexible schema, elements vary by type | Planned — flow_steps.elements |
| jsonb for flow conditions | Variable condition types, AND logic | Planned — flows.conditions |
| Priority as integer (lower = higher) | Simple drag-sort, consistent ordering | Planned — flows.priority |
| Pill/card style choices (Typeform) | Better UX than native radio/checkbox | Planned — FlowPlayer elements |
| 5 display types | Cover all engagement patterns | Planned — modal, fullscreen, banners, notification |
| Server-side condition evaluation | Security — prevent client-side bypass | Planned — getActiveFlowForUser |
| Replace hardcoded onboarding | Single system for all user flows | Planned — Phase 7 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-30 — v1.0 Flow Builder milestone initialized*
