'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import type { ChartPoint } from '@/lib/analytics/metrics'

interface Props {
  chartData: ChartPoint[]
}

export default function AnalyticsCharts({ chartData }: Props) {
  return (
    <div className="space-y-6">
      {/* Chart 1: Revenue Over Time */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-4">
          Revenue Over Time
        </h3>
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00B5A3" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#00B5A3" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  tickFormatter={(v: number) => '$' + v.toLocaleString()}
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
                  formatter={(value: unknown) => [
                    '$' + Number(value).toFixed(2),
                    'Revenue',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00B5A3"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Chart 2: New Orders Over Time */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-4">
          New Orders Over Time
        </h3>
        <div className="h-[300px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#345c83" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#345c83" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  allowDecimals={false}
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
                  formatter={(value: unknown) => [
                    Number(value).toLocaleString(),
                    'Orders',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#345c83"
                  strokeWidth={2}
                  fill="url(#ordersGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
