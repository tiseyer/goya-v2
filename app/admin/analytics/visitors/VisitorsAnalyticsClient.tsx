'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useTransition } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VisitorsAnalyticsClientProps {
  currentRange: string
  stats: { label: string; value: string; trend: 'up' | 'down' | 'neutral'; trendValue: string }[]
  chartData: { date: string; sessions: number }[]
  topPages: { path: string; sessions: number; pageviews: number; avgTime: string }[]
  sources: { source: string; sessions: number; percentage: string }[]
  countries: { country: string; sessions: number; percentage: string }[]
  devices: { device: string; sessions: number; percentage: string }[]
  overviewAvailable: boolean
  chartAvailable: boolean
  topPagesAvailable: boolean
  sourcesAvailable: boolean
  countriesAvailable: boolean
  devicesAvailable: boolean
}

// ─── Time range pills ──────────────────────────────────────────────────────────

const TIME_RANGES = [
  { key: '7d',  label: '7D'  },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '6m',  label: '6M'  },
] as const

// ─── Trend indicator ───────────────────────────────────────────────────────────

function TrendBadge({ trend, value }: { trend: 'up' | 'down' | 'neutral'; value: string }) {
  if (trend === 'neutral') {
    return <span className="text-xs text-slate-400 mt-1">{value}</span>
  }
  const isUp = trend === 'up'
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs mt-1 font-medium ${
        isUp ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {isUp ? (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {value}
    </span>
  )
}

// ─── Section error ─────────────────────────────────────────────────────────────

function SectionError({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-8 text-center text-sm text-slate-400">
      Unable to load {name}
    </div>
  )
}

// ─── Inner client (needs useSearchParams) ─────────────────────────────────────

function VisitorsAnalyticsInner(props: VisitorsAnalyticsClientProps) {
  const {
    currentRange,
    stats,
    chartData,
    topPages,
    sources,
    countries,
    devices,
    overviewAvailable,
    chartAvailable,
    topPagesAvailable,
    sourcesAvailable,
    countriesAvailable,
    devicesAvailable,
  } = props

  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleRangeChange(key: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', key)
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-6">
      {/* Time filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => handleRangeChange(r.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              currentRange === r.key
                ? 'bg-[#1B3A5C] text-white'
                : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Loading spinner while range change re-fetches */}
      {isPending && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-[#345c83] rounded-full animate-spin" />
        </div>
      )}

      {/* Main content — dims while pending */}
      <div className={`space-y-6 transition-opacity ${isPending ? 'opacity-40 pointer-events-none' : ''}`}>

      {/* Stats row */}
      {!overviewAvailable ? (
        <SectionError name="overview metrics" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-col"
            >
              <p className="text-xs text-[#6B7280] font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-[#1B3A5C] mt-1 leading-none">{stat.value}</p>
              <TrendBadge trend={stat.trend} value={stat.trendValue} />
            </div>
          ))}
        </div>
      )}

      {/* Traffic chart */}
      {!chartAvailable ? (
        <SectionError name="traffic chart" />
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-4">
            Sessions Over Time
          </h2>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                No data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#345c83" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#345c83" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickFormatter={(d: string) =>
                      new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1B3A5C',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'white',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: 'white' }}
                    itemStyle={{ color: 'white' }}
                    labelFormatter={(d: unknown) =>
                      typeof d === 'string'
                        ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : String(d)
                    }
                    formatter={(value: unknown) => [
                      typeof value === 'number' ? value.toLocaleString() : String(value),
                      'Sessions',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="#345c83"
                    strokeWidth={2}
                    fill="url(#visitorsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* Tables grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        {!topPagesAvailable ? (
          <SectionError name="top pages" />
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Top Pages</h2>
            </div>
            {topPages.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No data</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Page</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">Sessions</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280] hidden sm:table-cell">Pageviews</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280] hidden sm:table-cell">Avg. Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {topPages.map((page, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-[#374151] font-mono text-xs truncate max-w-[160px]">
                        {page.path}
                      </td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280]">{page.sessions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280] hidden sm:table-cell">{page.pageviews.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280] hidden sm:table-cell">{page.avgTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Traffic Sources */}
        {!sourcesAvailable ? (
          <SectionError name="traffic sources" />
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Traffic Sources</h2>
            </div>
            {sources.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No data</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Source / Medium</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">Sessions</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {sources.map((src, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-[#374151] truncate max-w-[200px]">{src.source}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280]">{src.sessions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280]">{src.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Countries */}
        {!countriesAvailable ? (
          <SectionError name="countries" />
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB]">
              <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">Countries</h2>
            </div>
            {countries.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No data</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-[#E5E7EB]">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-[#6B7280]">Country</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">Sessions</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-[#6B7280]">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {countries.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 text-[#374151]">{c.country}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280]">{c.sessions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-right text-[#6B7280]">{c.percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Devices */}
        {!devicesAvailable ? (
          <SectionError name="devices" />
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
            <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-4">Devices</h2>
            {devices.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No data</div>
            ) : (
              <div className="space-y-3">
                {devices.map((d, i) => {
                  const label = d.device.charAt(0).toUpperCase() + d.device.slice(1)
                  const pct = parseFloat(d.percentage)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#374151] font-medium">{label}</span>
                        <span className="text-[#6B7280]">{d.sessions.toLocaleString()} <span className="text-slate-400">({d.percentage})</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-[#345c83] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      </div>{/* end pending-dimmed content wrapper */}
    </div>
  )
}

// ─── Exported client component (wraps inner in Suspense for useSearchParams) ──

export default function VisitorsAnalyticsClient(props: VisitorsAnalyticsClientProps) {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center"><div className="w-5 h-5 border-2 border-slate-300 border-t-[#345c83] rounded-full animate-spin" /></div>}>
      <VisitorsAnalyticsInner {...props} />
    </Suspense>
  )
}
