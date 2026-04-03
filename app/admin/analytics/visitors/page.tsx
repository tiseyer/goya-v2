import Link from 'next/link'
import { isGA4Configured, getGA4PropertyId, runGA4Report } from '@/lib/analytics/ga4'
import VisitorsAnalyticsClient from './VisitorsAnalyticsClient'
import type { VisitorsAnalyticsClientProps } from './VisitorsAnalyticsClient'

// ─── Date helpers ──────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDateRange(range: string): { startDate: string; endDate: string; prevStartDate: string; prevEndDate: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = toYMD(today)

  let days: number
  switch (range) {
    case '7d':  days = 7;   break
    case '90d': days = 90;  break
    case '6m':  days = 182; break
    default:    days = 30;  // 30d
  }

  const start = new Date(today)
  start.setDate(today.getDate() - days + 1)
  const startDate = toYMD(start)

  // Previous period: same length immediately before
  const prevEnd = new Date(start)
  prevEnd.setDate(start.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevEnd.getDate() - days + 1)

  return {
    startDate,
    endDate,
    prevStartDate: toYMD(prevStart),
    prevEndDate:   toYMD(prevEnd),
  }
}

// ─── Trend calculation ─────────────────────────────────────────────────────────

function calcTrend(current: number, previous: number): { trend: 'up' | 'down' | 'neutral'; trendValue: string } {
  if (previous === 0) return { trend: 'neutral', trendValue: '—' }
  const pct = ((current - previous) / previous) * 100
  if (Math.abs(pct) < 0.1) return { trend: 'neutral', trendValue: '0.0%' }
  const sign = pct > 0 ? '+' : ''
  return { trend: pct > 0 ? 'up' : 'down', trendValue: `${sign}${pct.toFixed(1)}%` }
}

// ─── Number formatting ─────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}m ${s}s`
}

function fmtBounce(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}

// ─── Fallback UI ───────────────────────────────────────────────────────────────

function GA4Fallback() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Visitor Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Website traffic metrics from Google Analytics 4.</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-200">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#1B3A5C] mb-2">Connect Google Analytics</h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          To enable visitor analytics, set the{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">ga4_property_id</code>{' '}
          in Site Settings and add the{' '}
          <code className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">GOOGLE_SERVICE_ACCOUNT_KEY</code>{' '}
          environment variable containing your service account credentials JSON.
        </p>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B3A5C] text-white text-sm font-medium rounded-lg hover:bg-[#6E88B0] transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function VisitorsAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  // Check configuration first
  const configured = await isGA4Configured()
  if (!configured) return <GA4Fallback />

  const { range: rawRange } = await searchParams
  const range = ['7d', '30d', '90d', '6m'].includes(rawRange ?? '') ? (rawRange as string) : '30d'

  const propertyId = (await getGA4PropertyId())!
  const { startDate, endDate, prevStartDate, prevEndDate } = getDateRange(range)

  // Parallel GA4 fetches
  const [
    overviewCurrent,
    overviewPrev,
    sessionsByDate,
    topPages,
    sources,
    countries,
    devices,
  ] = await Promise.all([
    // a. Overview — current period
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics: ['sessions', 'screenPageViews', 'totalUsers', 'bounceRate', 'averageSessionDuration', 'newUsers'],
    }),
    // b. Overview — previous period
    runGA4Report({
      propertyId,
      startDate: prevStartDate,
      endDate:   prevEndDate,
      metrics: ['sessions', 'screenPageViews', 'totalUsers', 'bounceRate', 'averageSessionDuration', 'newUsers'],
    }),
    // c. Sessions by date
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics:    ['sessions'],
      dimensions: ['date'],
      orderBys:   [{ dimension: 'date', desc: false }],
    }),
    // d. Top pages
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics:    ['sessions', 'screenPageViews', 'averageSessionDuration'],
      dimensions: ['pagePath'],
      orderBys:   [{ metric: 'sessions', desc: true }],
      limit: 10,
    }),
    // e. Traffic sources
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics:    ['sessions'],
      dimensions: ['sessionSourceMedium'],
      orderBys:   [{ metric: 'sessions', desc: true }],
      limit: 10,
    }),
    // f. Countries
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics:    ['sessions'],
      dimensions: ['country'],
      orderBys:   [{ metric: 'sessions', desc: true }],
      limit: 10,
    }),
    // g. Devices
    runGA4Report({
      propertyId,
      startDate,
      endDate,
      metrics:    ['sessions'],
      dimensions: ['deviceCategory'],
    }),
  ])

  // ─── Build stats row ─────────────────────────────────────────────────────────

  const cur = overviewCurrent?.rows[0]?.metrics ?? [0, 0, 0, 0, 0, 0]
  const prv = overviewPrev?.rows[0]?.metrics    ?? [0, 0, 0, 0, 0, 0]

  const [cSessions, cPageviews, cUsers, cBounce, cDuration, cNewUsers] = cur
  const [pSessions, pPageviews, pUsers, pBounce, pDuration, pNewUsers] = prv

  const stats: VisitorsAnalyticsClientProps['stats'] = [
    { label: 'Sessions',            value: fmtNum(cSessions),           ...calcTrend(cSessions,  pSessions)  },
    { label: 'Pageviews',           value: fmtNum(cPageviews),          ...calcTrend(cPageviews, pPageviews) },
    { label: 'Unique Users',        value: fmtNum(cUsers),              ...calcTrend(cUsers,     pUsers)     },
    { label: 'Bounce Rate',         value: fmtBounce(cBounce),          ...calcTrend(cBounce,    pBounce)    },
    { label: 'Avg. Session',        value: fmtDuration(cDuration),      ...calcTrend(cDuration,  pDuration)  },
    { label: 'New Users',           value: fmtNum(cNewUsers),           ...calcTrend(cNewUsers,  pNewUsers)  },
  ]

  // ─── Chart data ──────────────────────────────────────────────────────────────

  const chartData: VisitorsAnalyticsClientProps['chartData'] = (sessionsByDate?.rows ?? []).map((row) => {
    // GA4 date format: YYYYMMDD
    const raw = row.dimensions[0] ?? ''
    const formatted = raw.length === 8
      ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
      : raw
    return { date: formatted, sessions: row.metrics[0] ?? 0 }
  })

  // ─── Top pages ───────────────────────────────────────────────────────────────

  const topPagesData: VisitorsAnalyticsClientProps['topPages'] = (topPages?.rows ?? []).map((row) => ({
    path:      row.dimensions[0] ?? '/',
    sessions:  row.metrics[0]   ?? 0,
    pageviews: row.metrics[1]   ?? 0,
    avgTime:   fmtDuration(row.metrics[2] ?? 0),
  }))

  // ─── Traffic sources ─────────────────────────────────────────────────────────

  const totalSourceSessions = (sources?.rows ?? []).reduce((s, r) => s + (r.metrics[0] ?? 0), 0)
  const sourcesData: VisitorsAnalyticsClientProps['sources'] = (sources?.rows ?? []).map((row) => {
    const sess = row.metrics[0] ?? 0
    return {
      source:     row.dimensions[0] ?? '(direct) / (none)',
      sessions:   sess,
      percentage: totalSourceSessions > 0 ? `${((sess / totalSourceSessions) * 100).toFixed(1)}%` : '0%',
    }
  })

  // ─── Countries ───────────────────────────────────────────────────────────────

  const totalCountrySessions = (countries?.rows ?? []).reduce((s, r) => s + (r.metrics[0] ?? 0), 0)
  const countriesData: VisitorsAnalyticsClientProps['countries'] = (countries?.rows ?? []).map((row) => {
    const sess = row.metrics[0] ?? 0
    return {
      country:    row.dimensions[0] ?? 'Unknown',
      sessions:   sess,
      percentage: totalCountrySessions > 0 ? `${((sess / totalCountrySessions) * 100).toFixed(1)}%` : '0%',
    }
  })

  // ─── Devices ─────────────────────────────────────────────────────────────────

  const totalDeviceSessions = (devices?.rows ?? []).reduce((s, r) => s + (r.metrics[0] ?? 0), 0)
  const devicesData: VisitorsAnalyticsClientProps['devices'] = (devices?.rows ?? []).map((row) => {
    const sess = row.metrics[0] ?? 0
    return {
      device:     row.dimensions[0] ?? 'unknown',
      sessions:   sess,
      percentage: totalDeviceSessions > 0 ? `${((sess / totalDeviceSessions) * 100).toFixed(1)}%` : '0%',
    }
  })

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Visitor Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Website traffic from Google Analytics 4 — {startDate} to {endDate}.
        </p>
      </div>

      <VisitorsAnalyticsClient
        currentRange={range}
        stats={stats}
        chartData={chartData}
        topPages={topPagesData}
        sources={sourcesData}
        countries={countriesData}
        devices={devicesData}
        overviewAvailable={overviewCurrent !== null}
        chartAvailable={sessionsByDate !== null}
        topPagesAvailable={topPages !== null}
        sourcesAvailable={sources !== null}
        countriesAvailable={countries !== null}
        devicesAvailable={devices !== null}
      />
    </div>
  )
}
