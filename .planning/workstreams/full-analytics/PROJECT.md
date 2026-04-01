# Analytics & Tracking System

## What This Is

Full analytics stack for GOYA v2 — restructured admin analytics with Users tab (profile stats, growth charts), Visitors tab (GA4 Data API integration), GA4 event tracking throughout the app, and setup documentation.

## Core Value

Admins have data-driven visibility into platform health — user growth, visitor traffic, and user behavior across all key flows.

## Current Milestone: v1.18 Analytics & Tracking System

**Goal:** Build a comprehensive analytics system with real data from Supabase profiles and GA4.

**Target features:**
- Admin analytics nav restructured: Visitors → Users → Shop
- Users analytics: stat cards (by role), member growth chart with filters, recent signups table
- Visitors analytics: GA4 Data API integration, sessions/pageviews/bounce rate, traffic sources, top pages, devices
- GA4 event tracking utility with 20+ predefined events wired throughout the app
- Manual GA4 setup documentation

## Constraints

- **Tech Stack**: Next.js App Router, Supabase, recharts, @google-analytics/data
- **GA4**: Property ID from site_settings table, service account key from env var
- **Fake users**: wp_roles contains 'faux' OR 'robot' — excluded from real stats

---
*Last updated: 2026-04-01 after v1.18 milestone defined*
