'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

interface Props {
  initialRange: string
  initialRole: string
  initialDateFrom?: string
  initialDateTo?: string
}

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

  const selectClass =
    'rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer'

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Time range select */}
      <select
        defaultValue={initialRange}
        onChange={(e) => updateParam('range', e.target.value)}
        className={selectClass}
      >
        <option value="30d">Last 30 days</option>
        <option value="3mo">Last 3 months</option>
        <option value="6mo">Last 6 months</option>
        <option value="custom">Custom range</option>
      </select>

      {/* Role select */}
      <select
        defaultValue={initialRole}
        onChange={(e) => updateParam('role', e.target.value)}
        className={selectClass}
      >
        <option value="all">All roles</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="wellness_practitioner">Wellness Practitioner</option>
        <option value="school">School</option>
      </select>

      {/* Custom date inputs — only shown when range='custom' */}
      {initialRange === 'custom' && (
        <>
          <input
            type="date"
            defaultValue={initialDateFrom}
            onChange={(e) => updateParam('dateFrom', e.target.value)}
            className={`${selectClass} text-[#6B7280]`}
            title="Date from"
          />
          <input
            type="date"
            defaultValue={initialDateTo}
            onChange={(e) => updateParam('dateTo', e.target.value)}
            className={`${selectClass} text-[#6B7280]`}
            title="Date to"
          />
        </>
      )}
    </div>
  )
}
