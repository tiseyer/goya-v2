import { type ReactNode } from 'react'

interface StatHeroProps {
  label: string
  value: number | null | undefined
  suffix?: string
  className?: string
}

export function StatHero({ label, value, suffix, className }: StatHeroProps) {
  const displayValue =
    value === null || value === undefined
      ? '\u2014'
      : suffix
        ? `${value}${suffix}`
        : String(value)

  return (
    <div className={`text-center p-4 ${className ?? ''}`}>
      <p className="text-4xl font-bold text-slate-900">{displayValue}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}

interface StatHeroGridProps {
  children: ReactNode
  className?: string
}

export function StatHeroGrid({ children, className }: StatHeroGridProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 ${className ?? ''}`}>
      {children}
    </div>
  )
}

export default StatHero
