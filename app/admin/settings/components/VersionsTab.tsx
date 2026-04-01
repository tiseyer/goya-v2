'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Deployment } from '@/app/api/admin/deployments/route'

interface DeploymentsData {
  deployments: Deployment[]
  current: {
    branch: string
    commitSha: string
    environment: string
  }
}

interface BranchGroup {
  branch: string
  latestDeployment: Deployment
  deploymentCount: number
  isCurrent: boolean
}

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
  return str.length > max ? str.slice(0, max) + '...' : str
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#E5E7EB]">
        <h3 className="text-sm font-semibold text-[#1B3A5C]">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

export default function VersionsTab() {
  const [data, setData] = useState<DeploymentsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notConfigured, setNotConfigured] = useState(false)
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
        setError('Unable to load deployment data')
        setLoading(false)
        setFetching(false)
        return
      }
      const json = (await res.json()) as DeploymentsData
      setData(json)
      setError(null)
      setNotConfigured(false)
    } catch {
      setError('Unable to load deployment data')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Group deployments by branch
  const branches: BranchGroup[] = useMemo(() => {
    if (!data) return []
    const groups = new Map<string, { deployments: Deployment[] }>()
    for (const dep of data.deployments) {
      const branch = dep.branch || 'unknown'
      if (!groups.has(branch)) {
        groups.set(branch, { deployments: [] })
      }
      groups.get(branch)!.deployments.push(dep)
    }

    return Array.from(groups.entries())
      .map(([branch, group]) => ({
        branch,
        latestDeployment: group.deployments[0],
        deploymentCount: group.deployments.length,
        isCurrent: branch === data.current.branch,
      }))
      .sort((a, b) => {
        // Current branch first, then by latest deployment time
        if (a.isCurrent) return -1
        if (b.isCurrent) return 1
        return new Date(b.latestDeployment.createdAt).getTime() - new Date(a.latestDeployment.createdAt).getTime()
      })
  }, [data])

  const currentBranch = data?.current.branch ?? ''
  const isFeatureBranch = currentBranch && currentBranch !== 'develop' && currentBranch !== 'main'

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse h-32" />
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm animate-pulse h-48" />
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm">
        <p className="text-sm text-[#6B7280]">
          Vercel API not configured. Set{' '}
          <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_ACCESS_TOKEN</code>{' '}
          and{' '}
          <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">VERCEL_PROJECT_ID</code>{' '}
          environment variables.
        </p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm flex items-center justify-between gap-4">
        <p className="text-sm text-[#6B7280]">{error}</p>
        <button onClick={fetchData} className="text-xs text-[#00B5A3] font-medium hover:underline shrink-0 cursor-pointer">
          Retry
        </button>
      </div>
    )
  }

  const current = data?.current ?? { branch: '', commitSha: '', environment: '' }
  const deployments = data?.deployments ?? []

  return (
    <div className="space-y-5">
      {/* Refresh button */}
      <div className="flex items-center justify-end">
        <button
          onClick={fetchData}
          disabled={fetching}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#374151] bg-white border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <svg className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Feature branch warning */}
      {isFeatureBranch && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 text-yellow-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs font-medium text-yellow-800">
            You are viewing branch: <span className="font-mono font-bold">{currentBranch}</span>
          </p>
        </div>
      )}

      {/* ═══ SECTION 1: Branches ═══ */}
      <Card title="Branches">
        {/* Current Branch */}
        {current.branch && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Current Branch</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00B5A3]/10 text-[#00B5A3]">
                {current.branch}
              </span>
              {current.commitSha && (
                <span className="font-mono text-xs text-[#6B7280]">{current.commitSha.slice(0, 7)}</span>
              )}
              {current.environment && (
                <span className="text-xs text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">{current.environment}</span>
              )}
            </div>
          </div>
        )}

        {/* All Branches */}
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">All Branches</p>
        {branches.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No branches found</p>
        ) : (
          <div className="space-y-2">
            {branches.map((b) => (
              <div
                key={b.branch}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                  b.isCurrent
                    ? 'border-[#00B5A3]/30 bg-[#00B5A3]/5'
                    : 'border-[#E5E7EB] bg-white hover:bg-slate-50'
                }`}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  b.isCurrent
                    ? 'bg-[#00B5A3]/10 text-[#00B5A3]'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {b.branch}
                </span>
                <span className="flex-1 text-sm text-[#374151] truncate" title={b.latestDeployment.commitMessage}>
                  {truncate(b.latestDeployment.commitMessage, 50)}
                </span>
                <span className="text-xs text-[#6B7280] shrink-0">{timeAgo(b.latestDeployment.createdAt)}</span>
                <a
                  href={b.latestDeployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-[#00B5A3] text-[#00B5A3] bg-white hover:bg-[#00B5A3]/5 transition-colors font-medium shrink-0 cursor-pointer"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ═══ SECTION 2: Deployments ═══ */}
      <Card title="Deployments">
        {/* Current Deployment */}
        {(current.branch || current.commitSha) && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Current Deployment</p>
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg">
              {current.branch && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00B5A3]/10 text-[#00B5A3]">
                  {current.branch}
                </span>
              )}
              {current.commitSha && (
                <span className="font-mono text-xs text-[#6B7280] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
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

        {/* Recent Deployments */}
        <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Recent Deployments</p>
        {deployments.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No deployments found</p>
        ) : (
          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
            {deployments.map((dep, i) => (
              <a
                key={dep.commitSha || dep.url || i}
                href={dep.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-l-2 ${
                  dep.isCurrent ? 'border-l-[#00B5A3]' : 'border-l-transparent'
                } ${i < deployments.length - 1 ? 'border-b border-[#E5E7EB]' : ''}`}
              >
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  dep.isCurrent ? 'bg-[#00B5A3]/10 text-[#00B5A3]' : 'bg-slate-100 text-slate-700'
                }`}>
                  {dep.branch}
                </span>
                <span className="flex-1 text-sm text-[#1B3A5C] truncate" title={dep.commitMessage}>
                  {truncate(dep.commitMessage, 60)}
                </span>
                <span className="text-xs text-[#6B7280] shrink-0">{timeAgo(dep.createdAt)}</span>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
