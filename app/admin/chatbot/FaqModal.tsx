'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FaqItem } from '@/lib/chatbot/types'
import { createFaqItem } from './chatbot-actions'

interface FaqModalProps {
  open: boolean
  onClose: () => void
  onCreated: (item: FaqItem) => void
}

export default function FaqModal({ open, onClose, onCreated }: FaqModalProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    setQuestion('')
    setAnswer('')
    setError(null)
    onClose()
  }, [onClose])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleClose])

  async function handleSave() {
    setError(null)
    if (!question.trim()) {
      setError('Question is required.')
      return
    }
    if (!answer.trim()) {
      setError('Answer is required.')
      return
    }
    setIsSaving(true)
    const result = await createFaqItem(question.trim(), answer.trim())
    setIsSaving(false)
    if (result.success) {
      onCreated(result.item)
      setQuestion('')
      setAnswer('')
    } else {
      setError(result.error)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="max-w-md w-full mx-4 bg-white rounded-xl border border-[#E5E7EB] shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Add FAQ Entry</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What question will users ask?"
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] placeholder-[#9CA3AF]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1">Answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Provide a clear, helpful answer..."
              rows={5}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] resize-y placeholder-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#4e87a0] hover:bg-[#3d6f85] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save FAQ'}
          </button>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
