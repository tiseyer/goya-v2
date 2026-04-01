'use client'

import { useState } from 'react'
import type { AiProviderKeyItem } from './secrets-actions'
import { listAiProviderKeys, deleteSecret } from './secrets-actions'
import { AI_PROVIDERS } from '@/lib/secrets/ai-providers'
import AiProviderModal from './AiProviderModal'

interface AiProvidersSectionProps {
  initialKeys: AiProviderKeyItem[]
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) !== 1 ? 's' : ''} ago`
}

type ModalState =
  | null
  | { mode: 'create' }
  | { mode: 'edit'; key: AiProviderKeyItem }

export default function AiProvidersSection({ initialKeys }: AiProvidersSectionProps) {
  const [keys, setKeys] = useState<AiProviderKeyItem[]>(initialKeys)
  const [modalState, setModalState] = useState<ModalState>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleRefresh() {
    const result = await listAiProviderKeys()
    if (result.success) {
      setKeys(result.keys)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    // Optimistically remove
    setKeys((prev) => prev.filter((k) => k.id !== id))
    setDeleteConfirmId(null)
    await deleteSecret(id)
    setDeleting(null)
  }

  function getProviderLabel(providerId: string): string {
    return AI_PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId
  }

  return (
    <div>
      {/* Section heading row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">AI Providers</h2>
        <button
          onClick={() => setModalState({ mode: 'create' })}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142d47] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add AI Provider Key
        </button>
      </div>

      {/* Empty state or table */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
          <svg
            className="w-8 h-8 text-slate-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-sm font-medium text-[#374151]">No AI provider keys yet</p>
          <p className="text-xs text-[#6B7280] mt-1">
            Add an OpenAI or Anthropic key to power the chatbot.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 w-[120px]">Provider</th>
                  <th className="px-4 py-3 w-[160px]">Model</th>
                  <th className="px-4 py-3 w-[140px]">Added</th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-[#1B3A5C] font-mono">
                        {key.key_name}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#374151]">
                        {getProviderLabel(key.provider)}
                      </span>
                    </td>

                    {/* Model */}
                    <td className="px-4 py-3">
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        {key.model}
                      </span>
                    </td>

                    {/* Added */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#6B7280]">
                        {formatRelative(key.created_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {deleteConfirmId === key.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-[#374151]">Sure?</span>
                          <button
                            onClick={() => handleDelete(key.id)}
                            disabled={deleting === key.id}
                            className="px-2 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deleting === key.id ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded text-xs font-medium text-[#374151] border border-[#E5E7EB] hover:bg-slate-50 transition-colors"
                          >
                            Keep Key
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setModalState({ mode: 'edit', key })}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-[#1B3A5C] border border-[#E5E7EB] hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(key.id)}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalState !== null && (
        <AiProviderModal
          mode={modalState.mode}
          existingKey={modalState.mode === 'edit' ? modalState.key : undefined}
          onClose={() => setModalState(null)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  )
}
