'use client'

import { useState } from 'react'
import { approveUpgradeRequest, rejectUpgradeRequest } from './actions'

type UpgradeRequestProfile = {
  id: string
  full_name: string | null
  email: string | null
  role: string
  created_at: string
} | null

type UpgradeRequest = {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  certificate_urls: string[]
  stripe_payment_intent_id: string | null
  stripe_subscription_id: string | null
  rejection_reason: string | null
  created_at: string
  reviewed_at: string | null
  profile: UpgradeRequestProfile
}

interface Props {
  initialRequests: UpgradeRequest[]
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

const STATUS_STYLES: Record<'pending' | 'approved' | 'rejected', string> = {
  pending:  'bg-amber-50 text-amber-700 border border-amber-200',
  approved: 'bg-green-50 text-green-700 border border-green-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
}

const SUB_TABS: Array<{ key: 'pending' | 'approved' | 'rejected'; label: string }> = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function TeacherUpgradesTab({ initialRequests }: Props) {
  const [requests, setRequests] = useState<UpgradeRequest[]>(initialRequests)
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const filtered = requests.filter(r => r.status === activeSubTab)

  async function handleApprove(requestId: string) {
    setBusy(requestId)
    const result = await approveUpgradeRequest(requestId)
    if (result.success) {
      setRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r)
      )
    } else {
      alert(result.error)
    }
    setBusy(null)
  }

  async function handleReject(requestId: string) {
    setBusy(requestId)
    const result = await rejectUpgradeRequest(requestId, rejectReason)
    if (result.success) {
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'rejected', rejection_reason: rejectReason }
            : r
        )
      )
      setRejectOpen(null)
      setRejectReason('')
    }
    setBusy(null)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Sub-tab bar */}
      <div className="flex gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50">
        {SUB_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`text-sm font-semibold pb-1 transition-colors ${
              activeSubTab === tab.key
                ? 'text-[#1B3A5C] border-b-2 border-[#1B3A5C]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
          <p className="font-semibold text-slate-700 mb-1">No {activeSubTab} upgrade requests</p>
          <p className="text-sm text-slate-400">
            {activeSubTab === 'pending'
              ? 'New upgrade requests will appear here.'
              : `${activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)} requests will appear here.`}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filtered.map(req => (
            <div key={req.id} className="border-b border-slate-100 last:border-0">
              {/* Card main row */}
              <div className="px-6 py-5 flex flex-col md:flex-row md:items-start gap-4">

                {/* Left: User info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-[#1B3A5C] text-sm">
                    {req.profile?.full_name ?? req.profile?.email ?? 'Unknown user'}
                  </p>
                  <p className="text-xs text-slate-500">{req.profile?.email ?? '—'}</p>
                  <p className="text-xs text-slate-400 capitalize">
                    Role: {req.profile?.role ?? '—'} · Member since: {req.profile?.created_at ? relativeDate(req.profile.created_at) : '—'}
                  </p>
                </div>

                {/* Middle: Certificates */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Certificates</p>
                  {req.certificate_urls.length === 0 ? (
                    <p className="text-xs text-slate-400">No files</p>
                  ) : (
                    req.certificate_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-[#00B5A3] hover:underline truncate"
                      >
                        Certificate {i + 1}
                      </a>
                    ))
                  )}
                </div>

                {/* Right: Payment + meta */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Payment</p>
                  <p className="text-xs text-slate-600 font-mono truncate">
                    {req.stripe_payment_intent_id ?? '—'}
                  </p>
                  <p className="text-xs text-slate-400">$39.00 authorized</p>
                  <p className="text-xs text-slate-400 mt-1">Submitted {relativeDate(req.created_at)}</p>
                </div>

                {/* Actions + status */}
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[req.status]}`}>
                    {req.status}
                  </span>

                  {req.status === 'pending' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={busy === req.id}
                        className="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        {busy === req.id ? '…' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => { setRejectOpen(req.id); setRejectReason('') }}
                        disabled={busy === req.id}
                        className="px-2.5 py-1.5 text-xs font-semibold border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {req.status === 'rejected' && req.rejection_reason && (
                    <p className="text-xs text-slate-400 max-w-[200px] text-right">Reason: {req.rejection_reason}</p>
                  )}
                </div>
              </div>

              {/* Inline reject input */}
              {rejectOpen === req.id && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 max-w-sm ml-4">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleReject(req.id)
                        if (e.key === 'Escape') setRejectOpen(null)
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={busy === req.id}
                      className="px-3 py-2 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {busy === req.id ? '…' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => setRejectOpen(null)}
                      className="px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
