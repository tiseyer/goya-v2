'use client'

import { useEffect, useState, useCallback } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AnalyticsData {
  visitors: { today: number; last7Days: number }
  pageViews: { today: number; last7Days: number }
  topPages: Array<{ key: string; total: number }>
  topCountries: Array<{ key: string; total: number }>
}

// ─── Country name lookup ──────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CA: 'Canada',
  AU: 'Australia',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  ES: 'Spain',
  IT: 'Italy',
  PT: 'Portugal',
  PL: 'Poland',
  JP: 'Japan',
  KR: 'South Korea',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  ZA: 'South Africa',
  NG: 'Nigeria',
  SG: 'Singapore',
  HK: 'Hong Kong',
  NZ: 'New Zealand',
}

function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}

// ─── Icons ───────────────────────────────────────────────────────────────────

const EyeIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const PageIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 mt-1">
        <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          accent ? 'bg-[#00B5A3]/10 text-[#00B5A3]' : 'bg-slate-100 text-[#6B7280]'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1B3A5C] leading-none">{value}</p>
        <p className="text-sm text-[#6B7280] mt-1">{label}</p>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AnalyticsSection() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetching, setFetching] = useState(false)

  const fetchData = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/admin/analytics')
      if (res.status === 503) {
        setNotConfigured(true)
        setError(null)
        setLoading(false)
        setFetching(false)
        return
      }
      if (!res.ok) {
        setError('Unable to load analytics')
        setLoading(false)
        setFetching(false)
        return
      }
      const json = (await res.json()) as AnalyticsData
      setData(json)
      setError(null)
      setNotConfigured(false)
      setLastUpdated(new Date())
    } catch {
      setError('Unable to load analytics')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => void fetchData(), 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Web Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse h-40" />
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse h-40" />
        </div>
      </div>
    )
  }

  // ── Not configured ──────────────────────────────────────────────────────────
  if (notConfigured) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Web Analytics
        </h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">
            Vercel Analytics not configured. Set{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_ACCESS_TOKEN</code>{' '}
            and{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_PROJECT_ID</code>{' '}
            environment variables.
          </p>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Web Analytics
        </h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm flex items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">{error}</p>
          <button
            onClick={() => { void fetchData() }}
            className="text-xs text-[#00B5A3] font-medium hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  const visitors = data?.visitors ?? { today: 0, last7Days: 0 }
  const pageViews = data?.pageViews ?? { today: 0, last7Days: 0 }
  const topPages = data?.topPages ?? []
  const topCountries = data?.topCountries ?? []

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">
          Web Analytics
        </h2>
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          {fetching && (
            <span className="w-2 h-2 rounded-full bg-[#00B5A3] animate-pulse shrink-0" />
          )}
          {lastUpdated && (
            <span>
              Last updated:{' '}
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Error banner (partial data still shown) */}
      {error && (
        <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between gap-4">
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={() => { void fetchData() }}
            className="text-xs text-red-600 font-medium hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Visitors Today"
          value={visitors.today.toLocaleString()}
          icon={EyeIcon}
          accent
        />
        <StatCard
          label="Visitors (7d)"
          value={visitors.last7Days.toLocaleString()}
          icon={EyeIcon}
        />
        <StatCard
          label="Page Views Today"
          value={pageViews.today.toLocaleString()}
          icon={PageIcon}
          accent
        />
        <StatCard
          label="Page Views (7d)"
          value={pageViews.last7Days.toLocaleString()}
          icon={PageIcon}
        />
      </div>

      {/* Top pages + countries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Top Pages */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm font-bold text-[#1B3A5C] mb-3">Top Pages</p>
          {topPages.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No data available</p>
          ) : (
            <ol className="space-y-2">
              {topPages.map((page, i) => (
                <li key={page.key} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs text-[#6B7280] shrink-0 font-medium">
                    {i + 1}.
                  </span>
                  <span
                    className="flex-1 text-[#1B3A5C] truncate font-mono text-xs"
                    title={page.key}
                  >
                    {page.key}
                  </span>
                  <span className="text-[#6B7280] shrink-0">
                    {page.total.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Top Countries */}
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm font-bold text-[#1B3A5C] mb-3">Top Countries</p>
          {topCountries.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No data available</p>
          ) : (
            <ol className="space-y-2">
              {topCountries.map((country, i) => (
                <li key={country.key} className="flex items-center gap-3 text-sm">
                  <span className="w-5 text-right text-xs text-[#6B7280] shrink-0 font-medium">
                    {i + 1}.
                  </span>
                  <span className="flex-1 text-[#1B3A5C] truncate">
                    {countryName(country.key)}
                  </span>
                  <span className="text-[#6B7280] shrink-0">
                    {country.total.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
