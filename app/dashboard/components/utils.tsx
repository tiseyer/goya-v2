'use client'

export function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

export function StubSection({
  title,
  count,
  suffix = '',
}: {
  title: string
  count: number
  suffix?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-slate-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">
        {count}
        {suffix}
      </p>
    </div>
  )
}
