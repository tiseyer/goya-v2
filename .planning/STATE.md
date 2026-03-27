# State

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-27 — Milestone v1.8 started

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** v1.8 AI-Support-System — AI chatbot with encrypted key management, FAQ, tool use, and escalation

## Accumulated Context

- v1.7 shipped three-tab shell at `/admin/api-keys` — Third Party Keys tab is placeholder ("Coming in a future update")
- Existing encryption requirement from v1.7: SECRETS_MASTER_KEY for AES-256
- Admin inbox at `/admin/inbox` has School Registrations and Teacher Upgrades tabs
- REST API has 49 endpoints across 10 resource categories — chatbot tools can leverage these
- Per-route auth composition pattern: middleware.ts excludes /api/, handlers validate explicitly
