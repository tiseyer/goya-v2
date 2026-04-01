'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { generateSlug } from '@/lib/schools/slug'
import { updateGeneral } from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface School {
  id: string
  name: string
  slug: string
  short_bio: string | null
  bio: string | null
  established_year: number | null
  status: string
}

// ── Toast ─────────────────────────────────────────────────────────────────────

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

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm ${styles[type]}`}
    >
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

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GeneralSettingsClient({
  school,
  schoolSlug,
}: {
  school: School
  schoolSlug: string
}) {
  const CURRENT_YEAR = new Date().getFullYear()
  const years = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)

  const [name, setName] = useState(school.name ?? '')
  const [slug, setSlug] = useState(school.slug ?? '')
  const [shortBio, setShortBio] = useState(school.short_bio ?? '')
  const [bio, setBio] = useState(school.bio ?? '')
  const [establishedYear, setEstablishedYear] = useState<string>(
    school.established_year ? String(school.established_year) : ''
  )
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [isPending, startTransition] = useTransition()

  // Auto-generate slug from name (unless manually edited)
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name))
    }
  }, [name, slugManuallyEdited])

  const nameChanged = name.trim() !== school.name
  const slugChanged = slug.trim() !== school.slug
  const showReReviewWarning = nameChanged || slugChanged

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true)
    setSlug(e.target.value)
  }

  function handleSave() {
    const yearNum = parseInt(establishedYear, 10)
    startTransition(async () => {
      const result = await updateGeneral(schoolSlug, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        short_bio: shortBio.trim(),
        bio: bio.trim(),
        established_year: yearNum,
      })
      if ('error' in result) {
        setToast({ type: 'error', message: result.error })
      } else {
        setToast({ type: 'success', message: 'General settings saved.' })
      }
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">General</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Update your school&apos;s name, description, and basic details.
        </p>
      </div>

      {/* Re-review warning */}
      {showReReviewWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-amber-800">
            Changing the school name or URL slug will trigger a re-review of your school.
          </p>
        </div>
      )}

      {/* School Name */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">School Name &amp; URL</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              School Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Yoga Academy"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1.5">
              URL Slug <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="your-school-name"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
            />
            <p className="mt-1.5 text-xs text-[#6B7280]">
              Your school will be at:{' '}
              <span className="font-medium text-[#374151]">
                goya.community/schools/{slug || 'your-slug'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Biography</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Short Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-[#374151]">
                Short Bio <span className="text-red-400">*</span>
              </label>
              <span
                className={`text-xs font-medium tabular-nums ${
                  shortBio.length > 250 ? 'text-red-500' : 'text-[#9CA3AF]'
                }`}
              >
                {shortBio.length}/250
              </span>
            </div>
            <textarea
              value={shortBio}
              onChange={(e) => setShortBio(e.target.value)}
              rows={3}
              placeholder="A brief description of your school (max 250 characters)"
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] resize-none transition-colors"
            />
          </div>

          {/* Full Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-[#374151]">
                Full Bio <span className="text-red-400">*</span>
              </label>
              <span
                className={`text-xs font-medium tabular-nums ${
                  bio.length > 5000 ? 'text-red-500' : 'text-[#9CA3AF]'
                }`}
              >
                {bio.length}/5000
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={10}
              placeholder="Tell your full story — your history, approach, philosophy, and what makes your school unique. Minimum 1000 characters."
              className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] resize-none transition-colors"
            />
            {bio.length > 0 && bio.trim().length < 1000 && (
              <p className="mt-1.5 text-xs text-amber-600">
                {1000 - bio.trim().length} more characters needed (minimum 1000)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Established Year */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Year Established</h2>
        </div>
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-[#374151] mb-1.5">
            Year Established <span className="text-red-400">*</span>
          </label>
          <select
            value={establishedYear}
            onChange={(e) => setEstablishedYear(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#4E87A0]/30 focus:border-[#4E87A0] transition-colors"
          >
            <option value="">Select year...</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#4E87A0] text-white text-sm font-semibold hover:bg-[#3A7190] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isPending ? <Spinner /> : null}
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onDismiss={dismissToast} />}
    </div>
  )
}
