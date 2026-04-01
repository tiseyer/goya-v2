'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChatbotConfig } from '@/lib/chatbot/types'
import type { AiProviderKeyItem } from '../api-keys/secrets-actions'
import { saveChatbotConfig, uploadChatbotAvatar } from './chatbot-actions'

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E5E7EB]">
        <h2 className="text-base font-semibold text-[#1B3A5C]">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:ring-offset-2 ${
        checked ? 'bg-[#00B5A3]' : 'bg-[#E5E7EB]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error'

function Toast({
  type,
  message,
  onDismiss,
}: {
  type: ToastType
  message: string
  onDismiss: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [onDismiss])

  const styles: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}
    >
      {icons[type]}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// ─── ConfigurationTab ─────────────────────────────────────────────────────────

const INPUT_CLASSES =
  'w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#00B5A3] focus:border-transparent'

export default function ConfigurationTab({
  config,
  aiKeys,
}: {
  config: ChatbotConfig | null
  aiKeys: AiProviderKeyItem[]
}) {
  const [name, setName] = useState(config?.name ?? '')
  const [isActive, setIsActive] = useState(config?.is_active ?? false)
  const [selectedKeyId, setSelectedKeyId] = useState<string>(config?.selected_key_id ?? '')
  const [systemPrompt, setSystemPrompt] = useState(config?.system_prompt ?? '')
  const [retentionDays, setRetentionDays] = useState<number>(config?.guest_retention_days ?? 5)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(config?.avatar_url ?? null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)

  const [errors, setErrors] = useState<{
    name?: string
    systemPrompt?: string
    retentionDays?: string
  }>({})

  const fileInputRef = useRef<HTMLInputElement>(null)

  const dismissToast = useCallback(() => setToast(null), [])

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarError(null)
    const preview = URL.createObjectURL(file)
    setAvatarPreview(preview)
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required.'
    }
    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required.'
    }
    if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 365) {
      newErrors.retentionDays = 'Enter a number between 1 and 365.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    setAvatarError(null)

    try {
      // Step 1: Upload avatar if a new file was selected
      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const uploadResult = await uploadChatbotAvatar(fd)
        if (!uploadResult.success) {
          setAvatarError('Upload failed. Use JPG or PNG under 2 MB.')
          setSaving(false)
          return
        }
        // Avatar URL is already updated in DB by the server action
        setAvatarFile(null)
      }

      // Step 2: Save configuration
      const result = await saveChatbotConfig({
        name: name.trim(),
        is_active: isActive,
        system_prompt: systemPrompt.trim(),
        selected_key_id: selectedKeyId || null,
        guest_retention_days: retentionDays,
      })

      if (result.success) {
        setToast({ type: 'success', message: 'Configuration saved' })
      } else {
        setToast({ type: 'error', message: 'Failed to save. Please try again.' })
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Section 1 — Identity */}
      <Section title="Identity">
        {/* Chatbot Name */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Chatbot Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mattea"
            maxLength={100}
            className={INPUT_CLASSES}
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          ) : null}
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Profile Image
          </label>
          <div className="flex items-center gap-4">
            {avatarPreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Chatbot avatar preview"
                className="w-16 h-16 rounded-full object-cover border border-[#E5E7EB] shrink-0"
              />
            )}
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="block w-full text-sm text-[#6B7280] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-[#E5E7EB] file:text-sm file:font-medium file:text-[#374151] file:bg-white hover:file:bg-slate-50 file:cursor-pointer"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Recommended: 200x200px. JPG, PNG, or WebP, max 2 MB.
              </p>
            </div>
          </div>
          {avatarError && (
            <p className="mt-1.5 text-xs text-red-600">{avatarError}</p>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-medium text-[#374151]">
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <Toggle checked={isActive} onChange={setIsActive} />
        </div>
      </Section>

      {/* Section 2 — AI Configuration */}
      <div className="mt-6">
        <Section title="AI Configuration">
          {/* AI Provider Key */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              AI Provider Key
            </label>
            <div className="relative">
              <select
                value={selectedKeyId}
                onChange={e => setSelectedKeyId(e.target.value)}
                disabled={aiKeys.length === 0}
                className={`${INPUT_CLASSES} appearance-none pr-8 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {aiKeys.length === 0 ? (
                  <option value="" disabled>
                    No AI provider keys found — add one in API Keys
                  </option>
                ) : (
                  <>
                    <option value="">— Select a key —</option>
                    {aiKeys.map(key => (
                      <option key={key.id} value={key.id}>
                        {key.key_name} - {key.model}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              className={`${INPUT_CLASSES} min-h-[120px] resize-y`}
            />
            {errors.systemPrompt ? (
              <p className="mt-1 text-xs text-red-600">{errors.systemPrompt}</p>
            ) : (
              <p className="mt-1 text-xs text-[#6B7280]">
                This is the personality and instruction set sent to the AI with every conversation.
              </p>
            )}
          </div>
        </Section>
      </div>

      {/* Section 3 — Guest Settings */}
      <div className="mt-6">
        <Section title="Guest Settings">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              Guest Session Retention (days)
            </label>
            <input
              type="number"
              value={retentionDays}
              onChange={e => setRetentionDays(Number(e.target.value))}
              min={1}
              max={365}
              className={INPUT_CLASSES}
            />
            {errors.retentionDays ? (
              <p className="mt-1 text-xs text-red-600">{errors.retentionDays}</p>
            ) : (
              <p className="mt-1 text-xs text-[#6B7280]">
                Guest chat sessions older than this many days are automatically deleted.
              </p>
            )}
          </div>
        </Section>
      </div>

      {/* Save button */}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#4e87a0] text-white text-sm font-semibold rounded-lg hover:bg-[#3d7590] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />
      )}
    </>
  )
}
