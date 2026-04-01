---
phase: quick
plan: 260401-mlw
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/monitor/route.ts
  - app/api/health/route.ts
  - lib/health-checks.ts
  - vercel.json
  - lib/audit.ts
  - supabase/migrations/20260390_add_monitor_log_columns.sql
  - app/admin/settings/components/HealthTab.tsx
  - app/api/admin/health/route.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - "Vercel cron calls /api/monitor every minute and receives 200"
    - "/api/health endpoint check inside health-checks no longer returns 401"
    - "Health tab shows Maintenance Status box with correct red/yellow/green badge"
    - "Health tab Monitor Log shows last 10 entries with failed_services and latency"
    - "Monitoring Setup grey box is removed from Health tab"
    - "Critical health events write to audit_log on status change only"
  artifacts:
    - path: "vercel.json"
      provides: "Vercel cron entry for /api/monitor at every minute"
      contains: "/api/monitor"
    - path: "app/api/monitor/route.ts"
      provides: "Monitor endpoint with Vercel cron auth + audit logging"
    - path: "app/admin/settings/components/HealthTab.tsx"
      provides: "Health tab with Maintenance Status box, improved Monitor Log, no Setup box"
    - path: "supabase/migrations/20260390_add_monitor_log_columns.sql"
      provides: "Add failed_services, latency_ms, metadata columns to health_monitor_log"
  key_links:
    - from: "vercel.json"
      to: "app/api/monitor/route.ts"
      via: "Vercel cron scheduler"
    - from: "app/api/monitor/route.ts"
      to: "lib/audit.ts"
      via: "logAuditEvent on status change"
    - from: "app/api/admin/health/route.ts"
      to: "app/admin/settings/components/HealthTab.tsx"
      via: "fetch /api/admin/health returns maintenance + monitor data"
---

<objective>
Fix and improve the Health tab: resolve the /api/health 401 error in health checks, move monitoring from cron-job.org to Vercel cron, add audit logging for critical health events, add a Maintenance Status box, improve the Monitor Log display, and remove the outdated Monitoring Setup box.

Purpose: Make health monitoring self-contained within Vercel (no external cron dependency), provide maintenance visibility in the health dashboard, and create an audit trail for health incidents.
Output: Updated Health tab UI, Vercel cron-based monitoring, audit logging integration, new migration for monitor_log columns.
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@lib/health-checks.ts
@app/api/monitor/route.ts
@app/api/admin/health/route.ts
@app/api/health/route.ts
@app/admin/settings/components/HealthTab.tsx
@vercel.json
@lib/audit.ts
@lib/site-settings.ts
@supabase/migrations/20260360_add_health_monitor_log.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix /api/health auth, switch to Vercel cron, add audit logging</name>
  <files>
    app/api/monitor/route.ts
    lib/health-checks.ts
    vercel.json
    supabase/migrations/20260390_add_monitor_log_columns.sql
    app/api/admin/health/route.ts
  </files>
  <action>
**1a. Fix /api/health 401 in health checks (lib/health-checks.ts):**
The `checkEndpoints` function in `lib/health-checks.ts` fetches `/api/health` without auth. The `/api/health` endpoint (app/api/health/route.ts) is already unauthenticated — it just returns `{ ok: true }`. The 401 is likely because `runAllChecks` is called from `/api/monitor/route.ts` which constructs `baseUrl` from the request URL, and the internal fetch to `/api/health` goes through middleware that requires auth.

Fix: In `lib/health-checks.ts` `checkEndpoints`, pass the `MONITOR_SECRET` as a Bearer token header on the internal health check fetch. Add an optional `authToken` param to `checkEndpoints` and `runAllChecks`:
```typescript
export async function checkEndpoints(baseUrl: string, authToken?: string): Promise<EndpointCheck[]> {
```
In the fetch call, add headers: `{ cache: 'no-store', headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }`.

In `runAllChecks`, accept and pass through the authToken:
```typescript
export async function runAllChecks(baseUrl: string, authToken?: string): Promise<HealthCheckResult> {
  const [endpoints, ...] = await Promise.all([
    checkEndpoints(baseUrl, authToken),
    ...
  ])
```

In `app/api/monitor/route.ts`, pass `process.env.MONITOR_SECRET` to `runAllChecks(baseUrl, process.env.MONITOR_SECRET)`.

In `app/api/admin/health/route.ts`, pass `process.env.MONITOR_SECRET` similarly: `runAllChecks(baseUrl, process.env.MONITOR_SECRET)`.

**1b. Switch /api/monitor to Vercel cron auth (app/api/monitor/route.ts):**
Replace the current `validateAuth` function that checks `MONITOR_SECRET` with the Vercel cron pattern using `CRON_SECRET`:
```typescript
function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}
```
This matches the existing cron auth pattern used in `app/api/cron/credits-expiring/route.ts` and others.

**1c. Add Vercel cron entry (vercel.json):**
Add to the existing `crons` array:
```json
{ "path": "/api/monitor", "schedule": "*/1 * * * *" }
```
Note: Vercel Hobby plan supports minimum 1-minute cron. Use `*/1 * * * *` for every minute.

**1d. Add audit logging for health status changes (app/api/monitor/route.ts):**
Import `logAuditEvent` from `@/lib/audit`. After the existing change detection logic (where `changes` array is populated and `shouldAlert` is determined), add audit logging:

- If `shouldAlert` is true AND `result.overallStatus` is `'critical'` or `'degraded'`: call `logAuditEvent({ category: 'system', severity: 'error', action: 'system.health_check_failed', description: changes.join('; '), metadata: { overall_status: result.overallStatus, failed_services: result.services.filter(s => s.status === 'down').map(s => s.name), changes } })`.

- If `shouldAlert` is true AND `result.overallStatus` is `'healthy'` (recovery): call `logAuditEvent({ category: 'system', severity: 'info', action: 'system.health_check_recovered', description: 'All systems recovered: ' + changes.join('; '), metadata: { overall_status: 'healthy', changes } })`.

This only logs on status CHANGE (the `changes` array is already computed by comparing with last log entry).

**1e. Add failed_services, latency_ms, metadata columns (migration):**
Create `supabase/migrations/20260390_add_monitor_log_columns.sql`:
```sql
-- Add detailed columns to health_monitor_log for improved Monitor Log display
ALTER TABLE public.health_monitor_log
  ADD COLUMN IF NOT EXISTS failed_services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
```

**1f. Update monitor insert to populate new columns (app/api/monitor/route.ts):**
In the insert statement, add the new fields:
```typescript
failed_services: result.services.filter(s => s.status === 'down').map(s => s.name),
latency_ms: result.database.queryLatencyMs,
metadata: {
  services: result.services.map(s => ({ name: s.name, status: s.status, latencyMs: s.latencyMs })),
  endpoints: result.endpoints.map(e => ({ url: e.url, status: e.status, statusCode: e.statusCode })),
},
```

**1g. Update /api/admin/health to return maintenance settings (app/api/admin/health/route.ts):**
Import `getSupabaseService` (already imported). After fetching monitorLog, also fetch maintenance-related site_settings:
```typescript
const { data: settings } = await (sb as any)
  .from('site_settings')
  .select('key, value')
  .in('key', [
    'maintenance_mode_enabled',
    'email_sandbox_enabled', 'chatbot_maintenance_mode',
    'flows_sandbox', 'credit_hours_sandbox',
    'theme_lock', 'page_visibility',
  ])
```
Transform to a map and include in response: `maintenanceSettings: settingsMap`.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - /api/monitor uses CRON_SECRET auth pattern (matches other cron routes)
    - vercel.json has /api/monitor cron entry at every minute
    - health-checks.ts passes auth token to internal /api/health fetch
    - Monitor route writes audit_log entries on health status changes only
    - health_monitor_log table has failed_services, latency_ms, metadata columns
    - /api/admin/health returns maintenanceSettings alongside health data
  </done>
</task>

<task type="auto">
  <name>Task 2: Health tab UI — Maintenance Status box, improved Monitor Log, remove Setup box</name>
  <files>
    app/admin/settings/components/HealthTab.tsx
  </files>
  <action>
**2a. Add MaintenanceSettings type and Maintenance Status box:**
Add to the HealthData interface:
```typescript
interface MaintenanceSettings {
  maintenance_mode_enabled?: string
  email_sandbox_enabled?: string
  chatbot_maintenance_mode?: string
  flows_sandbox?: string
  credit_hours_sandbox?: string
  theme_lock?: string
  page_visibility?: string
}
```
Add `maintenanceSettings: MaintenanceSettings` to the `HealthData` interface.

**2b. Update MonitorLogEntry to include new columns:**
Update the MonitorLogEntry interface:
```typescript
interface MonitorLogEntry {
  id: string
  checked_at: string
  overall_status: 'healthy' | 'degraded' | 'critical'
  alert_sent: boolean
  alert_type: string | null
  failed_services: string[] | null
  latency_ms: number | null
  metadata: Record<string, unknown> | null
}
```

**2c. Add Maintenance Status card between "Services" and "Database" cards:**
Create a new `<Card title="Maintenance Status">` placed BETWEEN the Services card and the Database card in the JSX.

Logic for badge color and label:
```typescript
const ms = data.maintenanceSettings ?? {}
const mmActive = ms.maintenance_mode_enabled === 'true'
const sandboxes = [
  { key: 'email_sandbox_enabled', label: 'Email Sandbox' },
  { key: 'chatbot_maintenance_mode', label: 'Chatbot Maintenance' },
  { key: 'flows_sandbox', label: 'Flows Sandbox' },
  { key: 'credit_hours_sandbox', label: 'Credit Hours Sandbox' },
].filter(s => ms[s.key as keyof MaintenanceSettings] === 'true')

const themeLockActive = ms.theme_lock && ms.theme_lock !== ''
let pageDisabledList: string[] = []
if (ms.page_visibility) {
  try {
    const pv = JSON.parse(ms.page_visibility)
    pageDisabledList = Object.entries(pv)
      .filter(([_, v]: [string, any]) => v?.enabled === false)
      .map(([path]) => path)
  } catch {}
}

const hasRestrictions = sandboxes.length > 0 || themeLockActive || pageDisabledList.length > 0
```

Display:
- If `mmActive`: Red badge "Maintenance Mode Active" with red-50 background.
- Else if `hasRestrictions`: Yellow badge "Partial Restrictions Active" with yellow-50 background. Below the badge, list active restrictions as bullet items with text-xs text-[#6B7280].
- Else: Green badge "All Systems Normal" with green-50 background.

Use the same badge style pattern as the overall status banner. Example badge:
```tsx
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
  Maintenance Mode Active
</span>
```

If mmActive, also show: "Non-admin users see the maintenance page."

**2d. Improve Monitor Log display:**
Update the Monitor Log card table to show more columns:
- Time (existing)
- Status (existing)
- Failed Services: show `entry.failed_services?.join(', ') || '—'`
- Latency: show `entry.latency_ms ? <LatencyBadge ms={entry.latency_ms} /> : '—'`
- Alert (existing)

The table header row:
```
Time | Status | Failed Services | Latency | Alert
```

**2e. Remove the "Monitoring Setup" grey box:**
Delete the entire `<div className="bg-slate-50 rounded-xl ...">` block at the bottom of the component that contains "Monitoring Setup" heading and cron-job.org references (lines ~344-354 in current file).

**2f. Maintenance Status contributes to overall status indicator:**
After computing `overallColor`/`overallIcon`/`overallLabel`, add a check: if `mmActive`, override to show a special banner below the overall status:
```tsx
{mmActive && (
  <div className="flex items-center gap-3 px-5 py-3 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
    <span className="text-base">🔧</span>
    <span className="font-medium">Maintenance mode is active — site is in restricted access</span>
  </div>
)}
```
Place this right after the overall status banner div.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - Health tab shows Maintenance Status card between Services and Database
    - Maintenance Status shows red badge when maintenance_mode is active
    - Maintenance Status shows yellow badge when any sandbox/restriction is active with listed items
    - Maintenance Status shows green badge when all systems normal
    - Monitor Log table shows failed_services and latency_ms columns
    - "Monitoring Setup" grey box is removed
    - Maintenance mode active shows additional warning below overall status banner
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. Verify vercel.json has valid JSON with /api/monitor cron entry
3. Verify no references to "cron-job.org" remain in HealthTab.tsx
4. Verify audit logging import and calls exist in monitor route
5. Verify migration file exists for new columns
</verification>

<success_criteria>
- Health tab loads without errors, showing Maintenance Status box
- Monitor Log displays failed_services and latency columns
- "Monitoring Setup" box is gone
- /api/monitor authenticates via CRON_SECRET (Vercel cron pattern)
- vercel.json includes /api/monitor cron at every minute
- Health status changes write to audit_log table
- Internal /api/health check passes auth token to avoid 401
- TypeScript compiles with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/260401-mlw-health-tab-improvements-fix-401-vercel-c/260401-mlw-SUMMARY.md`
</output>
