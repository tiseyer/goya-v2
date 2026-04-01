'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { getMemberGrowthData } from './actions'

const TIME_RANGES = ['30D', '90D', '6M', '1Y', 'YTD', 'All'] as const

const ROLE_FILTERS = [
  { key: 'all',      label: 'All'       },
  { key: 'teachers', label: 'Teachers'  },
  { key: 'students', label: 'Students'  },
  { key: 'wellness', label: 'Wellness'  },
  { key: 'schools',  label: 'Schools'   },
] as const

export default function MemberGrowthChart() {
  const [range, setRange]           = useState<string>('30D')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [data, setData]             = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    setLoading(true)
    getMemberGrowthData(range, roleFilter).then(d => {
      setData(d)
      setLoading(false)
    })
  }, [range, roleFilter])

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Role filter pills (left) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                roleFilter === f.key
                  ? 'bg-[#1B3A5C] text-white'
                  : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Time range pills (right) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                range === r
                  ? 'bg-[#1B3A5C] text-white'
                  : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[300px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-[#345c83] rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-400">
            No data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="memberGradient" x1="0" y1="0" x2="0" y2="1">
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
                  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                width={50}
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
                labelFormatter={(d: unknown) =>
                  new Date(String(d)).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                formatter={(value: unknown) => [Number(value).toLocaleString(), 'Members']}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#345c83"
                strokeWidth={2}
                fill="url(#memberGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
