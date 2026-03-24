// Pure CSV serialization helper.
// No Supabase or React imports — this is a pure utility.

export function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export function exportToCsv(rows: Record<string, unknown>[], filename: string): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const headerLine = headers.join(',')
  const dataLines = rows.map(row =>
    headers.map(h => formatCsvValue(row[h])).join(',')
  )
  return [headerLine, ...dataLines].join('\n')
}

export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
