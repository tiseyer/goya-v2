'use client'

import { useState } from 'react'
import type { Flow, FlowDisplayType, FlowTriggerType } from '@/lib/flows/types'

interface CreateFlowModalProps {
  open: boolean
  onClose: () => void
  onCreated: (flow: Flow) => void
}

const DISPLAY_TYPE_LABELS: Record<FlowDisplayType, string> = {
  modal: 'Modal',
  fullscreen: 'Fullscreen',
  top_banner: 'Top Banner',
  bottom_banner: 'Bottom Banner',
  notification: 'Notification',
}

const TRIGGER_TYPE_LABELS: Record<FlowTriggerType, string> = {
  login: 'On Login',
  manual: 'Manual',
  page_load: 'Page Load',
}

export default function CreateFlowModal({ open, onClose, onCreated }: CreateFlowModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [displayType, setDisplayType] = useState<FlowDisplayType>('modal')
  const [triggerType, setTriggerType] = useState<FlowTriggerType>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          display_type: displayType,
          trigger_type: triggerType,
          status: 'draft',
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create flow')
      }

      const newFlow: Flow = await res.json()
      onCreated(newFlow)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setName('')
    setDescription('')
    setDisplayType('modal')
    setTriggerType('login')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-[#1B3A5C]">Create Flow</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="flow-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="flow-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Welcome Onboarding"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="flow-description" className="block text-sm font-medium text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="flow-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this flow do?"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent resize-none"
            />
          </div>

          {/* Display Type */}
          <div>
            <label htmlFor="flow-display-type" className="block text-sm font-medium text-slate-700 mb-1">
              Display Type
            </label>
            <select
              id="flow-display-type"
              value={displayType}
              onChange={e => setDisplayType(e.target.value as FlowDisplayType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent bg-white"
            >
              {(Object.keys(DISPLAY_TYPE_LABELS) as FlowDisplayType[]).map(dt => (
                <option key={dt} value={dt}>{DISPLAY_TYPE_LABELS[dt]}</option>
              ))}
            </select>
          </div>

          {/* Trigger */}
          <div>
            <label htmlFor="flow-trigger" className="block text-sm font-medium text-slate-700 mb-1">
              Trigger
            </label>
            <select
              id="flow-trigger"
              value={triggerType}
              onChange={e => setTriggerType(e.target.value as FlowTriggerType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent bg-white"
            >
              {(Object.keys(TRIGGER_TYPE_LABELS) as FlowTriggerType[]).map(tt => (
                <option key={tt} value={tt}>{TRIGGER_TYPE_LABELS[tt]}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2 bg-[#00B5A3] text-white text-sm font-semibold rounded-lg hover:bg-[#009e8e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Flow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
