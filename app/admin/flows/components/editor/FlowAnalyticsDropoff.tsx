'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

interface DropoffPoint {
  stepId: string
  position: number
  title: string | null
  reached: number
}

interface Props {
  data: DropoffPoint[]
}

export default function FlowAnalyticsDropoff({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="w-full h-72 bg-white rounded-lg border p-4 flex items-center justify-center">
        <p className="text-sm text-slate-400">No step data</p>
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: d.title ? `${d.position}. ${d.title}` : `Step ${d.position}`,
    reached: d.reached,
  }))

  return (
    <div className="w-full h-72 bg-white rounded-lg border p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
            formatter={(value) => [value, 'Users reached']}
          />
          <Bar dataKey="reached" fill="#1B3A5C" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
