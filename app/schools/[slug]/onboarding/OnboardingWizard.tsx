'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  saveBasicInfo,
  saveOnlinePresence,
  saveVideoIntro,
  saveTeachingInfo,
} from './actions'

// ── Types ─────────────────────────────────────────────────────────────────────

interface School {
  id: string
  slug: string
  name: string
  short_bio: string | null
  bio: string | null
  established_year: number | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  youtube: string | null
  video_platform: 'youtube' | 'vimeo' | null
  video_url: string | null
  practice_styles: string[] | null
  programs_offered: string[] | null
  course_delivery_format: 'in_person' | 'online' | 'hybrid' | null
  lineage: string | null
  languages: string[] | null
  location_address: string | null
  location_city: string | null
  location_country: string | null
  location_lat: number | null
  location_lng: number | null
  location_place_id: string | null
  status: string
  onboarding_completed: boolean
  owner_id: string
}

interface OnboardingWizardProps {
  school: School
  designations: { id: string; designation_type: string; status: string }[]
  faculty: {
    id: string
    profile_id: string | null
    invited_email: string | null
    position: string | null
    is_principal_trainer: boolean
    status: string
  }[]
  documents: {
    id: string
    designation_id: string
    document_type: string
    file_name: string | null
    file_url: string
  }[]
}

// ── Predefined Lists ──────────────────────────────────────────────────────────

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

const CURRENT_YEAR = new Date().getFullYear()

// ── Step Indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = [
  'Welcome',
  'Info',
  'Online',
  'Video',
  'Teaching',
  'Location',
  'Docs',
  'Faculty',
  'Review',
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <>
      {/* Desktop: all 9 steps */}
      <div className="hidden sm:flex items-center justify-center gap-0 mb-10">
        {STEP_LABELS.map((label, idx) => {
          const stepN = idx + 1
          const isDone = currentStep > stepN
          const isCurrent = currentStep === stepN

          return (
            <div key={stepN} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border-2 transition-colors ${
                    isDone
                      ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white'
                      : isCurrent
                      ? 'bg-white border-[#1B3A5C] text-[#1B3A5C]'
                      : 'bg-white border-[#D1D5DB] text-[#9CA3AF]'
                  }`}
                >
                  {isDone ? (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepN
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isCurrent || isDone ? 'text-[#1B3A5C]' : 'text-[#9CA3AF]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {idx < STEP_LABELS.length - 1 && (
                <div
                  className={`w-8 lg:w-12 h-0.5 mb-5 mx-0.5 transition-colors ${
                    currentStep > stepN ? 'bg-[#1B3A5C]' : 'bg-[#E5E7EB]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: compact step indicator */}
      <div className="sm:hidden flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center gap-1">
          {currentStep > 1 && <span className="text-[#D1D5DB] text-lg leading-none">···</span>}
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm bg-[#1B3A5C] text-white border-2 border-[#1B3A5C]">
            {currentStep}
          </div>
          <span className="text-xs font-semibold text-[#1B3A5C]">
            {STEP_LABELS[currentStep - 1]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {currentStep < STEP_LABELS.length && (
            <span className="text-[#D1D5DB] text-lg leading-none">···</span>
          )}
        </div>
        <span className="absolute right-4 top-4 text-xs text-[#9CA3AF]">
          {currentStep}/{STEP_LABELS.length}
        </span>
      </div>
    </>
  )
}

// ── Shared UI Helpers ─────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
      <svg
        className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  )
}

function NavButtons({
  onBack,
  onContinue,
  continueLabel = 'Continue →',
  isPending,
  canContinue = true,
  showBack = true,
}: {
  onBack?: () => void
  onContinue: () => void
  continueLabel?: string
  isPending: boolean
  canContinue?: boolean
  showBack?: boolean
}) {
  return (
    <div className="flex gap-3 mt-8">
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#4E87A0] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50"
        >
          ← Back
        </button>
      )}
      <button
        type="button"
        onClick={onContinue}
        disabled={!canContinue || isPending}
        className="flex-1 bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isPending ? <Spinner /> : null}
        {continueLabel}
      </button>
    </div>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────────────────────

function Step1Welcome({
  school,
  onContinue,
}: {
  school: School
  onContinue: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-xl mx-auto">
      {/* Icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-6 mx-auto">
        <svg
          className="w-7 h-7 text-[#1B3A5C]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-3 text-center">
        Welcome! Let&apos;s set up your school profile
      </h2>

      <p className="text-[#6B7280] text-sm text-center mb-6 leading-relaxed">
        This takes about 10 minutes. Your school will be reviewed by our team before going live.
      </p>

      {/* School badge */}
      <div className="flex items-center justify-center mb-8">
        <span className="inline-flex items-center gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-full px-4 py-1.5 text-sm font-medium text-[#374151]">
          <svg
            className="w-4 h-4 text-[#6B7280]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          {school.name}
        </span>
      </div>

      {/* What you'll complete */}
      <div className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] p-5 mb-8">
        <p className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">
          What you&apos;ll complete
        </p>
        <div className="space-y-2">
          {[
            'Basic information & biography',
            'Online presence & social links',
            'Video introduction (optional)',
            'Teaching style & programs',
            'Location details',
            'Verification documents',
            'Faculty members',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-[#6B7280]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C] flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors"
      >
        Get Started →
      </button>
    </div>
  )
}

// ── Step 2: Basic Info ────────────────────────────────────────────────────────

function Step2BasicInfo({
  school,
  onBack,
  onNext,
}: {
  school: School
  onBack: () => void
  onNext: () => void
}) {
  const [name, setName] = useState(school.name ?? '')
  const [shortBio, setShortBio] = useState(school.short_bio ?? '')
  const [bio, setBio] = useState(school.bio ?? '')
  const [establishedYear, setEstablishedYear] = useState<string>(
    school.established_year ? String(school.established_year) : ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const years = Array.from({ length: CURRENT_YEAR - 1900 + 1 }, (_, i) => CURRENT_YEAR - i)

  function handleContinue() {
    setError(null)
    const yearNum = parseInt(establishedYear, 10)
    if (!name || name.trim().length < 3) {
      setError('School name must be at least 3 characters')
      return
    }
    if (!shortBio || shortBio.trim().length === 0) {
      setError('Short bio is required')
      return
    }
    if (shortBio.length > 250) {
      setError('Short bio must be 250 characters or fewer')
      return
    }
    if (!bio || bio.trim().length < 1000) {
      setError('Full bio must be at least 1000 characters')
      return
    }
    if (bio.length > 5000) {
      setError('Full bio must be 5000 characters or fewer')
      return
    }
    if (!establishedYear || isNaN(yearNum) || yearNum < 1900 || yearNum > CURRENT_YEAR) {
      setError(`Established year must be between 1900 and ${CURRENT_YEAR}`)
      return
    }

    startTransition(async () => {
      const result = await saveBasicInfo(school.slug, {
        name: name.trim(),
        short_bio: shortBio.trim(),
        bio: bio.trim(),
        established_year: yearNum,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        onNext()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Basic Information</h2>
      <p className="text-[#6B7280] text-sm mb-8">
        Tell us about your school. This will appear on your public profile.
      </p>

      <div className="space-y-6">
        {/* School Name */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            School Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Yoga Academy"
            className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
          />
          {name.length > 0 && name.trim().length < 3 && (
            <p className="mt-1.5 text-xs text-[#9CA3AF]">Minimum 3 characters</p>
          )}
        </div>

        {/* Short Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
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
            className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors resize-none"
          />
        </div>

        {/* Full Bio */}
        <div>
          <div className="flex items-center justify-between mb-2">
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
            rows={8}
            placeholder="Tell your full story — your history, approach, philosophy, and what makes your school unique. Minimum 1000 characters."
            className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors resize-none"
          />
          {bio.length > 0 && bio.trim().length < 1000 && (
            <p className="mt-1.5 text-xs text-amber-600">
              {1000 - bio.trim().length} more characters needed (minimum 1000)
            </p>
          )}
        </div>

        {/* Established Year */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Year Established <span className="text-red-400">*</span>
          </label>
          <select
            value={establishedYear}
            onChange={(e) => setEstablishedYear(e.target.value)}
            className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors bg-white"
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

      {error && <ErrorMessage message={error} />}

      <NavButtons
        onBack={onBack}
        onContinue={handleContinue}
        isPending={isPending}
      />
    </div>
  )
}

// ── Step 3: Online Presence ───────────────────────────────────────────────────

function Step3OnlinePresence({
  school,
  onBack,
  onNext,
}: {
  school: School
  onBack: () => void
  onNext: () => void
}) {
  const [website, setWebsite] = useState(school.website ?? '')
  const [instagram, setInstagram] = useState(school.instagram ?? '')
  const [facebook, setFacebook] = useState(school.facebook ?? '')
  const [tiktok, setTiktok] = useState(school.tiktok ?? '')
  const [youtube, setYoutube] = useState(school.youtube ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fields = [website, instagram, facebook, tiktok, youtube]
  const hasAny = fields.some((v) => v.trim().length > 0)

  function handleContinue() {
    setError(null)
    if (!hasAny) {
      setError('Please fill in at least one online presence field before continuing.')
      return
    }
    startTransition(async () => {
      const result = await saveOnlinePresence(school.slug, {
        website: website.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
        youtube: youtube.trim() || undefined,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        onNext()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Online Presence</h2>
      <p className="text-[#6B7280] text-sm mb-8">
        Add your website and social media links. At least one is required.
      </p>

      <div className="space-y-5">
        {[
          {
            label: 'Website',
            value: website,
            setter: setWebsite,
            placeholder: 'https://your-school.com',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            ),
          },
          {
            label: 'Instagram',
            value: instagram,
            setter: setInstagram,
            placeholder: 'https://instagram.com/yourschool',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            ),
          },
          {
            label: 'Facebook',
            value: facebook,
            setter: setFacebook,
            placeholder: 'https://facebook.com/yourschool',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            ),
          },
          {
            label: 'TikTok',
            value: tiktok,
            setter: setTiktok,
            placeholder: 'https://tiktok.com/@yourschool',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            ),
          },
          {
            label: 'YouTube',
            value: youtube,
            setter: setYoutube,
            placeholder: 'https://youtube.com/@yourschool',
            icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            ),
          },
        ].map(({ label, value, setter, placeholder, icon }) => (
          <div key={label}>
            <label className="block text-sm font-medium text-[#374151] mb-2">{label}</label>
            <div className="flex items-center border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A5C]/20 focus-within:border-[#1B3A5C] transition-colors">
              <div className="px-3 py-3 bg-[#F7F8FA] text-[#6B7280] border-r border-[#E5E7EB]">
                {icon}
              </div>
              <input
                type="url"
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-3 outline-none text-sm bg-transparent"
              />
            </div>
          </div>
        ))}
      </div>

      {!hasAny && (
        <p className="mt-4 text-xs text-amber-600">
          Please fill in at least one field to continue.
        </p>
      )}

      {error && <ErrorMessage message={error} />}

      <NavButtons
        onBack={onBack}
        onContinue={handleContinue}
        isPending={isPending}
        canContinue={hasAny}
      />
    </div>
  )
}

// ── Step 4: Video Introduction ────────────────────────────────────────────────

function parseYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function parseVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  return match ? match[1] : null
}

function Step4VideoIntro({
  school,
  onBack,
  onNext,
}: {
  school: School
  onBack: () => void
  onNext: () => void
}) {
  const [platform, setPlatform] = useState<'youtube' | 'vimeo'>(
    school.video_platform ?? 'youtube'
  )
  const [videoUrl, setVideoUrl] = useState(school.video_url ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const videoId =
    videoUrl.trim().length > 0
      ? platform === 'youtube'
        ? parseYouTubeId(videoUrl)
        : parseVimeoId(videoUrl)
      : null

  const embedSrc =
    videoId
      ? platform === 'youtube'
        ? `https://www.youtube.com/embed/${videoId}`
        : `https://player.vimeo.com/video/${videoId}`
      : null

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveVideoIntro(school.slug, {
        video_platform: videoUrl.trim().length > 0 ? platform : undefined,
        video_url: videoUrl.trim() || undefined,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        onNext()
      }
    })
  }

  function handleSkip() {
    startTransition(async () => {
      await saveVideoIntro(school.slug, {})
      onNext()
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Video Introduction</h2>
      <p className="text-[#6B7280] text-sm mb-2">
        Add an introductory video to your school profile. This is optional.
      </p>
      <p className="text-xs text-[#9CA3AF] mb-8">
        This step is optional — you can skip it and add a video later.
      </p>

      {/* Platform toggle */}
      <div className="flex gap-2 mb-6">
        {(['youtube', 'vimeo'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-colors ${
              platform === p
                ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white'
                : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#C4D0DE]'
            }`}
          >
            {p === 'youtube' ? 'YouTube' : 'Vimeo'}
          </button>
        ))}
      </div>

      {/* URL input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-[#374151] mb-2">
          {platform === 'youtube' ? 'YouTube' : 'Vimeo'} Video URL
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={
            platform === 'youtube'
              ? 'https://www.youtube.com/watch?v=...'
              : 'https://vimeo.com/...'
          }
          className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
        />
        {videoUrl.trim().length > 0 && !videoId && (
          <p className="mt-1.5 text-xs text-amber-600">
            Could not parse video ID from this URL. Please check the format.
          </p>
        )}
      </div>

      {/* Embed preview */}
      {embedSrc && (
        <div className="mb-6">
          <p className="text-xs font-medium text-[#374151] mb-2">Preview</p>
          <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-black aspect-video">
            <iframe
              src={embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Video preview"
            />
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Navigation — skip or save */}
      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="px-5 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#4E87A0] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="px-5 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || (videoUrl.trim().length > 0 && !videoId)}
          className="flex-1 bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? <Spinner /> : null}
          {videoUrl.trim().length > 0 ? 'Save & Continue →' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

// ── Step 5: Teaching Info ─────────────────────────────────────────────────────

function Step5TeachingInfo({
  school,
  onBack,
  onNext,
}: {
  school: School
  onBack: () => void
  onNext: () => void
}) {
  const [practiceStyles, setPracticeStyles] = useState<string[]>(
    school.practice_styles ?? []
  )
  const [programsOffered, setProgramsOffered] = useState<string[]>(
    school.programs_offered ?? []
  )
  const [deliveryFormat, setDeliveryFormat] = useState<
    'in_person' | 'online' | 'hybrid' | ''
  >(school.course_delivery_format ?? '')
  const [lineageTags, setLineageTags] = useState<string[]>(
    school.lineage
      ? school.lineage.split(',').map((s) => s.trim()).filter(Boolean)
      : []
  )
  const [lineageInput, setLineageInput] = useState('')
  const [languages, setLanguages] = useState<string[]>(school.languages ?? [])
  const [error, setError] = useState<string | null>(null)
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

  function handleContinue() {
    setError(null)
    if (!deliveryFormat) {
      setError('Please select a course delivery format.')
      return
    }
    startTransition(async () => {
      const result = await saveTeachingInfo(school.slug, {
        practice_styles: practiceStyles,
        programs_offered: programsOffered,
        course_delivery_format: deliveryFormat as 'in_person' | 'online' | 'hybrid',
        lineage: lineageTags.join(', '),
        languages,
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        onNext()
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Teaching Information</h2>
      <p className="text-[#6B7280] text-sm mb-8">
        Tell us about your teaching style, programs, and approach.
      </p>

      <div className="space-y-8">
        {/* Practice Styles */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#374151]">
              Practice Styles
            </label>
            <span
              className={`text-xs font-medium tabular-nums ${
                practiceStyles.length >= 5 ? 'text-amber-600' : 'text-[#9CA3AF]'
              }`}
            >
              {practiceStyles.length}/5 selected
            </span>
          </div>
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
                    onChange={() =>
                      toggleItem(practiceStyles, setPracticeStyles, style, 5)
                    }
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span className="leading-tight">{style}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Programs Offered */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Programs Offered
          </label>
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
                    onChange={() =>
                      toggleItem(programsOffered, setProgramsOffered, program)
                    }
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span className="leading-tight">{program}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Course Delivery Format */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Course Delivery Format <span className="text-red-400">*</span>
          </label>
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

        {/* Lineage Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#374151]">
              Lineage / Tradition
            </label>
            <span className="text-xs text-[#9CA3AF]">{lineageTags.length}/3 tags</span>
          </div>
          <p className="text-xs text-[#9CA3AF] mb-3">
            Type a lineage or tradition and press Enter or comma to add (max 3).
          </p>
          <div
            className="flex flex-wrap gap-2 min-h-[50px] border border-[#E5E7EB] rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-[#1B3A5C]/20 focus-within:border-[#1B3A5C] transition-colors"
          >
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

        {/* Languages */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#374151]">Languages</label>
            <span
              className={`text-xs font-medium tabular-nums ${
                languages.length >= 3 ? 'text-amber-600' : 'text-[#9CA3AF]'
              }`}
            >
              {languages.length}/3 selected
            </span>
          </div>
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
                    onChange={() =>
                      toggleItem(languages, setLanguages, lang, 3)
                    }
                    className="w-3.5 h-3.5 rounded accent-[#1B3A5C]"
                  />
                  <span>{lang}</span>
                </label>
              )
            })}
          </div>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      <NavButtons
        onBack={onBack}
        onContinue={handleContinue}
        isPending={isPending}
        canContinue={!!deliveryFormat}
      />
    </div>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function OnboardingWizard({
  school,
  designations,
  faculty,
  documents,
}: OnboardingWizardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stepParam = parseInt(searchParams.get('step') ?? '1', 10)
  const currentStep = isNaN(stepParam) || stepParam < 1 || stepParam > 9 ? 1 : stepParam

  function goToStep(n: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (n === 1) {
      params.delete('step')
    } else {
      params.set('step', String(n))
    }
    router.push(`/schools/${school.slug}/onboarding?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <Step1Welcome school={school} onContinue={() => goToStep(2)} />
      )}

      {currentStep === 2 && (
        <Step2BasicInfo
          school={school}
          onBack={() => goToStep(1)}
          onNext={() => goToStep(3)}
        />
      )}

      {currentStep === 3 && (
        <Step3OnlinePresence
          school={school}
          onBack={() => goToStep(2)}
          onNext={() => goToStep(4)}
        />
      )}

      {currentStep === 4 && (
        <Step4VideoIntro
          school={school}
          onBack={() => goToStep(3)}
          onNext={() => goToStep(5)}
        />
      )}

      {currentStep === 5 && (
        <Step5TeachingInfo
          school={school}
          onBack={() => goToStep(4)}
          onNext={() => goToStep(6)}
        />
      )}

      {/* Steps 6-9: placeholders — implemented in Plan 31-03 */}
      {currentStep >= 6 && currentStep <= 9 && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-2xl mx-auto">
          <div className="flex items-center justify-center min-h-[200px] text-center">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-[#9CA3AF]">{currentStep}</span>
              </div>
              <p className="text-[#6B7280] text-sm font-medium">
                Step {currentStep} — {STEP_LABELS[currentStep - 1]}
              </p>
              <p className="text-[#9CA3AF] text-xs mt-1">Coming soon in the next update</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#4E87A0] hover:bg-[#F7F8FA] transition-colors"
            >
              ← Back
            </button>
            {currentStep < 9 && (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="flex-1 bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors"
              >
                Continue →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suppress unused var warnings for props passed to future steps */}
      <div className="hidden" aria-hidden="true">
        {JSON.stringify(designations?.length)}
        {JSON.stringify(faculty?.length)}
        {JSON.stringify(documents?.length)}
      </div>
    </div>
  )
}
