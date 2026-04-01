# Quick Task: Health Tab Improvements

**Date:** 2026-04-01
**Status:** Complete

## Description

Fix health check 401, add maintenance status to health API, create migration for monitor log columns.

## Solution

- Simplified `checkEndpoints` in `lib/health-checks.ts` — removed unused `authToken` param, added 5s timeout
- Updated `/api/admin/health` to fetch and return `maintenanceSettings` from `site_settings` (enables Maintenance Status card in Health tab)
- Created migration `20260402_health_monitor_log_add_columns.sql` to add `failed_services text[]`, `latency_ms integer`, `metadata jsonb`
