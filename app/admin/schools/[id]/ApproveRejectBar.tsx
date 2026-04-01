'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { approveSchool, rejectSchool } from '@/app/admin/schools/actions'

interface Props {
  schoolId: string
}

export default function ApproveRejectBar({ schoolId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleApprove() {
    setBusy('approve')
    setFeedback(null)
    const result = await approveSchool(schoolId)
    if (result.success) {
      setFeedback({ type: 'success', message: 'School approved successfully.' })
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: result.error ?? 'Failed to approve school.' })
    }
    setBusy(null)
  }

  async function handleReject() {
    if (!rejectReason.trim()) return
    setBusy('reject')
    setFeedback(null)
    const result = await rejectSchool(schoolId, rejectReason.trim())
    if (result.success) {
      setFeedback({ type: 'success', message: 'School rejected.' })
      setRejectOpen(false)
      setRejectReason('')
      router.refresh()
    } else {
      setFeedback({ type: 'error', message: result.error ?? 'Failed to reject school.' })
    }
    setBusy(null)
  }

  return (
    <div className="mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-[#1B3A5C]">Review Decision</p>
          <p className="text-xs text-slate-500 mt-0.5">Approve or reject this school registration.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleApprove}
            disabled={busy !== null}
            className="px-5 py-2 text-sm font-semibold bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-40"
          >
            {busy === 'approve' ? 'Approving…' : '✓ Approve School'}
          </button>
          <button
            onClick={() => { setRejectOpen(v => !v); setFeedback(null) }}
            disabled={busy !== null}
            className="px-5 py-2 text-sm font-semibold border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-40"
          >
            ✕ Reject School
          </button>
        </div>
      </div>

      {/* Reject inline input */}
      {rejectOpen && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <label className="block text-xs font-medium text-slate-700 mb-1.5">
            Rejection reason <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-start gap-2">
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Explain why this school is being rejected…"
              rows={3}
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none"
              autoFocus
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={handleReject}
                disabled={busy !== null || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {busy === 'reject' ? '…' : 'Confirm Reject'}
              </button>
              <button
                onClick={() => { setRejectOpen(false); setRejectReason('') }}
                className="px-4 py-2 text-sm font-semibold border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`mt-3 text-sm px-4 py-2.5 rounded-xl font-medium ${
          feedback.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {feedback.message}
        </div>
      )}
    </div>
  )
}
