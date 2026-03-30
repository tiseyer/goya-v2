'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import type { ChartPoint } from '@/lib/analytics/metrics'

interface Props {
  chartData: ChartPoint[]
}

export default function AnalyticsCharts({ chartData }: Props) {
  if (chartData.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">No data for this period</div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Chart 1: Revenue Over Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Revenue Over Time</h3>
        <div className="w-full h-72 bg-white rounded-lg border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => ['$' + Number(value).toFixed(2), 'Revenue']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00B5A3"
                name="Revenue ($)"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: New Orders Over Time */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">New Orders Over Time</h3>
        <div className="w-full h-72 bg-white rounded-lg border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#1B3A5C"
                name="New Orders"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
