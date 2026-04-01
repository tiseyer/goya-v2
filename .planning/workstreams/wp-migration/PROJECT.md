# WP Migration

## What This Is

A complete migration pipeline to move ~4000 users from the existing WordPress/BuddyBoss GOYA site into GOYA v2 (Supabase). Includes a WordPress export plugin, a Node.js import script, a password reset flow for migrated users, and an admin migration page for running imports via the UI.

## Core Value

Every existing GOYA member can seamlessly transition to GOYA v2 with their profile data, subscriptions, and Stripe billing intact — requiring only a one-time password reset.

## Current Milestone: v1.0 WP Migration

**Goal:** Build the full export→import→password-reset pipeline so admins can migrate all WordPress users to GOYA v2.

**Target features:**
- WordPress export plugin (read-only, chunked JSON export)
- Node.js import script with skip/overwrite modes
- Dummy test data for validation
- Password reset flow for migrated users
- Admin migration page with live progress

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] WordPress export plugin with chunked JSON output
- [ ] Import script with skip/overwrite modes and Stripe mapping
- [ ] Dummy test data (25 users) with import verification
- [ ] Password reset interception for migrated users
- [ ] Admin migration page with upload, progress, and error display

### Out of Scope

- Media/image migration (avatars are URL references only)
- BuddyBoss group/forum data migration
- WooCommerce order history (only active subscriptions)
- Automated scheduling of migration runs

## Context

- Source: WordPress + BuddyBoss + WooCommerce + Stripe
- Target: Supabase (auth + profiles + subscriptions)
- ~4000 users to migrate
- BuddyBoss xprofile fields are the primary profile data source
- Stripe customer/subscription IDs must be preserved for billing continuity
- Existing MRN generation logic must be used for new users

## Constraints

- **Read-only WP plugin**: Zero writes to WordPress database
- **Supabase service role**: Import uses service role key for admin operations
- **Data sensitivity**: migration/*.json in .gitignore (contains real user data)
- **No auth breakage**: Existing GOYA v2 users must not be affected

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Chunked export | WordPress may timeout on 4000+ users | — Pending |
| Skip/overwrite modes | Safe re-runs without duplicates | — Pending |
| Temp password + reset flow | Can't migrate WP password hashes to Supabase | — Pending |
| Server-side admin import | Avoids exposing service role key to client | — Pending |

---
*Last updated: 2026-03-27 after v1.0 WP Migration milestone started*
