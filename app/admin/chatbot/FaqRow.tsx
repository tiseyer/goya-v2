'use client'

import { useState } from 'react'
import type { FaqItem, FaqStatus } from '@/lib/chatbot/types'
import { updateFaqItem, deleteFaqItem, toggleFaqStatus } from './chatbot-actions'

interface FaqRowProps {
  item: FaqItem
  isExpanded: boolean
  onExpand: (id: string | null) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, item: FaqItem) => void
}

export default function FaqRow({ item, isExpanded, onExpand, onDelete, onUpdate }: FaqRowProps) {
  const [question, setQuestion] = useState(item.question)
  const [answer, setAnswer] = useState(item.answer)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [optimisticStatus, setOptimisticStatus] = useState<FaqStatus>(item.status)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function handleEditClick() {
    // Reset textarea values to latest item values
    setQuestion(item.question)
    setAnswer(item.answer)
    onExpand(isExpanded ? null : item.id)
  }

  function handleDiscard() {
    setQuestion(item.question)
    setAnswer(item.answer)
    onExpand(null)
  }

  async function handleSave() {
    setIsSaving(true)
    const result = await updateFaqItem(item.id, question, answer)
    setIsSaving(false)
    if (result.success) {
      onUpdate(item.id, { ...item, question, answer })
      onExpand(null)
    }
  }

  async function handleToggleStatus() {
    if (isTogglingStatus) return
    const newStatus: FaqStatus = optimisticStatus === 'published' ? 'draft' : 'published'
    setOptimisticStatus(newStatus)
    setIsTogglingStatus(true)
    const result = await toggleFaqStatus(item.id, newStatus)
    setIsTogglingStatus(false)
    if (!result.success) {
      // Revert
      setOptimisticStatus(item.status)
    } else {
      onUpdate(item.id, { ...item, status: newStatus })
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    const result = await deleteFaqItem(item.id)
    if (result.success) {
      onDelete(item.id)
    } else {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formattedDate = new Date(item.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <tr
        className={`border-b border-slate-100 hover:bg-slate-50 transition-opacity ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
      >
        {/* Question */}
        <td className="px-4 py-3 text-sm text-[#374151] max-w-0">
          <p className="line-clamp-1">{item.question}</p>
        </td>
        {/* Answer */}
        <td className="px-4 py-3 text-sm text-[#374151] max-w-0">
          <p className="line-clamp-1">{item.answer}</p>
        </td>
        {/* Status */}
        <td className="px-4 py-3">
          <button
            onClick={handleToggleStatus}
            disabled={isDeleting}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold transition-opacity ${
              isTogglingStatus ? 'opacity-60' : 'opacity-100'
            } ${
              optimisticStatus === 'published'
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            {optimisticStatus === 'published' ? 'Published' : 'Draft'}
          </button>
        </td>
        {/* Created */}
        <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{formattedDate}</td>
        {/* By */}
        <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">
          {item.creator_name ?? 'System'}
        </td>
        {/* Actions */}
        <td className="px-4 py-3">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#374151]">Sure?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
              >
                Keep Entry
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEditClick}
                disabled={isDeleting}
                className="text-sm font-semibold text-[#4e87a0] hover:text-[#3d6f85] disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* Expanded edit area */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-1">
                  Question
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] resize-y bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7280] mb-1">
                  Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] resize-y bg-white"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[#4e87a0] hover:bg-[#3d6f85] text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleDiscard}
                  disabled={isSaving}
                  className="text-sm text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                  Discard Changes
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
