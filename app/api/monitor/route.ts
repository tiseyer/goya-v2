import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/service'
import { getResend, FROM_ADDRESS } from '@/lib/email/client'
import { runAllChecks, type OverallStatus, type HealthCheckResult } from '@/lib/health-checks'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const ALERT_EMAIL = process.env.MONITOR_ALERT_EMAIL ?? 'till@seyer-marketing.de'
const ADMIN_URL = 'https://goya-v2.vercel.app/admin/settings'

function validateAuth(request: Request): boolean {
  const secret = process.env.MONITOR_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  if (!auth) return false
  const token = auth.replace(/^Bearer\s+/i, '')
  return token === secret
}

function buildAlertSubject(status: OverallStatus, changes: string[]): string {
  if (status === 'critical') return `[GOYA] 🔴 Health Alert: ${changes.join(', ')}`
  if (status === 'degraded') return `[GOYA] 🟡 Degraded: ${changes.join(', ')}`
  return `[GOYA] ✅ Recovered: All systems healthy`
}

function buildAlertHtml(result: HealthCheckResult, changes: string[]): string {
  const statusColor = result.overallStatus === 'healthy' ? '#22c55e'
    : result.overallStatus === 'degraded' ? '#eab308' : '#ef4444'
  const statusLabel = result.overallStatus.charAt(0).toUpperCase() + result.overallStatus.slice(1)

  const serviceRows = result.services.map(s => {
    const color = s.status === 'ok' ? '#22c55e' : s.status === 'degraded' ? '#eab308' : '#ef4444'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><span style="color:${color}">●</span> ${s.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.status}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.latencyMs}ms</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${s.notes}</td>
    </tr>`
  }).join('')

  const endpointRows = result.endpoints.map(e => {
    const color = e.status === 'ok' ? '#22c55e' : e.status === 'degraded' ? '#eab308' : '#ef4444'
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb"><span style="color:${color}">●</span> ${e.url}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${e.statusCode ?? 'N/A'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${e.latencyMs}ms</td>
    </tr>`
  }).join('')

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:${statusColor};color:white;padding:16px 20px;border-radius:8px 8px 0 0">
        <h1 style="margin:0;font-size:18px">GOYA Health Monitor — ${statusLabel}</h1>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.9">${result.checkedAt}</p>
      </div>

      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:20px">
        <h2 style="margin:0 0 8px;font-size:14px;color:#374151">What Changed</h2>
        <ul style="margin:0 0 20px;padding-left:20px;color:#6b7280;font-size:13px">
          ${changes.map(c => `<li>${c}</li>`).join('')}
        </ul>

        <h2 style="margin:0 0 8px;font-size:14px;color:#374151">Services</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <thead><tr style="background:#f9fafb"><th style="text-align:left;padding:8px 12px">Service</th><th style="text-align:left;padding:8px 12px">Status</th><th style="text-align:left;padding:8px 12px">Latency</th><th style="text-align:left;padding:8px 12px">Notes</th></tr></thead>
          <tbody>${serviceRows}</tbody>
        </table>

        <h2 style="margin:0 0 8px;font-size:14px;color:#374151">Endpoints</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">
          <thead><tr style="background:#f9fafb"><th style="text-align:left;padding:8px 12px">Endpoint</th><th style="text-align:left;padding:8px 12px">Status</th><th style="text-align:left;padding:8px 12px">Latency</th></tr></thead>
          <tbody>${endpointRows}</tbody>
        </table>

        <p style="margin:20px 0 0;text-align:center">
          <a href="${ADMIN_URL}" style="display:inline-block;background:#1B3A5C;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600">View Health Dashboard →</a>
        </p>
      </div>
    </div>
  `
}

export async function GET(request: Request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const baseUrl = `${url.protocol}//${url.host}`

  const result = await runAllChecks(baseUrl)
  const sb = getSupabaseService()

  // Get last log entry to compare
  const { data: lastLogs } = await (sb as any)
    .from('health_monitor_log')
    .select('*')
    .order('checked_at', { ascending: false })
    .limit(1)

  const lastLog = lastLogs?.[0] ?? null
  const lastStatus: OverallStatus | null = lastLog?.overall_status ?? null
  const lastChecks = lastLog?.checks ?? null

  // Detect what changed
  const changes: string[] = []

  if (lastStatus && lastStatus !== result.overallStatus) {
    changes.push(`Overall status: ${lastStatus} → ${result.overallStatus}`)
  }

  if (lastChecks) {
    // Compare service statuses
    const prevServices: Record<string, string> = {}
    if (Array.isArray(lastChecks.services)) {
      for (const s of lastChecks.services) prevServices[s.name] = s.status
    }
    for (const s of result.services) {
      const prev = prevServices[s.name]
      if (prev && prev !== s.status) {
        changes.push(`${s.name}: ${prev} → ${s.status}`)
      }
    }

    // Compare endpoint statuses
    const prevEndpoints: Record<string, string> = {}
    if (Array.isArray(lastChecks.endpoints)) {
      for (const e of lastChecks.endpoints) prevEndpoints[e.url] = e.status
    }
    for (const e of result.endpoints) {
      const prev = prevEndpoints[e.url]
      if (prev && prev !== e.status) {
        changes.push(`Endpoint ${e.url}: ${prev} → ${e.status}`)
      }
    }

    // Check for newly missing env vars
    const prevEnvVars: Record<string, boolean> = {}
    if (Array.isArray(lastChecks.envVars)) {
      for (const v of lastChecks.envVars) prevEnvVars[v.name] = v.present
    }
    for (const v of result.envVars) {
      const prev = prevEnvVars[v.name]
      if (prev === true && !v.present) {
        changes.push(`Env var missing: ${v.name}`)
      }
    }

    // DB latency threshold
    if (result.database.queryLatencyMs > 1000 && (lastChecks.database?.queryLatencyMs ?? 0) <= 1000) {
      changes.push(`DB latency critical: ${result.database.queryLatencyMs}ms`)
    }
  }

  // For first-ever check, flag if not healthy
  if (!lastLog && result.overallStatus !== 'healthy') {
    changes.push(`Initial check: ${result.overallStatus}`)
  }

  // Check for hourly critical reminder
  let isHourlyReminder = false
  if (changes.length === 0 && result.overallStatus === 'critical' && lastLog) {
    // Find last alert_sent row
    const { data: lastAlert } = await (sb as any)
      .from('health_monitor_log')
      .select('checked_at')
      .eq('alert_sent', true)
      .order('checked_at', { ascending: false })
      .limit(1)

    if (lastAlert?.[0]) {
      const lastAlertTime = new Date(lastAlert[0].checked_at).getTime()
      const oneHour = 60 * 60 * 1000
      if (Date.now() - lastAlertTime >= oneHour) {
        isHourlyReminder = true
        changes.push(`Critical status persisting for >1 hour (reminder)`)
      }
    }
  }

  const shouldAlert = changes.length > 0
  let alertSent = false

  if (shouldAlert) {
    try {
      const resend = getResend()
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: ALERT_EMAIL,
        subject: buildAlertSubject(result.overallStatus, changes),
        html: buildAlertHtml(result, changes),
      })
      alertSent = true
    } catch (err: any) {
      console.error('[monitor] Failed to send alert email:', err?.message)
    }
  }

  // Insert log
  await (sb as any).from('health_monitor_log').insert({
    overall_status: result.overallStatus,
    checks: {
      services: result.services,
      endpoints: result.endpoints,
      database: result.database,
      envVars: result.envVars,
    },
    alert_sent: alertSent,
    alert_type: shouldAlert
      ? (isHourlyReminder ? 'reminder' : result.overallStatus === 'healthy' ? 'recovery' : result.overallStatus)
      : null,
  })

  // Cleanup: delete rows older than 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  await (sb as any).from('health_monitor_log').delete().lt('checked_at', sevenDaysAgo)

  return NextResponse.json({
    overallStatus: result.overallStatus,
    alertSent,
    changes,
    checkedAt: result.checkedAt,
  })
}
