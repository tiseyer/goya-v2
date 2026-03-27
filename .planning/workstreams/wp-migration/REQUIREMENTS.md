# Requirements: WP Migration

**Defined:** 2026-03-27
**Core Value:** Every existing GOYA member transitions to v2 with profile, subscriptions, and billing intact.

## v1.0 Requirements

### WP Export Plugin

- [x] **WPEX-01**: Plugin installs as standard WordPress plugin (zip-uploadable) at migration/wp-goya-exporter/
- [x] **WPEX-02**: Admin page at Tools > GOYA Export with chunk size selector (100/250/500), offset input, and export buttons
- [x] **WPEX-03**: Export Chunk button downloads JSON file named goya-export-chunk-{offset}-{limit}.json
- [x] **WPEX-04**: Export All button exports everything with slow-operation warning for 4000+ users
- [x] **WPEX-05**: Per-user JSON includes core WP fields (ID, email, display_name, first/last name, role, registered_at)
- [ ] **WPEX-06**: Per-user JSON includes all BuddyBoss xprofile fields (General, About, Practice, Teaching, School, Socials, Languages, Location)
- [ ] **WPEX-07**: Per-user JSON includes avatar URL via BuddyBoss avatar functions
- [ ] **WPEX-08**: Per-user JSON includes WooCommerce subscriptions with stripe_customer_id and stripe_subscription_id
- [x] **WPEX-09**: Plugin is read-only — zero writes to the WordPress database
- [x] **WPEX-10**: Filter options: export all / only active members / only specific roles

### Import Script

- [ ] **IMPT-01**: Node.js script at migration/import-users.ts reads exported JSON files
- [ ] **IMPT-02**: CLI supports --file (single or glob) and --mode=skip|overwrite flags
- [ ] **IMPT-03**: Skip mode: if email exists in Supabase auth, skip and log
- [ ] **IMPT-04**: Overwrite mode: if email exists, update profile and subscription data only (no auth changes)
- [ ] **IMPT-05**: New users created via supabase.auth.admin.createUser with random temp password and email_confirm: true
- [ ] **IMPT-06**: Profile upsert with all available BuddyBoss fields mapped to GOYA v2 schema
- [ ] **IMPT-07**: MRN generated using existing MRN logic with used_mrns table check
- [ ] **IMPT-08**: Role mapping: subscriber→student, teacher→teacher, wellness→wellness_practitioner, admin→admin
- [ ] **IMPT-09**: Stripe customer/subscription IDs stored in existing subscriptions table
- [ ] **IMPT-10**: requires_password_reset flag set on imported profiles (migration adds column if needed)
- [ ] **IMPT-11**: Migration log output at migration/migration-log-{timestamp}.json with per-user results
- [ ] **IMPT-12**: Uses SUPABASE_SERVICE_ROLE_KEY from .env.local

### Test Data

- [ ] **TEST-01**: migration/dummy-users.json with 25 realistic fake users (12 students, 7 teachers, 4 WPs, 2 admins)
- [ ] **TEST-02**: Users span global locations (Canada, USA, UK, Germany, Australia, India, Thailand, Brazil)
- [ ] **TEST-03**: Mix of subscription statuses (active, expired) with fake Stripe IDs (cus_test_xxx, sub_test_xxx)
- [ ] **TEST-04**: Some users with credits in varied states (expiring soon, insufficient, on track)
- [ ] **TEST-05**: Import of dummy-users.json succeeds with at least 20 users imported

### Password Reset Flow

- [ ] **PWRS-01**: Middleware intercepts users with requires_password_reset: true and redirects to /account/set-password
- [ ] **PWRS-02**: Set-password page matches auth page style (centered card, GOYA logo, no header/footer)
- [ ] **PWRS-03**: New password + confirm password fields with submit
- [ ] **PWRS-04**: Submit updates Supabase auth password, sets requires_password_reset: false, redirects to dashboard
- [ ] **PWRS-05**: All routes protected except /account/set-password and auth routes for flagged users

### Admin Migration Page

- [ ] **ADMN-01**: /admin/migration page added to admin sidebar under Settings
- [ ] **ADMN-02**: Upload JSON file button accepting single or multiple chunk files
- [ ] **ADMN-03**: Mode selector (Skip existing / Overwrite existing)
- [ ] **ADMN-04**: Start Import button with live progress (X/Y processed, success/skipped/error counts)
- [ ] **ADMN-05**: Error list showing failed emails with reasons
- [ ] **ADMN-06**: Download migration log button after completion
- [ ] **ADMN-07**: Server-side import via POST /api/admin/migration/import using service role key

### Infrastructure

- [ ] **INFR-01**: migration/*.json in .gitignore (sensitive data)
- [ ] **INFR-02**: migration/README.md with full migration instructions
- [ ] **INFR-03**: Supabase migration for requires_password_reset column (if not exists)

## Future Requirements

- **WPEX-F01**: Export BuddyBoss groups/forums data
- **IMPT-F01**: Scheduled migration runs via cron
- **IMPT-F02**: Media file migration (avatars to Supabase storage)

## Out of Scope

| Feature | Reason |
|---------|--------|
| BuddyBoss group/forum migration | Not used in GOYA v2 |
| WooCommerce order history | Only active subscriptions needed |
| Automated migration scheduling | Manual admin-triggered is sufficient |
| Avatar file upload | URL references sufficient for now |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WPEX-01 | Phase 1 | Complete (01-01) |
| WPEX-02 | Phase 1 | Complete (01-01) |
| WPEX-03 | Phase 1 | Complete (01-01) |
| WPEX-04 | Phase 1 | Complete (01-01) |
| WPEX-05 | Phase 1 | Complete (01-01) |
| WPEX-06 | Phase 1 | Pending (01-02) |
| WPEX-07 | Phase 1 | Pending (01-02) |
| WPEX-08 | Phase 1 | Pending (01-02) |
| WPEX-09 | Phase 1 | Complete (01-01) |
| WPEX-10 | Phase 1 | Complete (01-01) |
| IMPT-01 | Phase 2 | Pending |
| IMPT-02 | Phase 2 | Pending |
| IMPT-03 | Phase 2 | Pending |
| IMPT-04 | Phase 2 | Pending |
| IMPT-05 | Phase 2 | Pending |
| IMPT-06 | Phase 2 | Pending |
| IMPT-07 | Phase 2 | Pending |
| IMPT-08 | Phase 2 | Pending |
| IMPT-09 | Phase 2 | Pending |
| IMPT-10 | Phase 2 | Pending |
| IMPT-11 | Phase 2 | Pending |
| IMPT-12 | Phase 2 | Pending |
| TEST-01 | Phase 2 | Pending |
| TEST-02 | Phase 2 | Pending |
| TEST-03 | Phase 2 | Pending |
| TEST-04 | Phase 2 | Pending |
| TEST-05 | Phase 2 | Pending |
| PWRS-01 | Phase 3 | Pending |
| PWRS-02 | Phase 3 | Pending |
| PWRS-03 | Phase 3 | Pending |
| PWRS-04 | Phase 3 | Pending |
| PWRS-05 | Phase 3 | Pending |
| ADMN-01 | Phase 4 | Pending |
| ADMN-02 | Phase 4 | Pending |
| ADMN-03 | Phase 4 | Pending |
| ADMN-04 | Phase 4 | Pending |
| ADMN-05 | Phase 4 | Pending |
| ADMN-06 | Phase 4 | Pending |
| ADMN-07 | Phase 4 | Pending |
| INFR-01 | Phase 2 | Pending |
| INFR-02 | Phase 2 | Pending |
| INFR-03 | Phase 2 | Pending |

**Coverage:**
- v1.0 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after initial definition*
