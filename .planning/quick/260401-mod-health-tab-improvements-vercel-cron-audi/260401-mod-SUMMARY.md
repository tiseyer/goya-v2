# Quick Task 260401-mod: Health tab improvements, Vercel cron, audit log, maintenance status

**Completed:** 2026-04-01
**Status:** Complete

## What Changed

1. **Fixed health check self-fetch**: Simplified `checkEndpoints` in `lib/health-checks.ts` to use a direct fetch with 5s timeout, removing the unused `authToken` parameter that was causing complexity.

2. **Monitoring Setup box already removed**: Previous session had already cleaned up the cron-job.org references from the HealthTab UI.

3. **Vercel cron already configured**: `vercel.json` already has `/api/monitor` at `*/1 * * * *`. Monitor route already uses `CRON_SECRET` auth.

4. **Audit logging already integrated**: `/api/monitor/route.ts` already calls `logAuditEvent` for `system.health_check_failed` and `system.health_check_recovered` on status changes only.

5. **Added Maintenance & Sandbox Status**: Updated `/api/admin/health/route.ts` to fetch `maintenanceSettings` from `site_settings` table and return it in the response. The HealthTab already had the UI for this — it was just missing the data from the API.

6. **Monitor Log already improved**: HealthTab already shows failed_services and latency columns. Created migration `20260402_health_monitor_log_add_columns.sql` to add the `failed_services`, `latency_ms`, and `metadata` columns that the monitor route writes to.

## Files Changed

- `lib/health-checks.ts` — Simplified `checkEndpoints` (removed authToken, added 5s timeout)
- `app/api/admin/health/route.ts` — Added maintenanceSettings fetch, removed unused `headers` import
- `supabase/migrations/20260402_health_monitor_log_add_columns.sql` (new) — Add missing columns

## Notes

Most of the requested changes (items 2-4, 6) were already implemented by a previous session. This task completed the remaining gaps: the self-fetch fix, the maintenanceSettings API data, and the DB migration for new columns.
