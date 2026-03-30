'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface UserResult {
  email: string
  wp_id: number
  status: 'created' | 'skipped' | 'updated' | 'error'
  error?: string
}

interface MigrationLog {
  started_at: string
  completed_at: string
  mode: string
  total: number
  created: number
  skipped: number
  updated: number
  errors: number
  results: UserResult[]
}

interface Progress {
  total: number
  processed: number
  created: number
  skipped: number
  updated: number
  failed: number
}

export default function MigrationPage() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<'skip' | 'overwrite'>('skip')
  const [importing, setImporting] = useState(false)
  const [uploadPhase, setUploadPhase] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [log, setLog] = useState<MigrationLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function handleImport() {
    setImporting(true)
    setError(null)
    setLog(null)
    setProgress(null)

    const abort = new AbortController()
    abortRef.current = abort

    const storagePaths: string[] = []

    try {
      // Phase 1 — Upload files to Supabase Storage
      for (const file of files) {
        const path = `${Date.now()}-${file.name}`
        setUploadPhase(`Uploading ${file.name}...`)

        const { error: uploadError } = await supabase.storage
          .from('migration-uploads')
          .upload(path, file, { contentType: 'application/json' })

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
        }

        storagePaths.push(path)
      }

      setUploadPhase(null)

      // Phase 2 — Trigger import via small JSON POST
      const res = await fetch('/api/admin/migration/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePaths, mode }),
        signal: abort.signal,
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Import failed (${res.status})`)
      }

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // SSE streaming
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n\n')
          buffer = lines.pop() || ''

          for (const chunk of lines) {
            const dataLine = chunk.split('\n').find(l => l.startsWith('data: '))
            if (!dataLine) continue
            const data = JSON.parse(dataLine.slice(6))

            if (data.status === 'running') {
              setProgress({
                total: data.total,
                processed: data.processed,
                created: data.created,
                skipped: data.skipped,
                updated: data.updated,
                failed: data.failed,
              })
            } else if (data.status === 'done') {
              setLog(data.log)
              setProgress(null)
            } else if (data.status === 'error') {
              throw new Error(data.error)
            }
          }
        }
      } else {
        // Fallback: JSON response
        const data: MigrationLog = await res.json()
        setLog(data)
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Import failed')
      }
    } finally {
      setImporting(false)
      setUploadPhase(null)
      abortRef.current = null

      // Phase 3 — Best-effort cleanup of uploaded files
      if (storagePaths.length > 0) {
        supabase.storage
          .from('migration-uploads')
          .remove(storagePaths)
          .catch((e) => console.warn('Storage cleanup failed:', e))
      }
    }
  }

  function downloadLog() {
    if (!log) return
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `migration-log-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const errorResults = log?.results.filter(r => r.status === 'error') ?? []
  const pct = progress ? Math.round((progress.processed / progress.total) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Migration</h1>
        <p className="text-sm text-slate-500 mt-1">Import users from WordPress export files</p>
      </div>

      {/* Upload & Controls */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-[#1B3A5C]">Upload & Import</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Export JSON File(s)</label>
          <input
            type="file"
            accept=".json"
            multiple
            onChange={e => setFiles(Array.from(e.target.files || []))}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1B3A5C] file:text-white hover:file:bg-[#15304d] file:cursor-pointer"
          />
          {files.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {files.length} file{files.length > 1 ? 's' : ''} selected: {files.map(f => f.name).join(', ')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Import Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="skip" checked={mode === 'skip'} onChange={() => setMode('skip')} className="accent-[#1B3A5C]" />
              <span className="text-sm text-slate-700">Skip existing</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="mode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} className="accent-[#1B3A5C]" />
              <span className="text-sm text-slate-700">Overwrite existing</span>
            </label>
          </div>
        </div>

        {!importing && !progress && (
          <button
            onClick={handleImport}
            disabled={files.length === 0}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1B3A5C] hover:bg-[#15304d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Start Import
          </button>
        )}

        {/* Progress Bar */}
        {importing && progress && (
          <div className="space-y-3">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-[#00B5A3] rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm font-medium text-[#1B3A5C]">
              Importing... {progress.processed} / {progress.total}
            </p>
            <p className="text-xs text-slate-500">
              Created: <span className="text-green-600 font-medium">{progress.created}</span>
              {' | '}Skipped: <span className="text-amber-600 font-medium">{progress.skipped}</span>
              {' | '}Updated: <span className="text-blue-600 font-medium">{progress.updated}</span>
              {' | '}Failed: <span className="text-red-600 font-medium">{progress.failed}</span>
            </p>
          </div>
        )}

        {importing && !progress && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {uploadPhase || 'Preparing import...'}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {log && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{log.total}</p>
              <p className="text-xs text-slate-500 mt-1">Total</p>
            </div>
            <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{log.created}</p>
              <p className="text-xs text-slate-500 mt-1">Created</p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{log.skipped}</p>
              <p className="text-xs text-slate-500 mt-1">Skipped</p>
            </div>
            <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{log.updated}</p>
              <p className="text-xs text-slate-500 mt-1">Updated</p>
            </div>
            <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{log.errors}</p>
              <p className="text-xs text-slate-500 mt-1">Errors</p>
            </div>
          </div>

          {errorResults.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Errors ({errorResults.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Email</th>
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorResults.map((r, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-3 text-slate-800 font-mono text-xs">{r.email}</td>
                        <td className="py-2 px-3 text-red-600">{r.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={downloadLog}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-[#1B3A5C] bg-white border border-[#E5E7EB] hover:bg-slate-50 transition-colors"
          >
            Download Migration Log
          </button>
        </div>
      )}
    </div>
  )
}
