# Roadmap: WP Migration (v1.0)

## Overview

Build a complete WordPress-to-Supabase user migration pipeline. Phase 1 creates the WordPress export plugin (PHP, read-only). Phase 2 builds the Node.js import script with dummy test data and infrastructure (gitignore, README, migration column). Phase 3 adds the password reset flow for migrated users. Phase 4 builds the admin migration page for running imports via the UI.

## Phases

- [x] **Phase 1: WP Export Plugin** - Self-contained WordPress plugin that exports user data as chunked JSON
- [x] **Phase 2: Import Script & Test Data** - Node.js import script with skip/overwrite modes, dummy test data, and migration infrastructure
- [x] **Phase 3: Password Reset Flow** - Middleware interception and set-password page for migrated users
- [ ] **Phase 4: Admin Migration Page** - Admin UI for uploading JSON files and running imports with live progress

## Phase Details

### Phase 1: WP Export Plugin
**Goal**: Admins can install the plugin on WordPress, navigate to Tools > GOYA Export, and download user data as chunked JSON files
**Depends on**: Nothing (standalone PHP plugin)
**Requirements**: WPEX-01, WPEX-02, WPEX-03, WPEX-04, WPEX-05, WPEX-06, WPEX-07, WPEX-08, WPEX-09, WPEX-10
**Success Criteria** (what must be TRUE):
  1. Plugin file exists at migration/wp-goya-exporter/wp-goya-exporter.php and is a valid WordPress plugin (has plugin header)
  2. Export produces valid JSON with all specified fields per user (core WP, BuddyBoss xprofile, avatar URL, WooCommerce subscriptions with Stripe IDs)
  3. Chunk export produces correctly named files (goya-export-chunk-{offset}-{limit}.json)
  4. Plugin performs zero writes to the WordPress database
**Plans:** 2 plans
Plans:
- [x] 01-01-PLAN.md — Plugin scaffold, admin page, core WP user export with chunking and filters
- [x] 01-02-PLAN.md — BuddyBoss xprofile, avatar URL, and WooCommerce subscription enrichment

### Phase 2: Import Script & Test Data
**Goal**: Admins can run the CLI import script against exported JSON files and see users created in Supabase with correct profiles, roles, MRNs, and subscription data
**Depends on**: Phase 1 (needs export format)
**Requirements**: IMPT-01, IMPT-02, IMPT-03, IMPT-04, IMPT-05, IMPT-06, IMPT-07, IMPT-08, IMPT-09, IMPT-10, IMPT-11, IMPT-12, TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, INFR-01, INFR-02, INFR-03
**Success Criteria** (what must be TRUE):
  1. `npx tsx migration/import-users.ts --file=migration/dummy-users.json --mode=skip` imports at least 20 of 25 dummy users
  2. Imported users have correct roles (student/teacher/wellness_practitioner/admin), MRNs, and profile data in Supabase
  3. Skip mode skips existing emails without error; overwrite mode updates profile data only
  4. Migration log JSON file is produced with per-user results
  5. migration/*.json is in .gitignore and migration/README.md documents the full pipeline
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Infrastructure (gitignore, Supabase migration, README) and 25 dummy test users
- [x] 02-02-PLAN.md — Import script with skip/overwrite modes, field mapping, and test run

### Phase 3: Password Reset Flow
**Goal**: Migrated users are redirected to set a new password on first login before accessing any other page
**Depends on**: Phase 2 (needs requires_password_reset column and imported users)
**Requirements**: PWRS-01, PWRS-02, PWRS-03, PWRS-04, PWRS-05
**Success Criteria** (what must be TRUE):
  1. User with requires_password_reset: true is redirected to /account/set-password from any route
  2. Set-password page matches auth page style (centered card, GOYA logo)
  3. Submitting new password updates Supabase auth, clears the flag, and redirects to dashboard
  4. Auth routes and /account/set-password are exempt from the redirect
**Plans:** 1 plan
Plans:
- [x] 03-01-PLAN.md — Middleware interception, set-password page with server action, and end-to-end verification
**UI hint**: yes

### Phase 4: Admin Migration Page
**Goal**: Admins can upload exported JSON files, run imports with live progress, and download migration logs — all from the admin panel
**Depends on**: Phase 2 (uses import logic server-side)
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07
**Success Criteria** (what must be TRUE):
  1. /admin/migration page is accessible from admin sidebar under Settings
  2. Admin can upload JSON file(s), select mode, and click Start Import
  3. Live progress shows processing count, success/skipped/error counts
  4. Error list shows failed emails with reasons; migration log is downloadable
**Plans:** 2 plans
Plans:
- [ ] 04-01-PLAN.md — Extract shared import module + POST /api/admin/migration/import API route
- [ ] 04-02-PLAN.md — Admin migration page UI with upload, progress, errors, log download + sidebar link
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. WP Export Plugin | 2/2 | Complete | 2026-03-27 |
| 2. Import Script & Test Data | 2/2 | Complete | 2026-03-27 |
| 3. Password Reset Flow | 1/1 | Complete | 2026-03-27 |
| 4. Admin Migration Page | 0/2 | In progress | - |
