'use client'

import { getTimeOfDay } from './utils'

interface DashboardGreetingProps {
  firstName: string
  role: string
  subtitle?: string
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700',
  teacher: 'bg-emerald-100 text-emerald-700',
  wellness_practitioner: 'bg-purple-100 text-purple-700',
  school: 'bg-amber-100 text-amber-700',
}

function formatRoleLabel(role: string): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function DashboardGreeting({ firstName, role, subtitle }: DashboardGreetingProps) {
  const timeOfDay = getTimeOfDay()
  const badgeColor = ROLE_BADGE_COLORS[role] ?? 'bg-slate-100 text-slate-700'
  const roleLabel = formatRoleLabel(role)

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">
          Good {timeOfDay}, {firstName}.
        </h1>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full shrink-0 ${badgeColor}`}
        >
          {roleLabel}
        </span>
      </div>
      {subtitle && (
        <p className="text-base text-slate-500">{subtitle}</p>
      )}
    </div>
  )
}

export default DashboardGreeting
