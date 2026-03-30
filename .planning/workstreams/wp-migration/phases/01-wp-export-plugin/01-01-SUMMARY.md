---
phase: 01-wp-export-plugin
plan: 01
subsystem: wp-migration
tags: [wordpress, php, plugin, export, migration]
dependency_graph:
  requires: []
  provides:
    - migration/wp-goya-exporter/wp-goya-exporter.php
    - WordPress plugin scaffold with admin page and core user export
  affects:
    - Plan 01-02 (BuddyBoss/WooCommerce enrichment builds on this scaffold)
tech_stack:
  added:
    - PHP WordPress plugin (single-file class-based structure)
  patterns:
    - WordPress plugin header standard
    - WP_User_Query for read-only user fetching
    - admin_menu / admin_init hooks
    - wp_nonce_field / wp_verify_nonce for CSRF protection
key_files:
  created:
    - migration/wp-goya-exporter/wp-goya-exporter.php
  modified: []
decisions:
  - Class-based single-file plugin for simplicity and easy zip upload
  - WP_User_Query with offset/limit for pagination — avoids WordPress timeout on 4000+ users
  - Export All sets number=-1 (WP convention) to fetch all matching users
  - Placeholder arrays for profile/avatar_url/subscriptions kept empty — Plan 02 fills them
  - Role filter passes slug directly to WP_User_Query 'role' arg
  - Status filter (active members) deferred to Plan 02 post-enrichment step
metrics:
  duration: 1m 32s
  completed: 2026-03-27T09:50:10Z
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
requirements_covered:
  - WPEX-01
  - WPEX-02
  - WPEX-03
  - WPEX-04
  - WPEX-05
  - WPEX-09
  - WPEX-10
---

# Phase 01 Plan 01: WP Export Plugin Scaffold Summary

**One-liner:** Single-file WordPress plugin with admin page, chunked WP_User_Query export, role/status filters, nonce CSRF protection, and zero database writes.

## What Was Built

A complete WordPress plugin scaffold at `migration/wp-goya-exporter/wp-goya-exporter.php` (318 lines) covering all core export functionality. The plugin:

- Registers a Tools > GOYA Export admin page with chunk size selector (100/250/500), offset input, role filter (all/subscriber/teacher/wellness/administrator), and status filter (all/active members)
- Handles Export Chunk: downloads `goya-export-chunk-{offset}-{limit}.json` with the specified users
- Handles Export All: downloads `goya-export-all.json` for all matching users with slow-operation warning
- Builds per-user objects with `wp_id`, `email`, `display_name`, `first_name`, `last_name`, `role`, `registered_at`
- Includes placeholder arrays for `profile`, `avatar_url`, and `subscriptions` (populated in Plan 02)
- Performs zero writes to the WordPress database (all SELECT only)
- Secures all export actions with nonce verification and `manage_options` capability check

## Commits

| Task | Description | Hash | Files |
|------|-------------|------|-------|
| 1 | Create WordPress export plugin scaffold | cbecd61 | migration/wp-goya-exporter/wp-goya-exporter.php |

## Verification Results

All acceptance criteria passed:

| Check | Result |
|-------|--------|
| Plugin header "Plugin Name: GOYA Exporter" | PASS (1 match) |
| add_management_page | PASS (1 match) |
| WP_User_Query | PASS (2 matches) |
| goya-export-chunk- filename pattern | PASS (1 match) |
| goya_export_all | PASS (3 matches) |
| READ-ONLY comment | PASS (3 matches) |
| role_filter | PASS (11 matches) |
| status_filter | PASS (7 matches) |
| wp_nonce_field / wp_verify_nonce | PASS (2 matches) |
| manage_options | PASS (3 matches) |
| Zero actual write operations | PASS (only match is comment text) |
| File >= 200 lines | PASS (318 lines) |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

The following fields are intentionally empty and documented as stubs for Plan 02:

| Field | File | Reason |
|-------|------|--------|
| `profile` | migration/wp-goya-exporter/wp-goya-exporter.php, `build_user_data()` | Populated by Plan 02 via BuddyBoss xprofile fields |
| `avatar_url` | migration/wp-goya-exporter/wp-goya-exporter.php, `build_user_data()` | Populated by Plan 02 via bp_core_fetch_avatar() |
| `subscriptions` | migration/wp-goya-exporter/wp-goya-exporter.php, `build_user_data()` | Populated by Plan 02 via WooCommerce subscriptions API |
| Active status filter | migration/wp-goya-exporter/wp-goya-exporter.php, `handle_export()` | Applied in Plan 02 after enrichment adds subscriptions[] |

These stubs are intentional — Plan 01-01 scope is core WP fields only. Plan 01-02 will wire the BuddyBoss xprofile, avatar URL, and WooCommerce subscription data.

## Self-Check: PASSED

- [x] migration/wp-goya-exporter/wp-goya-exporter.php exists (318 lines)
- [x] Commit cbecd61 exists in git log
