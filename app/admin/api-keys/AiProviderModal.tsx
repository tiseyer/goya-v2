'use client'

import { useState, useEffect } from 'react'
import type { AiProviderKeyItem } from './secrets-actions'
import { createAiProviderKey, updateAiProviderKey } from './secrets-actions'
import { AI_PROVIDERS, getModelsForProvider } from '@/lib/secrets/ai-providers'
import type { AiProviderName } from '@/lib/secrets/ai-providers'

interface AiProviderModalProps {
  mode: 'create' | 'edit'
  existingKey?: AiProviderKeyItem
  onClose: () => void
  onSaved: () => void
}

export default function AiProviderModal({ mode, existingKey, onClose, onSaved }: AiProviderModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [apiKeyValue, setApiKeyValue] = useState('')
  const [provider, setProvider] = useState<AiProviderName>('openai')
  const [model, setModel] = useState<string>(getModelsForProvider('openai')[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit mode: populate fields from existingKey
  useEffect(() => {
    if (mode === 'edit' && existingKey) {
      setDisplayName(existingKey.key_name)
      setProvider(existingKey.provider)
      setModel(existingKey.model)
      // API key value stays empty (masked)
    }
  }, [mode, existingKey])

  function handleProviderChange(newProvider: AiProviderName) {
    setProvider(newProvider)
    // Reset model to first model of new provider
    const models = getModelsForProvider(newProvider)
    setModel(models[0]?.id ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'create') {
        const result = await createAiProviderKey(displayName.trim(), apiKeyValue, provider, model)
        if (!result.success) {
          setError(result.error)
          setLoading(false)
          return
        }
      } else {
        if (!existingKey) return
        const result = await updateAiProviderKey(existingKey.id, {
          key_name: displayName.trim() || undefined,
          value: apiKeyValue || undefined,
          model,
        })
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

  const currentModels = getModelsForProvider(provider)

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
            {mode === 'create' ? 'Add AI Provider Key' : 'Edit AI Provider Key'}
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
          {/* Provider */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Provider <span className="text-red-500">*</span>
            </label>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AiProviderName)}
              disabled={mode === 'edit'}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent bg-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent bg-white"
            >
              {currentModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              API Key {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={apiKeyValue}
              onChange={(e) => setApiKeyValue(e.target.value)}
              placeholder={mode === 'edit' ? 'Leave blank to keep current key' : 'Enter your API key'}
              required={mode === 'create'}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
            />
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-[#374151] mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Production OpenAI Key"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent"
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
              {loading ? 'Saving...' : mode === 'create' ? 'Add Provider Key' : 'Update Key'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Discard
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
