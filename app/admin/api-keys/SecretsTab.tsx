'use client'

// Seed data (Google OAuth, GA4, Clarity, Meta Pixel, Anthropic) is expected to exist
// on first load — seeded by seedSecrets() called from page.tsx server component.

import { useState } from 'react'
import type { SecretListItem, SecretCategory } from './secrets-actions'
import { listSecrets, deleteSecret } from './secrets-actions'
import SecretModal from './SecretModal'

const CATEGORIES: SecretCategory[] = ['Auth', 'Analytics', 'Payments', 'AI', 'Other']

const CATEGORY_BADGE: Record<SecretCategory, string> = {
  Auth: 'bg-blue-100 text-blue-700',
  Analytics: 'bg-emerald-100 text-emerald-700',
  Payments: 'bg-amber-100 text-amber-700',
  AI: 'bg-purple-100 text-purple-700',
  Other: 'bg-slate-100 text-slate-700',
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
  | { mode: 'edit'; secret: SecretListItem }

export default function SecretsTab({ initialSecrets }: { initialSecrets: SecretListItem[] }) {
  const [secrets, setSecrets] = useState<SecretListItem[]>(initialSecrets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SecretCategory | 'All'>('All')
  const [modalState, setModalState] = useState<ModalState>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Client-side filtering — both category and search active simultaneously
  const filtered = secrets.filter((s) => {
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory
    const matchesSearch = s.key_name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  async function handleRefresh() {
    const result = await listSecrets()
    if (result.success) {
      setSecrets(result.secrets)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    // Optimistically remove
    setSecrets((prev) => prev.filter((s) => s.id !== id))
    setDeleteConfirmId(null)
    await deleteSecret(id)
    setDeleting(null)
  }

  return (
    <div>
      {/* Toolbar: category filter + search + add button */}
      <div className="mb-4 flex flex-wrap items-center gap-3 justify-between">
        {/* Category filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === 'All'
                ? 'bg-[#1B3A5C] text-white'
                : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#1B3A5C] text-white'
                  : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right side: search + add */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent w-44"
            />
          </div>

          {/* Add Secret button */}
          <button
            onClick={() => setModalState({ mode: 'create' })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142d47] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Secret
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
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
          <p className="text-sm font-medium text-[#374151]">
            {searchQuery || selectedCategory !== 'All'
              ? 'No secrets match your filters.'
              : 'No secrets yet. Add one to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((secret) => (
                  <tr key={secret.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#1B3A5C] font-mono">
                        {secret.key_name}
                      </span>
                    </td>

                    {/* Category badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_BADGE[secret.category] ?? 'bg-slate-100 text-slate-700'}`}
                      >
                        {secret.category}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-sm text-[#6B7280] truncate block">
                        {secret.description || '—'}
                      </span>
                    </td>

                    {/* Last updated */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#6B7280]">
                        {formatRelative(secret.updated_at)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {deleteConfirmId === secret.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#374151]">Sure?</span>
                          <button
                            onClick={() => handleDelete(secret.id)}
                            disabled={deleting === secret.id}
                            className="px-2 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deleting === secret.id ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded text-xs font-medium text-[#374151] border border-[#E5E7EB] hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModalState({ mode: 'edit', secret })}
                            className="px-3 py-1 rounded-lg text-xs font-medium text-[#1B3A5C] border border-[#E5E7EB] hover:bg-slate-50 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(secret.id)}
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

          {/* Stripe info note */}
          <div className="px-4 py-3 border-t border-[#F1F5F9] bg-slate-50">
            <p className="text-xs text-[#6B7280]">
              Stripe keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.) are managed via environment variables, not this secrets manager.
            </p>
          </div>
        </div>
      )}

      {/* Stripe note shown below empty state too */}
      {filtered.length === 0 && (
        <p className="mt-3 text-xs text-[#6B7280]">
          Stripe keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, etc.) are managed via environment variables, not this secrets manager.
        </p>
      )}

      {/* Create / Edit modal */}
      {modalState !== null && (
        <SecretModal
          mode={modalState.mode}
          secret={modalState.mode === 'edit' ? modalState.secret : undefined}
          onClose={() => setModalState(null)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  )
}
