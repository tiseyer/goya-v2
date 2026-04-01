'use client'

import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  endOfDay,
} from 'date-fns'

interface Props {
  range: string
  dateFrom: string
  dateTo: string
  onChange: (range: string, from: string, to: string) => void
}

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
]

function computeDates(rangeKey: string): { from: string; to: string } {
  const now = new Date()
  switch (rangeKey) {
    case 'today':
      return {
        from: startOfDay(now).toISOString(),
        to: endOfDay(now).toISOString(),
      }
    case 'yesterday': {
      const yesterday = subDays(now, 1)
      return {
        from: startOfDay(yesterday).toISOString(),
        to: endOfDay(yesterday).toISOString(),
      }
    }
    case 'this_week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        to: endOfDay(now).toISOString(),
      }
    case 'this_month':
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfDay(now).toISOString(),
      }
    case 'this_year':
      return {
        from: startOfYear(now).toISOString(),
        to: endOfDay(now).toISOString(),
      }
    default:
      return {
        from: startOfMonth(now).toISOString(),
        to: endOfDay(now).toISOString(),
      }
  }
}

export default function FlowAnalyticsFilters({ range, dateFrom, dateTo, onChange }: Props) {
  function handlePresetClick(key: string) {
    if (key === 'custom') {
      onChange('custom', dateFrom, dateTo)
      return
    }
    const { from, to } = computeDates(key)
    onChange(key, from, to)
  }

  function handleCustomFrom(e: React.ChangeEvent<HTMLInputElement>) {
    const from = e.target.value ? new Date(e.target.value).toISOString() : dateFrom
    onChange('custom', from, dateTo)
  }

  function handleCustomTo(e: React.ChangeEvent<HTMLInputElement>) {
    const to = e.target.value ? endOfDay(new Date(e.target.value)).toISOString() : dateTo
    onChange('custom', dateFrom, to)
  }

  // Convert ISO string back to date input value (YYYY-MM-DD)
  function toDateInputValue(iso: string): string {
    try {
      return iso.slice(0, 10)
    } catch {
      return ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {PRESETS.map((preset) => (
        <button
          key={preset.key}
          type="button"
          onClick={() => handlePresetClick(preset.key)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            range === preset.key
              ? 'bg-[#1B3A5C] text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {preset.label}
        </button>
      ))}

      {range === 'custom' && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            defaultValue={toDateInputValue(dateFrom)}
            onChange={handleCustomFrom}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
            title="From date"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            defaultValue={toDateInputValue(dateTo)}
            onChange={handleCustomTo}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#1B3A5C] focus:border-[#1B3A5C]"
            title="To date"
          />
        </div>
      )}
    </div>
  )
}
