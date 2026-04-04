'use client'

import { useState } from 'react'
import { Sparkles, XCircle } from 'lucide-react'
import type { SupportTicket } from '@/lib/chatbot/types'
import { addToFaq, addToFaqForce, rejectUnanswered } from './actions'

interface UnansweredPanelProps {
  ticket: SupportTicket
  adminUserId: string
  onResolved: (updatedTicket: SupportTicket) => void
}

type Mode = 'idle' | 'generating' | 'editing' | 'rejecting'

const REJECTION_REASONS = [
  'Out of scope (not yoga related)',
  'Sensitive / inappropriate',
  'Duplicate of existing FAQ',
  'Other',
]

export default function UnansweredPanel({ ticket, adminUserId, onResolved }: UnansweredPanelProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [generatedAnswer, setGeneratedAnswer] = useState('')
  const [editedAnswer, setEditedAnswer] = useState('')
  const [rejectionReason, setRejectionReason] = useState(REJECTION_REASONS[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  async function handleGenerate() {
    setMode('generating')
    setGeneratedAnswer('')
    setError(null)

    try {
      const res = await fetch('/api/chatbot/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: ticket.question_summary }),
      })

      if (!res.ok || !res.body) {
        setError('Failed to generate answer. Please try again.')
        setMode('idle')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const parsed = JSON.parse(trimmed) as { type: string; content?: string; message?: string }
            if (parsed.type === 'token' && parsed.content) {
              accumulated += parsed.content
              setGeneratedAnswer(accumulated)
            } else if (parsed.type === 'done') {
              setEditedAnswer(accumulated)
              setMode('editing')
            } else if (parsed.type === 'error') {
              setError(parsed.message ?? 'Error generating answer.')
              setMode('idle')
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }

      // If stream ended without a 'done' event, finish editing anyway
      if (accumulated && mode === 'generating') {
        setEditedAnswer(accumulated)
        setMode('editing')
      }
    } catch {
      setError('Network error. Please try again.')
      setMode('idle')
    }
  }

  async function handleAddToFaq() {
    setSaving(true)
    setError(null)
    const result = await addToFaq(ticket.id, ticket.question_summary, editedAnswer, adminUserId)
    setSaving(false)

    if (result.success) {
      onResolved({ ...ticket, status: 'resolved' })
    } else if (result.error === 'duplicate') {
      setDuplicateWarning(true)
    } else {
      setError(result.error)
    }
  }

  async function handleAddToFaqForce() {
    setSaving(true)
    setError(null)
    const result = await addToFaqForce(ticket.id, ticket.question_summary, editedAnswer, adminUserId)
    setSaving(false)

    if (result.success) {
      onResolved({ ...ticket, status: 'resolved' })
    } else {
      setError(result.error)
      setDuplicateWarning(false)
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return
    setSaving(true)
    setError(null)
    const result = await rejectUnanswered(ticket.id, rejectionReason, adminUserId)
    setSaving(false)

    if (result.success) {
      onResolved({ ...ticket, status: 'resolved', rejection_reason: rejectionReason })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="border-t border-[#E5E7EB] bg-amber-50/30 px-5 py-4">
      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
        Unanswered Question
      </p>

      {error && (
        <p className="text-xs text-rose-600 mb-3">{error}</p>
      )}

      {/* Idle mode — two primary action buttons */}
      {mode === 'idle' && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-[#00B5A3] text-white hover:bg-[#009d8d] transition-colors"
          >
            <Sparkles size={15} />
            Mattea answers this
          </button>
          <button
            onClick={() => setMode('rejecting')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <XCircle size={15} />
            Mattea won&apos;t answer this
          </button>
        </div>
      )}

      {/* Generating mode — show question + streaming answer */}
      {mode === 'generating' && (
        <div className="space-y-3">
          <div className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
            <p className="text-xs font-semibold text-slate-500 mb-1">Question</p>
            <p className="text-sm text-[#374151]">{ticket.question_summary}</p>
          </div>
          <div className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2 min-h-[80px]">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold text-[#00B5A3]">Generating answer</p>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00B5A3] animate-pulse" />
            </div>
            <p className="text-sm text-[#374151] whitespace-pre-wrap">
              {generatedAnswer}
              {!generatedAnswer && <span className="text-slate-400 italic">Mattea is thinking...</span>}
            </p>
          </div>
        </div>
      )}

      {/* Editing mode — editable textarea + action buttons */}
      {mode === 'editing' && (
        <div className="space-y-3">
          <div className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-2">
            <p className="text-xs font-semibold text-slate-500 mb-1">Question</p>
            <p className="text-sm text-[#374151]">{ticket.question_summary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Answer (editable)</p>
            <textarea
              value={editedAnswer}
              onChange={(e) => setEditedAnswer(e.target.value)}
              rows={6}
              className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151] resize-y disabled:opacity-60"
              disabled={saving}
            />
          </div>

          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3">
              <p className="text-sm font-semibold text-amber-800 mb-2">
                A similar question already exists in the FAQ. Add anyway?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddToFaqForce}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Yes, add'}
                </button>
                <button
                  onClick={() => setDuplicateWarning(false)}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!duplicateWarning && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddToFaq}
                disabled={saving || !editedAnswer.trim()}
                className="px-3 py-2 text-sm font-semibold rounded-lg bg-[#00B5A3] text-white hover:bg-[#009d8d] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Add to FAQ'}
              </button>
              <button
                onClick={() => { setMode('idle'); setGeneratedAnswer(''); setEditedAnswer(''); setError(null) }}
                disabled={saving}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rejecting mode — reason dropdown + confirm */}
      {mode === 'rejecting' && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Rejection reason</p>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={saving}
              className="w-full text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00B5A3] bg-white text-[#374151] disabled:opacity-60"
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReject}
              disabled={saving}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-slate-700 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Confirm rejection'}
            </button>
            <button
              onClick={() => { setMode('idle'); setError(null) }}
              disabled={saving}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
