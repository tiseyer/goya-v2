'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Deployment } from '@/app/api/admin/deployments/route'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeploymentsData {
  deployments: Deployment[]
  current: {
    branch: string
    commitSha: string
    environment: string
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function truncate(str: string, max: number): string {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 flex items-start gap-4 shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 mt-1">
        <div className="h-6 w-16 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeploymentsSection() {
  const [data, setData] = useState<DeploymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [fetching, setFetching] = useState(false)

  const fetchData = useCallback(async () => {
    setFetching(true)
    try {
      const res = await fetch('/api/admin/deployments')
      if (res.status === 503) {
        setNotConfigured(true)
        setError(null)
        setLoading(false)
        setFetching(false)
        return
      }
      if (!res.ok) {
        setError('Unable to load deployments')
        setLoading(false)
        setFetching(false)
        return
      }
      const json = (await res.json()) as DeploymentsData
      setData(json)
      setError(null)
      setNotConfigured(false)
      setLastUpdated(new Date())
    } catch {
      setError('Unable to load deployments')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    const interval = setInterval(() => void fetchData(), 60_000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Deployments
        </h2>
        <SkeletonCard />
        <div className="mt-4 bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse h-40" />
      </div>
    )
  }

  // ── Not configured ──────────────────────────────────────────────────────────
  if (notConfigured) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Deployments
        </h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
          <p className="text-sm text-[#6B7280]">
            Vercel Deployments not configured. Set{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_ACCESS_TOKEN</code>{' '}
            and{' '}
            <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_PROJECT_ID</code>{' '}
            environment variables.
          </p>
        </div>
      </div>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <div>
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">
          Deployments
        </h2>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm flex items-center justify-between gap-4">
          <p className="text-sm text-[#6B7280]">{error}</p>
          <button
            onClick={() => { void fetchData() }}
            className="text-xs text-[#00B5A3] font-medium hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  const current = data?.current ?? { branch: '', commitSha: '', environment: '' }
  const deployments = data?.deployments ?? []

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest">
          Deployments
        </h2>
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          {fetching && (
            <span className="w-2 h-2 rounded-full bg-[#00B5A3] animate-pulse shrink-0" />
          )}
          {lastUpdated && (
            <span>
              Last updated:{' '}
              {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Error banner (partial data still shown) */}
      {error && (
        <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between gap-4">
          <p className="text-xs text-red-600">{error}</p>
          <button
            onClick={() => { void fetchData() }}
            className="text-xs text-red-600 font-medium hover:underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Current deployment card */}
      {(current.branch || current.commitSha) && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm mb-4">
          <p className="text-sm font-bold text-[#1B3A5C] mb-3">Current Deployment</p>
          <div className="flex flex-wrap items-center gap-2">
            {current.branch && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00B5A3]/10 text-[#00B5A3]">
                {current.branch}
              </span>
            )}
            {current.commitSha && (
              <span className="font-mono text-xs text-[#6B7280] bg-slate-100 px-2 py-0.5 rounded">
                {current.commitSha.slice(0, 7)}
              </span>
            )}
            {current.environment && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {current.environment}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deployments list */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E5E7EB]">
          <p className="text-sm font-bold text-[#1B3A5C]">Recent Deployments</p>
        </div>
        {deployments.length === 0 ? (
          <div className="p-5">
            <p className="text-sm text-[#6B7280]">No deployments found</p>
          </div>
        ) : (
          <ol>
            {deployments.map((dep, i) => (
              <li key={dep.commitSha || dep.url || i}>
                <a
                  href={dep.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors border-l-2 ${
                    dep.isCurrent
                      ? 'border-[#00B5A3]'
                      : 'border-transparent'
                  } ${i < deployments.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
                >
                  {/* Branch badge */}
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                      dep.isCurrent
                        ? 'bg-[#00B5A3]/10 text-[#00B5A3]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {dep.branch}
                  </span>

                  {/* Commit message */}
                  <span className="flex-1 text-sm text-[#1B3A5C] truncate" title={dep.commitMessage}>
                    {truncate(dep.commitMessage, 60)}
                  </span>

                  {/* Relative time */}
                  <span className="text-xs text-[#6B7280] shrink-0">
                    {timeAgo(dep.createdAt)}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
