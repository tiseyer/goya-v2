'use client'

import { useState, useEffect, useCallback } from 'react'

// ─── Types matching lib/health-checks.ts ─────────────────────────────────────

interface EndpointCheck {
  url: string
  statusCode: number | null
  latencyMs: number
  status: 'ok' | 'degraded' | 'down'
}

interface ServiceCheck {
  name: string
  status: 'ok' | 'degraded' | 'down'
  latencyMs: number
  notes: string
}

interface EnvVarCheck {
  name: string
  present: boolean
}

interface BuildInfo {
  branch: string
  commitSha: string
  nodeVersion: string
}

interface TrafficSnapshot {
  totalProfiles: number
  newLast24h: number
  activeSubscriptions: number
}

interface DatabaseHealth {
  queryLatencyMs: number
  activeConnections: number | null
}

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

interface MaintenanceSettings {
  maintenance_mode_enabled?: string
  email_sandbox_enabled?: string
  chatbot_maintenance_mode?: string
  flows_sandbox?: string
  credit_hours_sandbox?: string
  theme_lock?: string
  page_visibility?: string
}

interface HealthData {
  overallStatus: 'healthy' | 'degraded' | 'critical'
  checkedAt: string
  endpoints: EndpointCheck[]
  services: ServiceCheck[]
  database: DatabaseHealth
  envVars: EnvVarCheck[]
  buildInfo: BuildInfo
  traffic: TrafficSnapshot
  monitorLog: MonitorLogEntry[]
  maintenanceSettings: MaintenanceSettings
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusDotColor({ status }: { status: 'ok' | 'degraded' | 'down' | 'healthy' | 'critical' }) {
  const cls =
    status === 'ok' || status === 'healthy' ? 'bg-green-500' :
    status === 'degraded' ? 'bg-yellow-400' :
    'bg-red-500'
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${cls}`} />
}

function LatencyBadge({ ms }: { ms: number }) {
  const cls = ms < 100 ? 'text-green-700 bg-green-50' :
              ms < 500 ? 'text-yellow-700 bg-yellow-50' :
              'text-red-700 bg-red-50'
  return <span className={`text-xs font-mono px-2 py-0.5 rounded ${cls}`}>{ms}ms</span>
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E5E7EB]">
        <h3 className="text-sm font-semibold text-[#1B3A5C]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HealthTab() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/health', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to fetch health data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 border-2 border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-5 text-sm text-red-700">
        Failed to load health data: {error}
      </div>
    )
  }

  if (!data) return null

  const overallColor =
    data.overallStatus === 'healthy' ? 'bg-green-50 border-green-200 text-green-800' :
    data.overallStatus === 'degraded' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
    'bg-red-50 border-red-200 text-red-800'

  const overallIcon =
    data.overallStatus === 'healthy' ? '✓' :
    data.overallStatus === 'degraded' ? '⚠' : '✗'

  const overallLabel =
    data.overallStatus === 'healthy' ? 'All Systems Healthy' :
    data.overallStatus === 'degraded' ? 'Degraded Performance' :
    'Critical — Action Required'

  // Compute maintenance state
  const ms = data.maintenanceSettings ?? {}
  const mmActive = ms.maintenance_mode_enabled === 'true'
  const sandboxes = [
    { key: 'email_sandbox_enabled', label: 'Email Sandbox' },
    { key: 'chatbot_maintenance_mode', label: 'Chatbot Maintenance' },
    { key: 'flows_sandbox', label: 'Flows Sandbox' },
    { key: 'credit_hours_sandbox', label: 'Credit Hours Sandbox' },
  ].filter(s => ms[s.key as keyof MaintenanceSettings] === 'true')

  const themeLockActive = !!(ms.theme_lock && ms.theme_lock !== '')
  let pageDisabledList: string[] = []
  if (ms.page_visibility) {
    try {
      const pv = JSON.parse(ms.page_visibility)
      pageDisabledList = Object.entries(pv)
        .filter(([, v]: [string, unknown]) => (v as { enabled?: boolean })?.enabled === false)
        .map(([path]) => path)
    } catch {
      // ignore parse errors
    }
  }

  const hasRestrictions = sandboxes.length > 0 || themeLockActive || pageDisabledList.length > 0

  return (
    <div className="space-y-5">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7280]">
          Last checked: {formatRelative(data.checkedAt)}
        </p>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div className={`flex items-center gap-3 px-5 py-4 rounded-xl border ${overallColor}`}>
        <span className="text-lg font-bold">{overallIcon}</span>
        <span className="font-semibold text-sm">{overallLabel}</span>
      </div>

      {/* Maintenance mode warning banner */}
      {mmActive && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border bg-red-50 border-red-200 text-red-700 text-sm">
          <span className="text-base">🔧</span>
          <span className="font-medium">Maintenance mode is active — site is in restricted access</span>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-5">
        {/* API Endpoints */}
        <Card title="API Endpoints">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[#6B7280] border-b border-[#E5E7EB]">
                <th className="text-left pb-2 font-medium">Endpoint</th>
                <th className="text-left pb-2 font-medium">Status Code</th>
                <th className="text-left pb-2 font-medium">Latency</th>
                <th className="text-left pb-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {data.endpoints.map(e => (
                <tr key={e.url} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="py-2.5 font-mono text-xs text-[#374151]">{e.url}</td>
                  <td className="py-2.5">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                      e.statusCode && e.statusCode < 300 ? 'bg-green-50 text-green-700' :
                      e.statusCode && e.statusCode < 500 ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>{e.statusCode ?? 'N/A'}</span>
                  </td>
                  <td className="py-2.5"><LatencyBadge ms={e.latencyMs} /></td>
                  <td className="py-2.5"><StatusDotColor status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Services */}
        <Card title="Services">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[#6B7280] border-b border-[#E5E7EB]">
                <th className="text-left pb-2 font-medium">Service</th>
                <th className="text-left pb-2 font-medium">Status</th>
                <th className="text-left pb-2 font-medium">Latency</th>
                <th className="text-left pb-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map(s => (
                <tr key={s.name} className="border-b border-[#F3F4F6] last:border-0">
                  <td className="py-2.5 text-[#374151] font-medium">{s.name}</td>
                  <td className="py-2.5"><StatusDotColor status={s.status} /></td>
                  <td className="py-2.5"><LatencyBadge ms={s.latencyMs} /></td>
                  <td className="py-2.5 text-xs text-[#6B7280]">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Maintenance Status — between Services and Database */}
        <Card title="Maintenance Status">
          <div className="space-y-3">
            {mmActive ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  Maintenance Mode Active
                </span>
                <p className="text-xs text-[#6B7280]">Non-admin users see the maintenance page.</p>
              </>
            ) : hasRestrictions ? (
              <>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                  Partial Restrictions Active
                </span>
                <ul className="space-y-1 mt-1">
                  {sandboxes.map(s => (
                    <li key={s.key} className="text-xs text-[#6B7280]">• {s.label} is enabled</li>
                  ))}
                  {themeLockActive && (
                    <li className="text-xs text-[#6B7280]">• Theme lock is active</li>
                  )}
                  {pageDisabledList.map(path => (
                    <li key={path} className="text-xs text-[#6B7280]">• Page disabled: <span className="font-mono">{path}</span></li>
                  ))}
                </ul>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                All Systems Normal
              </span>
            )}
          </div>
        </Card>

        {/* Database */}
        <Card title="Database">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Query Latency</p>
              <LatencyBadge ms={data.database.queryLatencyMs} />
            </div>
            {data.database.activeConnections !== null && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Active Connections</p>
                <span className="text-sm font-mono text-[#374151]">{data.database.activeConnections}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Environment Variables */}
        <Card title="Environment Variables">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.envVars.map(v => (
              <div key={v.name} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50">
                <span className="text-xs font-mono text-[#374151] truncate mr-2">{v.name}</span>
                {v.present ? (
                  <span className="text-xs font-medium text-green-600 shrink-0">✓</span>
                ) : (
                  <span className="text-xs font-medium text-red-600 shrink-0">✗ Missing</span>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Build Info + Traffic side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card title="Build Info">
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Branch</span>
                <span className="font-mono text-[#374151]">{data.buildInfo.branch}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Commit</span>
                <span className="font-mono text-[#374151]">{data.buildInfo.commitSha}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Node.js</span>
                <span className="font-mono text-[#374151]">{data.buildInfo.nodeVersion}</span>
              </div>
            </div>
          </Card>

          <Card title="Traffic Snapshot">
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Total Members</span>
                <span className="font-semibold text-[#374151]">{data.traffic.totalProfiles.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">New (last 24h)</span>
                <span className="font-semibold text-[#374151]">{data.traffic.newLast24h}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6B7280]">Active Subscriptions</span>
                <span className="font-semibold text-[#374151]">{data.traffic.activeSubscriptions}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Monitor Log */}
        <Card title="Monitor Log">
          {data.monitorLog.length === 0 ? (
            <p className="text-xs text-[#6B7280]">No monitoring data yet. Vercel cron runs /api/monitor every minute.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#6B7280] border-b border-[#E5E7EB]">
                  <th className="text-left pb-2 font-medium">Time</th>
                  <th className="text-left pb-2 font-medium">Status</th>
                  <th className="text-left pb-2 font-medium">Failed Services</th>
                  <th className="text-left pb-2 font-medium">Latency</th>
                  <th className="text-left pb-2 font-medium">Alert</th>
                </tr>
              </thead>
              <tbody>
                {data.monitorLog.map(entry => (
                  <tr key={entry.id} className="border-b border-[#F3F4F6] last:border-0">
                    <td className="py-2 text-xs text-[#6B7280]">{formatRelative(entry.checked_at)}</td>
                    <td className="py-2">
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDotColor status={entry.overall_status} />
                        <span className="text-xs capitalize">{entry.overall_status}</span>
                      </span>
                    </td>
                    <td className="py-2 text-xs text-[#6B7280]">
                      {entry.failed_services && entry.failed_services.length > 0
                        ? entry.failed_services.join(', ')
                        : '—'}
                    </td>
                    <td className="py-2">
                      {entry.latency_ms !== null && entry.latency_ms !== undefined
                        ? <LatencyBadge ms={entry.latency_ms} />
                        : <span className="text-xs text-[#6B7280]">—</span>}
                    </td>
                    <td className="py-2 text-xs">
                      {entry.alert_sent ? (
                        <span className="text-amber-600 font-medium">{entry.alert_type ?? 'Yes'}</span>
                      ) : (
                        <span className="text-[#6B7280]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  )
}
