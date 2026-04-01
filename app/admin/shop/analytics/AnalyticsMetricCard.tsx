interface Props {
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'neutral') return null
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
    </span>
  )
}

export default function AnalyticsMetricCard({ label, value, subtitle, trend }: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-col">
      <p className="text-xs text-[#6B7280] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[#1B3A5C] mt-1 leading-none">{value}</p>
      {trend && trend !== 'neutral' && <TrendBadge trend={trend} />}
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}
