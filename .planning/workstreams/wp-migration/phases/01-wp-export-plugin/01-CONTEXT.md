# Phase 1: WP Export Plugin - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase)

<domain>
## Phase Boundary

Build a self-contained WordPress plugin at migration/wp-goya-exporter/ that exports user data as chunked JSON. The plugin adds a page under Tools > GOYA Export with chunk controls, role/status filters, and export buttons. It reads from wp_users, wp_usermeta, bp_xprofile_data/fields, WooCommerce subscriptions, and Stripe metadata. Zero writes to the database.

</domain>

<decisions>
## Implementation Decisions

### Plugin Structure
- Single PHP file: migration/wp-goya-exporter/wp-goya-exporter.php
- Standard WordPress plugin header for zip-upload installation
- Menu page registered under Tools using add_management_page()
- Admin-only access (manage_options capability)

### Export Logic
- Query users with WP_User_Query, supporting offset/limit for chunking
- BuddyBoss xprofile data via direct SQL: JOIN bp_xprofile_data with bp_xprofile_fields on field_id, filter by user_id
- Skip fields from tabs marked "(legacy)" — only export specified field groups
- Avatar URL via bp_core_fetch_avatar() with html=false for URL only
- WooCommerce subscriptions via wcs_get_subscriptions(['customer_id' => $user_id]) or direct query on wp_posts with post_type='shop_subscription'
- Stripe IDs from post meta: _stripe_customer_id, _stripe_subscription_id

### Output Format
- JSON structure exactly matching the spec (wp_id, email, display_name, profile{}, subscriptions[])
- Content-Type: application/json with Content-Disposition for download
- File naming: goya-export-chunk-{offset}-{limit}.json

### Claude's Discretion
- Exact PHP implementation details (class-based vs procedural)
- Error handling for missing BuddyBoss/WooCommerce plugins
- UI styling of the admin page (standard WP admin styles)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is a standalone WordPress plugin, not part of the Next.js codebase

### Established Patterns
- WordPress plugin conventions (plugin header, hooks, admin pages)
- BuddyBoss xprofile API (bp_xprofile_data table)
- WooCommerce Subscriptions API (wcs_get_subscriptions)

### Integration Points
- Output JSON consumed by Phase 2 import script
- migration/ directory in GOYA v2 repo root

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the detailed spec.

</specifics>

<deferred>
## Deferred Ideas

None — phase scope is clear.

</deferred>
