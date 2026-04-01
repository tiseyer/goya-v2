'use client'

import { useState, useTransition, useCallback, useEffect } from 'react'
import { updateTeachingInfo } from '../actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface School {
  practice_styles: string[] | null
  programs_offered: string[] | null
  course_delivery_format: 'in_person' | 'online' | 'hybrid' | null
  lineage: string | null
  languages: string[] | null
}

// ── Predefined lists (sourced from OnboardingWizard.tsx) ───────────────────────

const PRACTICE_STYLES = [
  'Hatha Yoga',
  'Vinyasa Flow',
  'Yin Yoga',
  'Restorative Yoga',
  'Ashtanga Yoga',
  'Prenatal Yoga',
  'Postnatal Yoga',
  "Children's Yoga",
  'Power Yoga',
  'Kundalini Yoga',
  'Hot Yoga',
  'Gentle Yoga',
  'Modern Contemporary Yoga',
  'Traditional Lineage Based Yoga',
  'Trauma-Informed Yoga',
  'Iyengar Yoga',
  'Somatic Yoga',
  'Chair Yoga',
  'Aerial Yoga',
]

const PROGRAMS_OFFERED = [
  'Teacher Training (200hr)',
  'Teacher Training (300hr)',
  'Teacher Training (500hr)',
  'Continuing Education',
  'Workshops',
  'Retreats',
  'Kids Programs',
  'Prenatal Programs',
  'Corporate Wellness',
  'Online Courses',
]

const LANGUAGES = [
  'English',
  'French',
  'German',
  'Spanish',
  'Arabic',
  'Croatian',
  'Czech',
  'Dutch',
  'Finnish',
  'Greek',
  'Hindi',
  'Italian',
  'Japanese',
  'Mandarin',
  'Polish',
  'Portuguese',
  'Slovakian',
  'Swedish',
  'Thai',
  'Ukrainian',
  'Urdu',
  'Other',
]

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

export default function TeachingInfoClient({
  school,
  schoolSlug,
}: {
  school: School
  schoolSlug: string
}) {
  const [practiceStyles, setPracticeStyles] = useState<string[]>(
    school.practice_styles ?? []
  )
  const [programsOffered, setProgramsOffered] = useState<string[]>(
    school.programs_offered ?? []
  )
  const [deliveryFormat, setDeliveryFormat] = useState<'in_person' | 'online' | 'hybrid' | ''>(
    school.course_delivery_format ?? ''
  )
  const [lineageTags, setLineageTags] = useState<string[]>(
    school.lineage
      ? school.lineage.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  )
  const [lineageInput, setLineageInput] = useState('')
  const [languages, setLanguages] = useState<string[]>(school.languages ?? [])

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const dismissToast = useCallback(() => setToast(null), [])
  const [isPending, startTransition] = useTransition()

  function toggleItem(
    list: string[],
    setter: (v: string[]) => void,
    item: string,
    max?: number
  ) {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item))
    } else if (!max || list.length < max) {
      setter([...list, item])
    }
  }

  function handleLineageKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && lineageInput.trim().length > 0) {
      e.preventDefault()
      const tag = lineageInput.trim().replace(/,$/, '')
      if (!lineageTags.includes(tag) && lineageTags.length < 3) {
        setLineageTags([...lineageTags, tag])
      }
      setLineageInput('')
    } else if (e.key === 'Backspace' && lineageInput === '' && lineageTags.length > 0) {
      setLineageTags(lineageTags.slice(0, -1))
    }
  }

  function removeLineageTag(tag: string) {
    setLineageTags(lineageTags.filter((t) => t !== tag))
  }

  function handleSave() {
    if (!deliveryFormat) {
      setToast({ type: 'error', message: 'Please select a course delivery format.' })
      return
    }
    startTransition(async () => {
      const result = await updateTeachingInfo(schoolSlug, {
        practice_styles: practiceStyles,
        programs_offered: programsOffered,
        course_delivery_format: deliveryFormat as 'in_person' | 'online' | 'hybrid',
        lineage: lineageTags.join(', '),
        languages,
      })
      if ('error' in result) {
        setToast({ type: 'error', message: result.error })
      } else {
        setToast({ type: 'success', message: 'Teaching info saved.' })
      }
    })
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Teaching Info</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Update your teaching style, programs, and approach.
        </p>
      </div>

      {/* Practice Styles */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1B3A5C]">Practice Styles</h2>
            <span
              className={`text-xs font-medium tabular-nums ${
                practiceStyles.length >= 5 ? 'text-amber-600' : 'text-[#9CA3AF]'
              }`}
            >
              {practiceStyles.length}/5 selected
            </span>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRACTICE_STYLES.map((style) => {
              const selected = practiceStyles.includes(style)
              const disabled = !selected && practiceStyles.length >= 5
              return (
                <label
                  key={style}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                    selected
                      ? 'border-[#1B3A5C] bg-blue-50/50 text-[#1B3A5C]'
                      : disabled
                      ? 'border-[#E5E7EB] text-[#D1D5DB] cursor-not-allowed bg-[#FAFAFA]'
                      : 'border-[#E5E7EB] text-[#374151] hover:border-[#C4D0DE]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggleItem(practiceStyles, setPracticeStyles, style, 5)}
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span className="leading-tight">{style}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Programs Offered */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Programs Offered</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROGRAMS_OFFERED.map((program) => {
              const selected = programsOffered.includes(program)
              return (
                <label
                  key={program}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                    selected
                      ? 'border-[#1B3A5C] bg-blue-50/50 text-[#1B3A5C]'
                      : 'border-[#E5E7EB] text-[#374151] hover:border-[#C4D0DE]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleItem(programsOffered, setProgramsOffered, program)}
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span className="leading-tight">{program}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {/* Course Delivery Format */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-base font-semibold text-[#1B3A5C]">
            Course Delivery Format <span className="text-red-400">*</span>
          </h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {([
              { value: 'in_person', label: 'In-Person' },
              { value: 'online', label: 'Online' },
              { value: 'hybrid', label: 'Hybrid' },
            ] as const).map(({ value, label }) => (
              <label
                key={value}
                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  deliveryFormat === value
                    ? 'border-[#1B3A5C] bg-blue-50/50'
                    : 'border-[#E5E7EB] hover:border-[#C4D0DE]'
                }`}
              >
                <input
                  type="radio"
                  name="delivery_format"
                  value={value}
                  checked={deliveryFormat === value}
                  onChange={() => setDeliveryFormat(value)}
                  className="accent-[#1B3A5C]"
                />
                <span
                  className={`text-sm font-medium ${
                    deliveryFormat === value ? 'text-[#1B3A5C]' : 'text-[#374151]'
                  }`}
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Lineage */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1B3A5C]">Lineage / Tradition</h2>
            <span className="text-xs text-[#9CA3AF]">{lineageTags.length}/3 tags</span>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-xs text-[#9CA3AF] mb-3">
            Type a lineage or tradition and press Enter or comma to add (max 3).
          </p>
          <div className="flex flex-wrap gap-2 min-h-[50px] border border-[#E5E7EB] rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#4E87A0]/30 focus-within:border-[#4E87A0] transition-colors">
            {lineageTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-[#1B3A5C] text-white text-xs font-medium px-2.5 py-1 rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeLineageTag(tag)}
                  className="hover:text-white/70 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {lineageTags.length < 3 && (
              <input
                type="text"
                value={lineageInput}
                onChange={(e) => setLineageInput(e.target.value)}
                onKeyDown={handleLineageKeyDown}
                placeholder={lineageTags.length === 0 ? 'e.g. Krishnamacharya, Sivananda...' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent py-0.5"
              />
            )}
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#1B3A5C]">Languages</h2>
            <span
              className={`text-xs font-medium tabular-nums ${
                languages.length >= 3 ? 'text-amber-600' : 'text-[#9CA3AF]'
              }`}
            >
              {languages.length}/3 selected
            </span>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map((lang) => {
              const selected = languages.includes(lang)
              const disabled = !selected && languages.length >= 3
              return (
                <label
                  key={lang}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors ${
                    selected
                      ? 'border-[#1B3A5C] bg-blue-50/50 text-[#1B3A5C]'
                      : disabled
                      ? 'border-[#E5E7EB] text-[#D1D5DB] cursor-not-allowed bg-[#FAFAFA]'
                      : 'border-[#E5E7EB] text-[#374151] hover:border-[#C4D0DE]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled}
                    onChange={() => toggleItem(languages, setLanguages, lang, 3)}
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span>{lang}</span>
                </label>
              )
            })}
          </div>
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
