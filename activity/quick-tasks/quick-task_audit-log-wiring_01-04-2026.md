# Quick Task: Wire Audit Log Across All Actions

**Date:** 2026-04-01
**Status:** Complete
**Branch:** feature/audit-log-wiring

## Description

Wire the existing `audit_log` table and `logAuditEvent()` utility across every significant user, admin, and system action in the codebase. Upgrade the audit log UI with new filters (Action, Actor, Target Type) and improved metadata display.

## Solution

### Utility Layer
- Renamed `logAudit` → `logAuditEvent` in `lib/audit.ts` (backward-compatible alias kept)
- Created `app/actions/audit.ts` server action wrapper for client components

### User Actions Wired (6 events)
- `user.login` — email/password sign-in (app/auth/actions.ts)
- `user.login` / `user.registered` — OAuth callback (app/auth/callback/route.ts)
- `user.profile_updated` — profile settings save (app/settings/actions.ts)
- `user.connection_requested` — connection request sent (ConnectionsContext)
- `user.connection_accepted` — connection request accepted (ConnectionsContext)

### Admin Actions Wired (18 events)
- `admin.user_impersonated` — impersonation start (app/actions/impersonation.ts)
- `admin.user_role_changed` — upgrade approve/reject + role change (inbox/actions, users/actions)
- `admin.user_created` — admin user creation (app/admin/users/actions.ts)
- `admin.school_approved` / `admin.school_rejected` (app/admin/schools/actions.ts)
- `admin.verification_approved` / `admin.verification_rejected` (VerificationActions.tsx)
- `admin.event_status_changed` — event approve/reject (inbox/actions.ts)
- `admin.course_status_changed` — course approve/reject (inbox/actions.ts)
- `admin.credit_approved` / `admin.credit_rejected` (inbox/actions.ts)
- `admin.api_key_created` / `admin.api_key_revoked` (api-keys/actions.ts)
- `admin.maintenance_mode_enabled` / `admin.maintenance_mode_disabled` (MaintenanceTab.tsx)
- `admin.email_sandbox_enabled` / `admin.email_sandbox_disabled` (MaintenanceTab.tsx)
- `admin.chatbot_sandbox_enabled` / `admin.chatbot_sandbox_disabled` (MaintenanceTab.tsx)
- `admin.settings_changed` — flows sandbox, credit hours sandbox, theme lock, page visibility (MaintenanceTab.tsx)

### System Actions Wired (10 events)
- `system.cron_executed` — all 4 cron jobs (admin-digest, chatbot-cleanup, stripe-events, credits-expiring)
- `system.stripe_webhook_received` — every webhook event (stripe/route.ts)
- `system.stripe_payment_succeeded` / `system.stripe_payment_failed` (stripe/route.ts)
- `system.stripe_subscription_created/updated/deleted` (stripe/route.ts)
- `system.stripe_webhook_failed` — handler errors (stripe/route.ts)
- `system.email_sent` / `system.email_failed` — all emails via Resend (lib/email/send.ts)

### UI Improvements
- Added Action dropdown filter (grouped by category with all known codes)
- Added Actor text filter (partial match, debounced)
- Added Target Type dropdown (USER, SCHOOL, EVENT, COURSE, etc.)
- Improved metadata display: formatted key-value pairs instead of raw JSON
- Status change entries show old → new values with color-coded badges
- Search now includes target_type field

### Documentation
- Updated docs/admin/audit-log.md with complete action code reference, schema, filter guide, and developer guide

### Files Modified (20)
lib/audit.ts, app/actions/audit.ts (new), app/auth/actions.ts, app/auth/callback/route.ts, app/settings/actions.ts, app/actions/impersonation.ts, app/admin/inbox/actions.ts, app/admin/schools/actions.ts, app/admin/users/actions.ts, app/admin/api-keys/actions.ts, app/admin/verification/VerificationActions.tsx, app/admin/settings/components/MaintenanceTab.tsx, app/context/ConnectionsContext.tsx, app/api/webhooks/stripe/route.ts, app/api/cron/admin-digest/route.ts, app/api/cron/chatbot-cleanup/route.ts, app/api/cron/stripe-events/route.ts, app/api/cron/credits-expiring/route.ts, lib/email/send.ts, app/admin/audit-log/page.tsx, app/admin/audit-log/AuditLogFilters.tsx, docs/admin/audit-log.md
