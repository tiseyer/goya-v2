# Quick Task: Maintenance Controls

**Date:** 2026-04-01
**Status:** Complete

## Description

Extend the Maintenance tab in admin settings with Flows Sandbox, Credit Hours Sandbox, Theme Lock, and Page Visibility controls.

## Solution

### New Sections in Maintenance Tab
1. **Flows Sandbox** — toggle to hide flows from non-admin users. Gated in `/api/flows/active` route.
2. **Credit Hours Sandbox** — toggle to hide credit submissions from non-admin users. Gated in `/credits` and `/teaching-hours` server components.
3. **Theme Lock** — dropdown to force Light/Dark theme for non-admin users. Theme toggle hidden when locked. Uses `useThemeLock` hook.
4. **Page Visibility** — per-page enable/disable with configurable fallback redirects. Enforced in middleware with 60s cache and loop protection.

### Implementation Details
- All settings stored in `site_settings` table (upsert pattern)
- Flows sandbox: checks `flows_sandbox` in `/api/flows/active` — returns `null` for non-admins when active
- Credit hours sandbox: checks `credit_hours_sandbox` in server components — redirects to `/dashboard`
- Theme lock: `useThemeLock` hook with 60s client-side cache, `ThemeCards` and `ThemeInline` accept `isAdmin` prop
- Page visibility: middleware cache (60s TTL), fallback chain with loop protection, admins bypass

## Files Changed

- `app/admin/settings/components/MaintenanceTab.tsx` (modified) — 4 new sections
- `middleware.ts` (modified) — page visibility cache + redirect logic
- `app/api/flows/active/route.ts` (modified) — flows sandbox check
- `app/components/ThemeToggle.tsx` (modified) — theme lock support, `isAdmin` prop
- `app/components/Header.tsx` (modified) — pass `isAdmin` to `ThemeInline`
- `app/settings/page.tsx` (modified) — pass `isAdmin` to `ThemeCards`
- `app/credits/page.tsx` (modified) — credit hours sandbox redirect
- `app/teaching-hours/page.tsx` (modified) — credit hours sandbox redirect
- `lib/hooks/useThemeLock.ts` (new) — client-side theme lock hook with cache
- `lib/site-settings.ts` (new) — server-side site settings reader
- `docs/admin/settings.md` (modified) — documented all new sections
