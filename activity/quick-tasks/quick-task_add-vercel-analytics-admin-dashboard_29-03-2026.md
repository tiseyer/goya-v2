# Quick Task: Add Vercel Analytics Section to Admin Dashboard

**Date:** 2026-03-29
**Task ID:** 260329-rwg
**Status:** Done

## Task Description

Add a live Vercel Analytics section to the admin dashboard showing website traffic metrics — visitors, page views, top pages, and top countries — with 60-second auto-refresh.

## Solution

**New files:**
- `app/api/admin/analytics/route.ts` — Server-side proxy to Vercel's internal analytics API, protected by admin/moderator role check. Returns visitors + page views for today and last 7 days, top 5 pages, top 5 countries. Gracefully handles missing env vars (503) and partial API failures.
- `app/admin/dashboard/AnalyticsSection.tsx` — Client component with 60s polling, loading skeleton, error/not-configured states, and stat cards matching the existing dashboard design.

**Modified files:**
- `app/admin/dashboard/page.tsx` — Imported and inserted `AnalyticsSection` as Row 2 between User Stats and Platform sections.

## Required Environment Variables

- `VERCEL_ACCESS_TOKEN` — Vercel personal access token
- `VERCEL_PROJECT_ID` — Vercel project ID

Without these, the section shows a "not configured" message instead of crashing.

## Commits

- `001ed8b` — feat(260329-rwg): add analytics API route with Vercel Web Analytics proxy
- `1af9367` — feat(260329-rwg): add AnalyticsSection client component to admin dashboard
