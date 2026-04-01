'use client'

import { useState, useEffect } from 'react'
import type { SecretListItem, SecretCategory } from './secrets-actions'
import { createSecret, getSecret, updateSecret } from './secrets-actions'

const CATEGORIES: SecretCategory[] = ['Auth', 'Analytics', 'Payments', 'AI', 'Other']

interface SecretModalProps {
  mode: 'create' | 'edit'
  secret?: SecretListItem
  onClose: () => void
  onSaved: () => void
}

export default function SecretModal({ mode, secret, onClose, onSaved }: SecretModalProps) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<SecretCategory>('Other')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [maskedValue, setMaskedValue] = useState<string | null>(null)
  const [fullValue, setFullValue] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Load existing data in edit mode
  useEffect(() => {
    if (mode === 'edit' && secret) {
      setName(secret.key_name)
      setCategory(secret.category)
      setDescription(secret.description ?? '')
      // Fetch decrypted value for masked preview
      getSecret(secret.id).then((result) => {
        if (result.success) {
          const val = result.secret.value
          setFullValue(val)
          if (!val || val === 'REPLACE_ME') {
            setMaskedValue(null)
          } else if (val.length < 10) {
            setMaskedValue('••••••••')
          } else {
            setMaskedValue(`${val.slice(0, 6)}••••••••${val.slice(-4)}`)
          }
        }
      })
    }
  }, [mode, secret])

  function handleCopy() {
    if (fullValue) {
      navigator.clipboard.writeText(fullValue)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'create') {
        const result = await createSecret(name.trim(), value, category, description.trim())
        if (!result.success) {
          setError(result.error)
          setLoading(false)
          return
        }
      } else {
        if (!secret) return
        const fields: { key_name?: string; value?: string; category?: SecretCategory; description?: string } = {
          key_name: name.trim(),
          category,
          description: description.trim(),
        }
        // Only send value if admin typed something new
        if (value) {
          fields.value = value
        }
        const result = await updateSecret(secret.id, fields)
        if (!result.success) {
          setError(result.error)
          setLoading(false)
          return
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[#1B3A5C]">
            {mode === 'create' ? 'Add Secret' : 'Edit Secret'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#374151] transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. GOOGLE_CLIENT_ID"
              required
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
            />
          </div>

          {/* Current value preview (edit mode only) */}
          {mode === 'edit' && (
            <div>
              <label className="block text-xs font-medium text-[#374151] mb-1.5">Current value</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-lg">
                <span className="text-sm font-mono text-[#374151] flex-1">
                  {maskedValue ?? 'No value set'}
                </span>
                {fullValue && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-[#6B7280] hover:text-[#1B3A5C] transition-colors shrink-0"
                    title="Copy full value"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Value */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              {mode === 'edit' ? 'New value' : 'Value'} {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={mode === 'edit' ? 'Leave blank to keep current value' : 'Enter secret value'}
              required={mode === 'create'}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SecretCategory)}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this secret"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] hover:bg-[#142d47] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (mode === 'create' ? 'Saving...' : 'Updating...') : (mode === 'create' ? 'Add Secret' : 'Save Changes')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
