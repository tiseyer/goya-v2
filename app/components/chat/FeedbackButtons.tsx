'use client'

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'

interface FeedbackButtonsProps {
  sessionId: string | null
  visible: boolean     // false while streaming, true after done
  compact?: boolean    // smaller variant for search hints
}

export default function FeedbackButtons({ sessionId, visible, compact: _compact }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!visible) return null

  async function handleClick(value: 'helpful' | 'not_helpful') {
    if (submitting || feedback !== null || !sessionId) return

    setSubmitting(true)
    setFeedback(value)

    try {
      await fetch(`/api/chatbot/conversations/${sessionId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: value }),
      })
    } catch {
      // Non-fatal — feedback is best-effort
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || feedback !== null || !sessionId

  return (
    <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity">
      <button
        type="button"
        onClick={() => handleClick('helpful')}
        disabled={disabled}
        aria-label="Helpful"
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:cursor-default"
      >
        <ThumbsUp
          className={`w-3.5 h-3.5 transition-colors ${
            feedback === 'helpful'
              ? 'text-green-500 fill-green-500'
              : 'text-slate-400'
          }`}
        />
      </button>

      <button
        type="button"
        onClick={() => handleClick('not_helpful')}
        disabled={disabled}
        aria-label="Not helpful"
        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:cursor-default"
      >
        <ThumbsDown
          className={`w-3.5 h-3.5 transition-colors ${
            feedback === 'not_helpful'
              ? 'text-red-400 fill-red-400'
              : 'text-slate-400'
          }`}
        />
      </button>

      {feedback !== null && (
        <span className="text-xs text-slate-400 ml-0.5 animate-[fadeIn_200ms_ease]">
          Thanks!
        </span>
      )}
    </div>
  )
}
