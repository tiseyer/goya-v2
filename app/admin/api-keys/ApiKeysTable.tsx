'use client'

import { useState } from 'react'
import type { ApiKeyRow, ApiKeyPermission } from '@/lib/api/types'
import { createApiKey, revokeApiKey } from './actions'

const ALL_PERMISSIONS: ApiKeyPermission[] = ['read', 'write', 'admin']

const PERMISSION_PILL: Record<ApiKeyPermission, string> = {
  read: 'bg-blue-100 text-blue-700',
  write: 'bg-amber-100 text-amber-700',
  admin: 'bg-purple-100 text-purple-700',
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never'
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

function formatAbsolute(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ApiKeysTable({ initialKeys }: { initialKeys: ApiKeyRow[] }) {
  const [keys, setKeys] = useState<ApiKeyRow[]>(initialKeys)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyPermissions, setNewKeyPermissions] = useState<Set<ApiKeyPermission>>(
    new Set(['read']),
  )
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function togglePermission(perm: ApiKeyPermission) {
    setNewKeyPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(perm)) {
        next.delete(perm)
      } else {
        next.add(perm)
      }
      return next
    })
  }

  async function handleCreate() {
    if (!newKeyName.trim()) return
    if (newKeyPermissions.size === 0) {
      setCreateError('Select at least one permission.')
      return
    }

    setCreating(true)
    setCreateError(null)

    const result = await createApiKey(newKeyName.trim(), Array.from(newKeyPermissions))

    if (!result.success) {
      setCreateError(result.error)
      setCreating(false)
      return
    }

    // Optimistically prepend a placeholder key row — page revalidation will sync the real row
    const placeholderRow: ApiKeyRow = {
      id: `pending-${Date.now()}`,
      key_hash: '',
      key_prefix: result.rawKey.slice(0, 8),
      name: newKeyName.trim(),
      permissions: Array.from(newKeyPermissions),
      created_by: null,
      last_used_at: null,
      request_count: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setKeys((prev) => [placeholderRow, ...prev])
    setCreatedRawKey(result.rawKey)
    setShowCreateForm(false)
    setNewKeyName('')
    setNewKeyPermissions(new Set(['read']))
    setCreating(false)
  }

  async function handleRevoke(keyId: string) {
    setRevoking(keyId)

    // Optimistic update
    setKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, active: false } : k)))

    await revokeApiKey(keyId)
    setRevoking(null)
  }

  async function handleCopy() {
    if (!createdRawKey) return
    try {
      await navigator.clipboard.writeText(createdRawKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text manually
    }
  }

  return (
    <div>
      {/* "Key created" banner — shown exactly once after creation */}
      {createdRawKey && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">
                New API key created
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Copy this key now. It will not be shown again.
              </p>
            </div>
            <button
              onClick={() => setCreatedRawKey(null)}
              className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 min-w-0 block bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs font-mono text-[#374151] break-all">
              {createdRawKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      {showCreateForm ? (
        <div className="mb-6 bg-white border border-[#E5E7EB] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#1B3A5C] mb-4">Create API Key</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">
                Key Name
              </label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Make.com Integration"
                className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
                required
              />
            </div>
            <div>
              <p className="text-xs font-medium text-[#374151] mb-1.5">Permissions</p>
              <div className="flex items-center gap-4">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newKeyPermissions.has(perm)}
                      onChange={() => togglePermission(perm)}
                      className="rounded border-[#E5E7EB] text-[#00B5A3] focus:ring-[#00B5A3]"
                    />
                    <span className="text-sm text-[#374151] capitalize">{perm}</span>
                  </label>
                ))}
              </div>
            </div>
            {createError && (
              <p className="text-xs text-red-600">{createError}</p>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] hover:bg-[#142d47] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Key'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setCreateError(null)
                  setNewKeyName('')
                  setNewKeyPermissions(new Set(['read']))
                }}
                className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142d47] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Key
          </button>
        </div>
      )}

      {/* Table */}
      {keys.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
          <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          <p className="text-sm font-medium text-[#374151]">No API keys yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Key Prefix</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Used</th>
                  <th className="px-4 py-3">Requests</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-[#1B3A5C]">{key.name}</span>
                    </td>

                    {/* Key prefix */}
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-[#374151] bg-slate-100 px-1.5 py-0.5 rounded">
                        {key.key_prefix}...
                      </code>
                    </td>

                    {/* Permission pills */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(key.permissions ?? []).map((perm) => (
                          <span
                            key={perm}
                            className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${PERMISSION_PILL[perm] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status pill */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${key.active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {key.active ? 'Active' : 'Revoked'}
                      </span>
                    </td>

                    {/* Last used */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#6B7280]">{formatRelative(key.last_used_at)}</span>
                    </td>

                    {/* Request count */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#374151]">{key.request_count.toLocaleString()}</span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#6B7280]">{formatAbsolute(key.created_at)}</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {key.active && (
                        <button
                          onClick={() => handleRevoke(key.id)}
                          disabled={revoking === key.id}
                          className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Revoke this API key"
                        >
                          {revoking === key.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth={2} className="opacity-25" />
                              <path strokeLinecap="round" strokeWidth={2} d="M4 12a8 8 0 018-8" className="opacity-75" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
