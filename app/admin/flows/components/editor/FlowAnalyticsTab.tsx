'use client'

import { useState, useEffect, useCallback } from 'react'
import { startOfMonth, endOfDay } from 'date-fns'
import FlowAnalyticsFilters from './FlowAnalyticsFilters'
import FlowAnalyticsDropoff from './FlowAnalyticsDropoff'

interface DropoffPoint {
  stepId: string
  position: number
  title: string | null
  reached: number
}

interface AnalyticsCounts {
  shown: number
  started: number
  completed: number
  skipped: number
  dismissed: number
}

interface AnalyticsData {
  counts: AnalyticsCounts
  completionRate: number
  dropoff: DropoffPoint[]
}

interface Props {
  flowId: string
}

const METRIC_CARDS = [
  { key: 'shown' as const, label: 'Shown' },
  { key: 'started' as const, label: 'Started' },
  { key: 'completed' as const, label: 'Completed' },
  { key: 'skipped' as const, label: 'Skipped' },
  { key: 'dismissed' as const, label: 'Dismissed' },
]

export default function FlowAnalyticsTab({ flowId }: Props) {
  const [range, setRange] = useState('this_month')
  const [dateFrom, setDateFrom] = useState(() => startOfMonth(new Date()).toISOString())
  const [dateTo, setDateTo] = useState(() => endOfDay(new Date()).toISOString())
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async (from: string, to: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/flows/${flowId}/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      )
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data: AnalyticsData = await res.json()
      setAnalyticsData(data)
    } catch (err) {
      console.error('[FlowAnalyticsTab] fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [flowId])

  useEffect(() => {
    fetchAnalytics(dateFrom, dateTo)
  }, [fetchAnalytics, dateFrom, dateTo])

  function handleRangeChange(newRange: string, newFrom: string, newTo: string) {
    setRange(newRange)
    setDateFrom(newFrom)
    setDateTo(newTo)
  }

  const counts = analyticsData?.counts ?? {
    shown: 0,
    started: 0,
    completed: 0,
    skipped: 0,
    dismissed: 0,
  }
  const completionRate = analyticsData?.completionRate ?? 0
  const dropoff = analyticsData?.dropoff ?? []

  return (
    <div className="p-6 overflow-y-auto flex-1">
      <FlowAnalyticsFilters
        range={range}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChange={handleRangeChange}
      />

      {loading ? (
        /* Loading skeleton */
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse"
              >
                <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
                <div className="h-7 w-12 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
          <div className="h-72 bg-slate-100 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {METRIC_CARDS.map(({ key, label }) => (
              <div
                key={key}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
              >
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-2xl font-bold text-[#1B3A5C]">{counts[key]}</p>
              </div>
            ))}

            {/* Completion rate card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs text-slate-500 mb-1">Completion Rate</p>
              <p className="text-2xl font-bold text-[#1B3A5C]">{completionRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Step drop-off chart */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Step Drop-off</h3>
            <FlowAnalyticsDropoff data={dropoff} />
          </div>
        </div>
      )}
    </div>
  )
}
