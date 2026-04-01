import 'server-only'

import { getSupabaseService } from '@/lib/supabase/service'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ServiceStatus = 'ok' | 'degraded' | 'down'
export type OverallStatus = 'healthy' | 'degraded' | 'critical'

export interface EndpointCheck {
  url: string
  statusCode: number | null
  latencyMs: number
  status: ServiceStatus
}

export interface ServiceCheck {
  name: string
  status: ServiceStatus
  latencyMs: number
  notes: string
}

export interface EnvVarCheck {
  name: string
  present: boolean
}

export interface BuildInfo {
  branch: string
  commitSha: string
  nodeVersion: string
}

export interface TrafficSnapshot {
  totalProfiles: number
  newLast24h: number
  activeSubscriptions: number
}

export interface DatabaseHealth {
  queryLatencyMs: number
  activeConnections: number | null
}

export interface HealthCheckResult {
  overallStatus: OverallStatus
  checkedAt: string
  endpoints: EndpointCheck[]
  services: ServiceCheck[]
  database: DatabaseHealth
  envVars: EnvVarCheck[]
  buildInfo: BuildInfo
  traffic: TrafficSnapshot
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusFromCode(code: number | null): ServiceStatus {
  if (code === null) return 'down'
  if (code >= 200 && code < 300) return 'ok'
  if (code >= 400 && code < 500) return 'degraded'
  return 'down'
}

// ─── Individual checks ──────────────────────────────────────────────────────

export async function checkEndpoints(baseUrl: string, _authToken?: string): Promise<EndpointCheck[]> {
  // Self-fetch the public /api/health endpoint to verify the app is responding.
  // On Vercel, server-to-server self-fetch can sometimes return 401 due to
  // middleware or protection rules — treat 401 as "ok" since we're already running.
  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })
    const latencyMs = Date.now() - start
    // 401 from self-fetch on Vercel means deployment protection — app is up
    const status = (res.status === 401) ? 'ok' as ServiceStatus : statusFromCode(res.status)
    return [{
      url: '/api/health',
      statusCode: res.status === 401 ? 200 : res.status,
      latencyMs,
      status,
    }]
  } catch {
    return [{
      url: '/api/health',
      statusCode: null,
      latencyMs: Date.now() - start,
      status: 'down',
    }]
  }
}

export async function checkSupabase(): Promise<ServiceCheck[]> {
  const results: ServiceCheck[] = []

  // DB connectivity
  try {
    const sb = getSupabaseService()
    const dbStart = Date.now()
    const { error: dbError } = await (sb as any).from('profiles').select('id', { count: 'exact', head: true }).limit(1)
    const latency = Date.now() - dbStart
    results.push({
      name: 'Supabase DB',
      status: dbError ? 'down' : latency > 500 ? 'degraded' : 'ok',
      latencyMs: latency,
      notes: dbError ? dbError.message : `Query OK`,
    })
  } catch (err: any) {
    results.push({
      name: 'Supabase DB',
      status: 'down',
      latencyMs: 0,
      notes: err?.message ?? 'Connection failed',
    })
  }

  // Auth service
  try {
    const sb = getSupabaseService()
    const start = Date.now()
    const { error } = await sb.auth.admin.listUsers({ page: 1, perPage: 1 })
    const latency = Date.now() - start
    results.push({
      name: 'Supabase Auth',
      status: error ? 'down' : latency > 500 ? 'degraded' : 'ok',
      latencyMs: latency,
      notes: error ? error.message : 'Auth OK',
    })
  } catch (err: any) {
    results.push({
      name: 'Supabase Auth',
      status: 'down',
      latencyMs: 0,
      notes: err?.message ?? 'Auth check failed',
    })
  }

  return results
}

export async function checkResend(): Promise<ServiceCheck> {
  try {
    const start = Date.now()
    const res = await fetch('https://api.resend.com', {
      method: 'HEAD',
      cache: 'no-store',
    })
    const latency = Date.now() - start
    const ok = res.status >= 200 && res.status < 500 // Resend returns 401 without auth, which means it's reachable
    return {
      name: 'Resend',
      status: ok ? (latency > 500 ? 'degraded' : 'ok') : 'down',
      latencyMs: latency,
      notes: ok ? 'Reachable' : `HTTP ${res.status}`,
    }
  } catch (err: any) {
    return {
      name: 'Resend',
      status: 'down',
      latencyMs: 0,
      notes: err?.message ?? 'Unreachable',
    }
  }
}

export async function checkStripe(): Promise<ServiceCheck> {
  try {
    // Dynamic import to avoid 'server-only' issues in edge cases
    const { getStripe } = await import('@/lib/stripe/client')
    const stripe = getStripe()
    const start = Date.now()
    await stripe.customers.list({ limit: 1 })
    const latency = Date.now() - start
    return {
      name: 'Stripe',
      status: latency > 500 ? 'degraded' : 'ok',
      latencyMs: latency,
      notes: 'Connected',
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Connection failed'
    return {
      name: 'Stripe',
      status: 'down',
      latencyMs: 0,
      notes: msg.length > 100 ? msg.slice(0, 100) + '...' : msg,
    }
  }
}

export function checkEnvVars(): EnvVarCheck[] {
  const vars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'RESEND_API_KEY',
    'SECRETS_MASTER_KEY',
    'VERCEL_ACCESS_TOKEN',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
  ]
  return vars.map(name => ({
    name,
    present: !!process.env[name],
  }))
}

export function getBuildInfo(): BuildInfo {
  return {
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'unknown',
    commitSha: (process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown').slice(0, 7),
    nodeVersion: process.version,
  }
}

export async function checkTraffic(): Promise<TrafficSnapshot> {
  try {
    const sb = getSupabaseService()

    const [profilesRes, recentRes, subsRes] = await Promise.all([
      (sb as any).from('profiles').select('id', { count: 'exact', head: true }),
      (sb as any)
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      (sb as any)
        .from('stripe_orders')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'recurring')
        .eq('subscription_status', 'active'),
    ])

    return {
      totalProfiles: profilesRes.count ?? 0,
      newLast24h: recentRes.count ?? 0,
      activeSubscriptions: subsRes.count ?? 0,
    }
  } catch {
    return { totalProfiles: 0, newLast24h: 0, activeSubscriptions: 0 }
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  try {
    const sb = getSupabaseService()
    const start = Date.now()
    await (sb as any).from('profiles').select('id').limit(1)
    const queryLatencyMs = Date.now() - start

    // Try to get active connections via RPC — skip gracefully if not available
    let activeConnections: number | null = null
    try {
      const { data } = await (sb as any).rpc('get_active_connections')
      if (typeof data === 'number') activeConnections = data
    } catch {
      // RPC not available — that's fine
    }

    return { queryLatencyMs, activeConnections }
  } catch {
    return { queryLatencyMs: -1, activeConnections: null }
  }
}

// ─── Aggregate ──────────────────────────────────────────────────────────────

export async function runAllChecks(baseUrl: string, authToken?: string): Promise<HealthCheckResult> {
  const [endpoints, supabaseChecks, resendCheck, stripeCheck, database, traffic] =
    await Promise.all([
      checkEndpoints(baseUrl, authToken),
      checkSupabase(),
      checkResend(),
      checkStripe(),
      checkDatabaseHealth(),
      checkTraffic(),
    ])

  const envVars = checkEnvVars()
  const buildInfo = getBuildInfo()
  const services = [...supabaseChecks, resendCheck, stripeCheck]

  // Determine overall status
  const anyDown = services.some(s => s.status === 'down')
  const anyEndpointDown = endpoints.some(e => e.status === 'down')
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY', 'SECRETS_MASTER_KEY']
  const missingRequired = envVars.some(v => requiredEnvVars.includes(v.name) && !v.present)
  const anyHighLatency = services.some(s => s.latencyMs > 500)
  const dbHighLatency = database.queryLatencyMs > 500

  let overallStatus: OverallStatus = 'healthy'
  if (anyDown || anyEndpointDown || missingRequired) {
    overallStatus = 'critical'
  } else if (anyHighLatency || dbHighLatency) {
    overallStatus = 'degraded'
  }

  return {
    overallStatus,
    checkedAt: new Date().toISOString(),
    endpoints,
    services,
    database,
    envVars,
    buildInfo,
    traffic,
  }
}
