'use client'

import { exportToCsv, downloadCsv } from '@/lib/analytics/csv'

interface Props {
  data: Record<string, unknown>[]
  filename: string
  label?: string
}

export default function CsvExportButton({ data, filename, label = 'Export CSV' }: Props) {
  function handleClick() {
    const csv = exportToCsv(data, filename)
    downloadCsv(csv, filename)
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      {/* Download icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
      {label}
    </button>
  )
}
