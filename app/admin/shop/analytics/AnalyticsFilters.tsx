'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  initialRange: string
  initialRole: string
  initialDateFrom?: string
  initialDateTo?: string
}

const TIME_RANGES = [
  { key: '30d', label: '30D' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: 'custom', label: 'Custom' },
] as const

const ROLE_FILTERS = [
  { key: 'all',                   label: 'All'       },
  { key: 'student',               label: 'Student'   },
  { key: 'teacher',               label: 'Teacher'   },
  { key: 'wellness_practitioner', label: 'Wellness'  },
  { key: 'school',                label: 'School'    },
] as const

export default function AnalyticsFilters({
  initialRange,
  initialRole,
  initialDateFrom,
  initialDateTo,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    startTransition(() => {
      router.replace(`/admin/shop/analytics?${params.toString()}`)
    })
  }

  const pillBase = 'px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors'
  const pillActive = 'bg-[#1B3A5C] text-white'
  const pillInactive = 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'

  return (
    <div className="space-y-3">
      {/* Time range pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {TIME_RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => updateParam('range', r.key)}
            className={`${pillBase} ${initialRange === r.key ? pillActive : pillInactive}`}
          >
            {r.label}
          </button>
        ))}

        {/* Custom date inputs — inline when custom selected */}
        {initialRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              defaultValue={initialDateFrom}
              onChange={(e) => updateParam('dateFrom', e.target.value)}
              className="rounded-md border border-[#E5E7EB] px-3 py-1 text-xs bg-white text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer"
              title="Date from"
            />
            <span className="text-xs text-[#6B7280]">to</span>
            <input
              type="date"
              defaultValue={initialDateTo}
              onChange={(e) => updateParam('dateTo', e.target.value)}
              className="rounded-md border border-[#E5E7EB] px-3 py-1 text-xs bg-white text-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer"
              title="Date to"
            />
          </div>
        )}
      </div>

      {/* Role filter pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => updateParam('role', f.key)}
            className={`${pillBase} ${initialRole === f.key ? pillActive : pillInactive}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
