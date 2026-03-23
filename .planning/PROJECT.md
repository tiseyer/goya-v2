# GOYA v2

## What This Is

GOYA v2 is a professional community platform for yoga and wellness practitioners — teachers, students, and wellness practitioners. Members can connect with peers, attend events, complete CPD-accredited courses, track credits, and manage their professional profile and subscriptions. Admins manage the community through a full-featured admin panel.

## Core Value

Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Current Milestone: v1.0 User Settings

**Goal:** Consolidate user-facing settings into a dedicated sidebar-navigated Settings section, improving discoverability and consistency with the existing Admin Settings pattern.

**Target features:**
- Profile dropdown refactor (add "Settings" for all users, remove scattered shortcuts)
- User Settings page at `app/settings/` with Admin Settings–style sidebar layout
- Sidebar: General (profile content), Subscriptions (subscription content), Connections (placeholder), Inbox (placeholder)

## Requirements

### Validated

<!-- Features shipped in GOYA v2 before GSD tracking began — inferred from codebase. -->

- ✓ User authentication (sign-up, sign-in, forgot/reset password, session management)
- ✓ Role-branched onboarding wizard (teacher, student, wellness practitioner paths)
- ✓ Member profiles with avatar, bio, and public profile pages
- ✓ Community dashboard with feed, posts, likes, and comments
- ✓ Member directory with map panel and connection system
- ✓ Direct messaging between members
- ✓ Events listing and detail pages
- ✓ Academy with courses, lessons, and progress tracking
- ✓ CPD credits submission and history
- ✓ Add-ons and products with cart and checkout
- ✓ Schools creation and settings
- ✓ Profile settings (name, avatar, bio)
- ✓ Subscriptions page
- ✓ Admin panel: users, events, courses, credits, verification queue, inbox, products, site settings, email templates
- ✓ Admin impersonation with audit log
- ✓ Email system with DB-driven templates and Resend delivery
- ✓ Maintenance mode (edge-cached, admin bypass)
- ✓ Analytics (GA4, Microsoft Clarity, Vercel Analytics — DB-controlled)
- ✓ Vercel cron jobs (credits expiry, admin digest)

### Active

- [ ] User can access Settings from the profile dropdown (all user types)
- [ ] Admin/Moderator sees "Settings" directly above "Admin Settings" in dropdown
- [ ] Regular users see "Settings" between the two dropdown dividers
- [ ] Settings page has sidebar layout matching Admin Settings
- [ ] Settings > General shows existing profile settings content
- [ ] Settings > Subscriptions shows existing subscriptions content
- [ ] Settings > Connections is a placeholder page
- [ ] Settings > Inbox is a placeholder page

### Out of Scope

- Connections settings implementation — deferred to Task 2 (placeholder only this milestone)
- Inbox settings implementation — deferred to Task 2 (placeholder only this milestone)

## Context

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase (auth + DB), Vercel
- Admin Settings sidebar pattern exists at `app/admin/settings/` using `AdminShell.tsx` — User Settings should mirror this UX
- Profile settings currently live at `app/profile/settings/` — content moves to `app/settings/general/`
- Subscriptions content currently lives in its own route — moves to `app/settings/subscriptions/`
- Design tokens live in `globals.css`; UI components in `app/components/ui/`
- Role system: `student`, `teacher`, `wellness_practitioner` (regular), `moderator`, `admin`

## Constraints

- **Tech Stack**: Next.js 16 App Router, Tailwind CSS 4, Supabase SSR — no new frameworks
- **Design**: Follow existing design tokens from `globals.css` and components from `app/components/ui/`; match Admin Settings layout exactly
- **Routing**: New settings at `app/settings/` — old routes (`app/profile/settings/`, etc.) should redirect or be replaced

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mirror Admin Settings sidebar pattern | Consistency across admin/user experiences | — Pending |
| `app/settings/` as root route | Clean separation from profile pages | — Pending |
| Connections + Inbox as placeholders | Scope control — full implementation in Task 2 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 — Milestone v1.0 started*
