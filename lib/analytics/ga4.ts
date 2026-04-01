/**
 * GA4 Data API client
 *
 * Auth: Google Service Account via GOOGLE_SERVICE_ACCOUNT_KEY env var (JSON string).
 * Property ID: fetched from site_settings table, key = 'ga4_property_id'.
 */

import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getSupabaseService } from '@/lib/supabase/service'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GA4ReportOptions {
  propertyId: string
  startDate: string // YYYY-MM-DD or 'NdaysAgo'
  endDate: string // YYYY-MM-DD or 'today'
  metrics: string[]
  dimensions?: string[]
  orderBys?: { metric?: string; dimension?: string; desc?: boolean }[]
  limit?: number
}

export interface GA4ReportRow {
  dimensions: string[]
  metrics: number[]
}

export interface GA4ReportResult {
  rows: GA4ReportRow[]
}

// ─── Property ID ───────────────────────────────────────────────────────────────

/** Fetch GA4 property ID from site_settings table. Returns null if not set. */
export async function getGA4PropertyId(): Promise<string | null> {
  try {
    const svc = getSupabaseService()
    const { data, error } = await svc
      .from('site_settings')
      .select('value')
      .eq('key', 'ga4_property_id')
      .single()

    if (error || !data?.value) return null
    return String(data.value)
  } catch {
    return null
  }
}

// ─── Client factory ────────────────────────────────────────────────────────────

/** Create a BetaAnalyticsDataClient using the GOOGLE_SERVICE_ACCOUNT_KEY env var. Returns null if not configured. */
export function getGA4Client(): BetaAnalyticsDataClient | null {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) return null

  try {
    const parsed = JSON.parse(keyJson) as {
      client_email?: string
      private_key?: string
    }

    if (!parsed.client_email || !parsed.private_key) return null

    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      },
    })
  } catch (err) {
    console.error('[GA4] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY:', err)
    return null
  }
}

// ─── Configuration check ───────────────────────────────────────────────────────

/** Returns true if both GA4 property ID (from site_settings) and service account key (from env) are present. */
export async function isGA4Configured(): Promise<boolean> {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) return false
  const propertyId = await getGA4PropertyId()
  return propertyId !== null
}

// ─── Core report runner ────────────────────────────────────────────────────────

/**
 * Run a GA4 Data API report.
 * Returns simplified row data, or null on error / missing credentials.
 */
export async function runGA4Report(
  options: GA4ReportOptions,
): Promise<GA4ReportResult | null> {
  const client = getGA4Client()
  if (!client) return null

  const { propertyId, startDate, endDate, metrics, dimensions, orderBys, limit } = options

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: metrics.map((name) => ({ name })),
      dimensions: dimensions?.map((name) => ({ name })) ?? [],
      orderBys: orderBys?.map((o) => ({
        ...(o.metric ? { metric: { metricName: o.metric } } : {}),
        ...(o.dimension ? { dimension: { dimensionName: o.dimension } } : {}),
        desc: o.desc ?? false,
      })) ?? [],
      limit: limit ?? undefined,
    })

    const rows: GA4ReportRow[] = (response.rows ?? []).map((row) => ({
      dimensions: (row.dimensionValues ?? []).map((d) => d.value ?? ''),
      metrics: (row.metricValues ?? []).map((m) => parseFloat(m.value ?? '0')),
    }))

    return { rows }
  } catch (err) {
    console.error('[GA4] runReport error:', err)
    return null
  }
}
