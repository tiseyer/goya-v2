# Quick Task: Health Tab Improvements — Vercel Cron, Audit Log, Maintenance Status

**Date:** 2026-04-01
**Task ID:** 260401-mlw
**Status:** Complete

## Description

Fix and improve the Health tab: resolve internal `/api/health` 401 errors in health checks, move monitoring from cron-job.org to Vercel cron, add audit logging for critical health events, add a Maintenance Status card, improve the Monitor Log display, and remove the outdated Monitoring Setup box.

## Solution

### Backend Changes

- `/api/monitor` now uses `CRON_SECRET` auth (matching all other Vercel cron routes)
- `checkEndpoints` and `runAllChecks` accept optional `authToken` to pass as Bearer header on internal `/api/health` fetch — prevents 401s
- Audit log entries written to `audit_log` table on health status changes only (not every run)
- `health_monitor_log` insert now populates `failed_services`, `latency_ms`, `metadata` columns
- `/api/admin/health` returns `maintenanceSettings` map alongside health data
- `vercel.json` adds `/api/monitor` at `*/1 * * * *` (every minute)
- Migration `20260402_health_monitor_log_add_columns.sql` adds three new columns

### Frontend Changes

- New **Maintenance Status** card between Services and Database cards
  - Red badge when `maintenance_mode_enabled` is true
  - Yellow badge listing active sandboxes/restrictions
  - Green badge when all normal
- Maintenance mode active banner below overall status bar
- **Monitor Log** table now shows Failed Services and Latency columns
- **Monitoring Setup** grey box with cron-job.org references removed
- `MonitorLogEntry` and `HealthData` types updated to include new fields

## Commits

- `6b39cc6` — feat(260401-mlw): switch monitor to Vercel cron auth, add audit logging, populate new columns
- `d1ebce9` — feat(260401-mlw): health tab UI — maintenance status card, improved monitor log, remove setup box
