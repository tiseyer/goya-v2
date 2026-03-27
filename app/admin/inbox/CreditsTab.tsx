'use client'

import { useState } from 'react'
import { approveCreditEntry, rejectCreditEntry } from './actions'

type CreditEntryProfile = {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
} | null

type CreditEntry = {
  id: string
  user_id: string
  credit_type: string
  amount: number
  activity_date: string
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  source: string | null
  created_at: string
  profile: CreditEntryProfile
}

interface Props {
  initialEntries: CreditEntry[]
}

const CREDIT_TYPE_LABELS: Record<string, string> = {
  ce_credit: 'CE Credits',
  karma_hours: 'Karma Hours',
  practice_hours: 'Practice Hours',
  teaching_hours: 'Teaching Hours',
  community_credits: 'Community Credits',
}

function formatCreditType(type: string): string {
  return CREDIT_TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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
  pending: 'bg-slate-50 text-slate-700 border border-slate-200',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200',
}

const SUB_TABS: Array<{ key: 'all' | 'pending' | 'approved' | 'rejected'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

export default function CreditsTab({ initialEntries }: Props) {
  const [entries, setEntries] = useState<CreditEntry[]>(initialEntries)
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const pendingCount = entries.filter(e => e.status === 'pending').length
  const filtered = activeSubTab === 'all'
    ? entries
    : entries.filter(e => e.status === activeSubTab)

  // Sort: pending first, then by created_at descending
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (a.status !== 'pending' && b.status === 'pending') return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  async function handleApprove(entryId: string) {
    setBusy(entryId)
    const result = await approveCreditEntry(entryId)
    if (result.success) {
      setEntries(prev =>
        prev.map(e => e.id === entryId ? { ...e, status: 'approved' as const } : e)
      )
    } else {
      alert(result.error)
    }
    setBusy(null)
  }

  async function handleReject(entryId: string) {
    setBusy(entryId)
    const result = await rejectCreditEntry(entryId, rejectReason)
    if (result.success) {
      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? { ...e, status: 'rejected' as const, rejection_reason: rejectReason }
            : e
        )
      )
      setRejectOpen(null)
      setRejectReason('')
    } else {
      alert(result.error)
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
      {sorted.length === 0 ? (
        <div className="p-16 text-center">
          <p className="font-semibold text-slate-700 mb-1">
            No {activeSubTab === 'all' ? '' : activeSubTab + ' '}credit entries
          </p>
          <p className="text-sm text-slate-400">
            {activeSubTab === 'pending'
              ? 'New credit submissions will appear here for review.'
              : 'Credit entries will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_0.7fr_1fr_0.8fr_0.7fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50 min-w-[800px]">
            {['USER', 'CREDIT TYPE', 'HOURS', 'ACTIVITY DATE', 'SUBMITTED', 'STATUS', 'ACTIONS'].map(col => (
              <span key={col} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {col}
              </span>
            ))}
          </div>

          <div className="divide-y divide-slate-100 min-w-[800px]">
            {sorted.map(entry => {
              const isBusy = busy === entry.id
              const initials = (entry.profile?.full_name?.[0] ?? entry.profile?.email?.[0] ?? '?').toUpperCase()

              return (
                <div key={entry.id}>
                  {/* Main row */}
                  <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_0.7fr_1fr_0.8fr_0.7fr_auto] gap-4 items-center">
                    {/* USER */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#4E87A0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {entry.profile?.avatar_url ? (
                          <img
                            src={entry.profile.avatar_url}
                            alt={entry.profile.full_name ?? ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#4E87A0]">{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1B3A5C] text-sm truncate">
                          {entry.profile?.full_name ?? 'Unknown user'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {entry.profile?.email ?? '—'}
                        </p>
                      </div>
                    </div>

                    {/* CREDIT TYPE */}
                    <div className="text-sm text-slate-600">
                      {formatCreditType(entry.credit_type)}
                    </div>

                    {/* HOURS */}
                    <div className="text-sm font-semibold text-[#1B3A5C]">
                      {entry.amount}
                    </div>

                    {/* ACTIVITY DATE */}
                    <div className="text-sm text-slate-500">
                      {formatDate(entry.activity_date)}
                    </div>

                    {/* SUBMITTED */}
                    <div className="text-sm text-slate-400">
                      {relativeDate(entry.created_at)}
                    </div>

                    {/* STATUS */}
                    <div>
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[entry.status]}`}>
                        {entry.status}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {entry.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(entry.id)}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            {isBusy ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => { setRejectOpen(entry.id); setRejectReason('') }}
                            disabled={isBusy}
                            className="px-2.5 py-1.5 text-xs font-semibold border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {entry.status === 'rejected' && entry.rejection_reason && (
                        <p className="text-xs text-slate-400 max-w-[200px] truncate" title={entry.rejection_reason}>
                          {entry.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Inline reject input */}
                  {rejectOpen === entry.id && (
                    <div className="px-6 pb-4">
                      <div className="flex items-center gap-2 max-w-sm ml-11">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleReject(entry.id)
                            if (e.key === 'Escape') setRejectOpen(null)
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleReject(entry.id)}
                          disabled={isBusy}
                          className="px-3 py-2 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          {isBusy ? '...' : 'Confirm Reject'}
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
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
