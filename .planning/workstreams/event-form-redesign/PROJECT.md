# Event Form Redesign — Workstream

## What This Is

Redesign and extend the Admin/Member Event creation/edit form (`app/admin/events/components/EventForm.tsx`) with modern SaaS 2026 UI and new capabilities for multi-day events, location services, organizer management, and registration control.

## Core Value

Event creators get a polished, intuitive form that supports the full range of event types — from single online workshops to multi-day in-person conferences with multiple organizers.

## Current Milestone: v1.11 Event Form Redesign

**Goal:** Ship a modern, feature-complete event form with new database columns, Google Places integration, organizer search, and role-aware status management.

**Target features:**
- Modern card-based form UI with GOYA design system consistency
- Multi-day event support (end date, all-day toggle)
- Format-conditional location (Google Places for in-person, online platform for virtual)
- Registration required toggle (conditionally shows price/spots fields)
- Organizer system (up to 5, member search, removable avatar chips)
- Role-aware status field (admin sees all, member sees draft/pending only)
- Event website URL field
- Database migrations for all new columns

## Context

- Events table exists from v1.9 with base columns (title, category, format, date, time_start, time_end, instructor, location, description, price, spots_total, spots_remaining, image_url, status, event_type, created_by)
- EventForm.tsx is used by both admin event pages and member My Events page
- Google Maps API key already configured: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- GOYA design system: primary #345c83, CSS variables in globals.css

## Key Decisions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Parallel workstream, not main milestone | Avoids blocking other work in progress | 2026-03-31 |
| 2 | CSS-only approach for new form, no new UI libraries | Consistent with existing codebase, Tailwind + GOYA tokens | 2026-03-31 |
| 3 | Google Places loaded dynamically | Avoid loading Maps JS on every page | 2026-03-31 |

Last updated: 2026-03-31
