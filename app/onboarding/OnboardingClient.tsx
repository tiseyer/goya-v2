'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { completeOnboarding, saveOnboardingStep } from './actions'

const TOTAL_STEPS = 8

type OnboardingProfile = {
  first_name: string
  last_name: string
  role: 'Student' | 'Teacher' | 'Wellness Practitioner' | ''
  address_line1: string
  address_line2: string
  postal_code: string
  state_region: string
  country: string
  language: string
  practice_formats: string[]
  avatar_url: string
  code_of_conduct_accepted_at: string | null
  code_of_ethics_accepted_at: string | null
}

type OnboardingState = {
  current_step: number
  max_step_reached: number
}

type Props = {
  userId: string
  initialProfile: OnboardingProfile
  initialState: OnboardingState
}

const languages = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Hindi',
  'Arabic',
  'Japanese',
  'Korean',
]

const practiceOptions = ['In person', 'Online', 'Hybrid']
const countries = [
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Portugal',
  'India',
  'Japan',
  'Australia',
]

export default function OnboardingClient({ userId, initialProfile, initialState }: Props) {
  const [isPending, startTransition] = useTransition()

  const resumeStep = Math.min(
    Math.max((initialState.max_step_reached || 0) + 1, 1),
    TOTAL_STEPS
  )
  const [currentStep, setCurrentStep] = useState(() =>
    Math.min(Math.max(initialState.current_step || resumeStep, resumeStep), TOTAL_STEPS)
  )
  const [maxStepReached, setMaxStepReached] = useState(() =>
    Math.max(initialState.max_step_reached || 0, resumeStep - 1, 0)
  )

  const [profile, setProfile] = useState<OnboardingProfile>(initialProfile)

  const [avatarPreview, setAvatarPreview] = useState<string>(initialProfile.avatar_url || '')
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [agreementConduct, setAgreementConduct] = useState(
    Boolean(initialProfile.code_of_conduct_accepted_at)
  )
  const [agreementEthics, setAgreementEthics] = useState(
    Boolean(initialProfile.code_of_ethics_accepted_at)
  )

  const progressPercent = useMemo(() => {
    return Math.round(((currentStep - 1) / (TOTAL_STEPS - 1)) * 100)
  }, [currentStep])

  const canNavigateTo = useCallback(
    (step: number) => step <= maxStepReached + 1,
    [maxStepReached]
  )

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS) return
      if (!canNavigateTo(step)) return
      setCurrentStep(step)
    },
    [canNavigateTo]
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToStep(currentStep - 1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToStep(currentStep + 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, goToStep])

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {}

    if (step === 1) {
      if (!profile.first_name.trim()) {
        errors.first_name = 'Please enter your first name.'
      }
      if (!profile.last_name.trim()) {
        errors.last_name = 'Please enter your last name.'
      }
    }

    if (step === 2) {
      if (!profile.role) {
        errors.role = 'Please choose a role to continue.'
      }
    }

    if (step === 3) {
      if (!profile.address_line1.trim()) {
        errors.address_line1 = 'Please enter your address.'
      }
      if (!profile.postal_code.trim()) {
        errors.postal_code = 'Please enter your ZIP or postal code.'
      }
      if (!profile.state_region.trim()) {
        errors.state_region = 'Please enter your state or region.'
      }
      if (!profile.country.trim()) {
        errors.country = 'Please select your country.'
      }
    }

    if (step === 4) {
      if (!profile.language) {
        errors.language = 'Please select a language.'
      }
    }

    if (step === 5) {
      if (!profile.practice_formats.length) {
        errors.practice_formats = 'Please choose at least one practice format.'
      }
    }

    if (step === 6) {
      if (!profile.avatar_url) {
        errors.avatar_url = 'Please upload a profile image to continue.'
      }
      if (uploadError) {
        errors.avatar_url = uploadError
      }
    }

    if (step === 7) {
      if (!agreementConduct) {
        errors.code_of_conduct = 'Please agree to the Code of Conduct.'
      }
      if (!agreementEthics) {
        errors.code_of_ethics = 'Please agree to the Code of Ethics.'
      }
    }

    return errors
  }

  const requiredMark = (
    <span className="text-rose-400" aria-hidden="true">
      *
    </span>
  )

  const applyServerStep = (result?: { current_step: number; max_step_reached: number }) => {
    if (!result) return
    setMaxStepReached(result.max_step_reached)
    setCurrentStep(result.current_step)
  }

  const handleNext = async () => {
    try {
      const errors = validateStep(currentStep)
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        if (currentStep === 6 && errors.avatar_url) {
          setUploadError(errors.avatar_url)
        }
        return
      }
      setFieldErrors({})

      if (currentStep === 1) {
        const result = await saveOnboardingStep({
          step: 1,
          data: { first_name: profile.first_name, last_name: profile.last_name },
        })
        applyServerStep(result)
        return
      }

      if (currentStep === 2) {
        const result = await saveOnboardingStep({ step: 2, data: { role: profile.role } })
        applyServerStep(result)
        return
      }

      if (currentStep === 3) {
        const result = await saveOnboardingStep({
          step: 3,
          data: {
            address_line1: profile.address_line1,
            address_line2: profile.address_line2,
            postal_code: profile.postal_code,
            state_region: profile.state_region,
            country: profile.country,
          },
        })
        applyServerStep(result)
        return
      }

      if (currentStep === 4) {
        const result = await saveOnboardingStep({ step: 4, data: { language: profile.language } })
        applyServerStep(result)
        return
      }

      if (currentStep === 5) {
        const result = await saveOnboardingStep({
          step: 5,
          data: { practice_formats: profile.practice_formats },
        })
        applyServerStep(result)
        return
      }

      if (currentStep === 6) {
        const result = await saveOnboardingStep({ step: 6, data: { avatar_url: profile.avatar_url } })
        applyServerStep(result)
        return
      }

      if (currentStep === 7) {
        const now = new Date().toISOString()
        const result = await saveOnboardingStep({
          step: 7,
          data: {
            code_of_conduct_accepted_at: now,
            code_of_ethics_accepted_at: now,
          },
        })
        setProfile((prev) => ({
          ...prev,
          code_of_conduct_accepted_at: now,
          code_of_ethics_accepted_at: now,
        }))
        applyServerStep(result)
      }
    } catch {
      return
    }
  }

  const handleFinish = () => {
    startTransition(async () => {
      await completeOnboarding()
    })
  }

  const handleFileChange = async (file: File | null) => {
    if (!file) return
    setUploadError(null)
    clearFieldError('avatar_url')

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      const message = 'Invalid file type. Please upload a JPG, PNG, or WEBP image.'
      setUploadError(message)
      setFieldErrors((prev) => ({ ...prev, avatar_url: message }))
      return
    }

    const maxSizeBytes = 5 * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const message = 'File is too large. Maximum size is 5 MB.'
      setUploadError(message)
      setFieldErrors((prev) => ({ ...prev, avatar_url: message }))
      return
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Failed to read image'))
      reader.readAsDataURL(file)
    })

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(new Error('Failed to load image'))
      image.src = dataUrl
    })

    if (img.width < 400 || img.height < 400) {
      const message = 'Image is too small. Minimum size is 400×400 px.'
      setUploadError(message)
      setFieldErrors((prev) => ({ ...prev, avatar_url: message }))
      return
    }

    const size = Math.min(img.width, img.height)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sx = (img.width - size) / 2
    const sy = (img.height - size) / 2
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.92)
    )

    if (!blob) return

    setAvatarBlob(blob)
    setAvatarPreview(canvas.toDataURL('image/jpeg', 0.92))
    setUploadError(null)
    clearFieldError('avatar_url')

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, 'avatar.jpg')

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = payload?.error || 'Upload failed. Please try again.'
        setUploadError(message)
        setFieldErrors((prev) => ({ ...prev, avatar_url: message }))
        return
      }

      const payload = await response.json()
      const avatarUrl = payload?.url as string | undefined

      if (!avatarUrl) {
        const message = 'Upload failed. Please try again.'
        setUploadError(message)
        setFieldErrors((prev) => ({ ...prev, avatar_url: message }))
        return
      }

      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }))
      setFieldErrors((prev) => {
        if (!prev.avatar_url) return prev
        const next = { ...prev }
        delete next.avatar_url
        return next
      })
      const result = await saveOnboardingStep({ step: 6, data: { avatar_url: avatarUrl } })
      applyServerStep(result)
    } finally {
      setUploading(false)
    }
  }

  const nameGreeting = profile.first_name ? `Nice to meet you, ${profile.first_name}.` : 'Welcome.'

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f1f5f9_35%,_#e2e8f0_100%)] text-slate-900">
      <main className="mx-auto max-w-screen-xl px-6 lg:px-12 py-12">
        <div className="mx-auto max-w-[600px] space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500">Step {currentStep} of {TOTAL_STEPS}</p>
            <h1 className="text-3xl font-semibold">{nameGreeting}</h1>
            <p className="text-slate-600">Let’s build your GOYA profile with a few guided steps.</p>
          </div>

          <div className="h-2 w-full rounded-full bg-white/70 shadow-inner">
            <div
              className="h-2 rounded-full bg-slate-900 shadow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
            {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
              const step = index + 1
              const isActive = step === currentStep
              const isUnlocked = canNavigateTo(step)
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => goToStep(step)}
                  className={`rounded-full border px-3 py-1 ${
                    isActive
                      ? 'border-slate-900 text-slate-900'
                      : isUnlocked
                      ? 'border-slate-200 text-slate-500 hover:text-slate-900'
                      : 'border-slate-200 text-slate-300 cursor-not-allowed'
                  }`}
                  disabled={!isUnlocked}
                >
                  {step}
                </button>
              )
            })}
          </div>

          <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Welcome & Name</h2>
                  <p className="text-slate-600">Welcome, {profile.first_name || 'there'}. Let’s set up your GOYA profile.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      First name {requiredMark}
                    </span>
                    <input
                      value={profile.first_name}
                      onChange={(e) => {
                        setProfile({ ...profile, first_name: e.target.value })
                        clearFieldError('first_name')
                      }}
                      placeholder="First name"
                      className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                        fieldErrors.first_name
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border-slate-200'
                      }`}
                      aria-invalid={Boolean(fieldErrors.first_name)}
                      aria-describedby={fieldErrors.first_name ? 'first_name-error' : undefined}
                    />
                    {fieldErrors.first_name && (
                      <p id="first_name-error" className="text-xs text-red-600" role="alert">
                        {fieldErrors.first_name}
                      </p>
                    )}
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      Last name {requiredMark}
                    </span>
                    <input
                      value={profile.last_name}
                      onChange={(e) => {
                        setProfile({ ...profile, last_name: e.target.value })
                        clearFieldError('last_name')
                      }}
                      placeholder="Last name"
                      className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                        fieldErrors.last_name
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border-slate-200'
                      }`}
                      aria-invalid={Boolean(fieldErrors.last_name)}
                      aria-describedby={fieldErrors.last_name ? 'last_name-error' : undefined}
                    />
                    {fieldErrors.last_name && (
                      <p id="last_name-error" className="text-xs text-red-600" role="alert">
                        {fieldErrors.last_name}
                      </p>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Role Selection</h2>
                  <p className="text-slate-600">What best describes you right now?</p>
                  <p className="text-sm text-slate-500">Schools can be created later from a Teacher account.</p>
                </div>
                <div
                  className={`grid gap-3 md:grid-cols-3 ${
                    fieldErrors.role ? 'rounded-xl border border-red-200 p-3' : ''
                  }`}
                  aria-invalid={Boolean(fieldErrors.role)}
                  aria-describedby={fieldErrors.role ? 'role-error' : undefined}
                >
                  {(['Student', 'Teacher', 'Wellness Practitioner'] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setProfile({ ...profile, role })
                        clearFieldError('role')
                      }}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                        profile.role === role
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="flex items-center gap-1">Required {requiredMark}</span>
                </div>
                {fieldErrors.role && (
                  <p id="role-error" className="text-sm text-red-600" role="alert">
                    {fieldErrors.role}
                  </p>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Address</h2>
                  <p className="text-slate-600">Let us know where you’re based.</p>
                </div>
                <div className="grid gap-4">
                  <label className="space-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      Address line 1 {requiredMark}
                    </span>
                    <input
                      value={profile.address_line1}
                      onChange={(e) => {
                        setProfile({ ...profile, address_line1: e.target.value })
                        clearFieldError('address_line1')
                      }}
                      placeholder="Address line 1"
                      className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                        fieldErrors.address_line1
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border-slate-200'
                      }`}
                      aria-invalid={Boolean(fieldErrors.address_line1)}
                      aria-describedby={fieldErrors.address_line1 ? 'address_line1-error' : undefined}
                    />
                    {fieldErrors.address_line1 && (
                      <p id="address_line1-error" className="text-xs text-red-600" role="alert">
                        {fieldErrors.address_line1}
                      </p>
                    )}
                  </label>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span>Address line 2</span>
                    <input
                      value={profile.address_line2}
                      onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })}
                      placeholder="Address line 2"
                      className="w-full rounded-lg border border-slate-200 bg-white/80 px-3 py-2"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        ZIP / Postal Code {requiredMark}
                      </span>
                      <input
                        value={profile.postal_code}
                        onChange={(e) => {
                          setProfile({ ...profile, postal_code: e.target.value })
                          clearFieldError('postal_code')
                        }}
                        placeholder="ZIP / Postal Code"
                        className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                          fieldErrors.postal_code
                            ? 'border-red-300 ring-1 ring-red-200'
                            : 'border-slate-200'
                        }`}
                        aria-invalid={Boolean(fieldErrors.postal_code)}
                        aria-describedby={fieldErrors.postal_code ? 'postal_code-error' : undefined}
                      />
                      {fieldErrors.postal_code && (
                        <p id="postal_code-error" className="text-xs text-red-600" role="alert">
                          {fieldErrors.postal_code}
                        </p>
                      )}
                    </label>
                    <label className="space-y-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        State / County {requiredMark}
                      </span>
                      <input
                        value={profile.state_region}
                        onChange={(e) => {
                          setProfile({ ...profile, state_region: e.target.value })
                          clearFieldError('state_region')
                        }}
                        placeholder="State / County"
                        className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                          fieldErrors.state_region
                            ? 'border-red-300 ring-1 ring-red-200'
                            : 'border-slate-200'
                        }`}
                        aria-invalid={Boolean(fieldErrors.state_region)}
                        aria-describedby={fieldErrors.state_region ? 'state_region-error' : undefined}
                      />
                      {fieldErrors.state_region && (
                        <p id="state_region-error" className="text-xs text-red-600" role="alert">
                          {fieldErrors.state_region}
                        </p>
                      )}
                    </label>
                  </div>
                  <label className="space-y-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      Country {requiredMark}
                    </span>
                    <select
                      value={profile.country}
                      onChange={(e) => {
                        setProfile({ ...profile, country: e.target.value })
                        clearFieldError('country')
                      }}
                      className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                        fieldErrors.country
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border-slate-200'
                      }`}
                      aria-invalid={Boolean(fieldErrors.country)}
                      aria-describedby={fieldErrors.country ? 'country-error' : undefined}
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.country && (
                      <p id="country-error" className="text-xs text-red-600" role="alert">
                        {fieldErrors.country}
                      </p>
                    )}
                  </label>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Language</h2>
                  <p className="text-slate-600">In which language do you mostly teach or learn yoga?</p>
                </div>
                <label className="space-y-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    Language {requiredMark}
                  </span>
                  <select
                    value={profile.language}
                    onChange={(e) => {
                      setProfile({ ...profile, language: e.target.value })
                      clearFieldError('language')
                    }}
                    className={`w-full rounded-lg border bg-white/80 px-3 py-2 ${
                      fieldErrors.language
                        ? 'border-red-300 ring-1 ring-red-200'
                        : 'border-slate-200'
                    }`}
                    aria-invalid={Boolean(fieldErrors.language)}
                    aria-describedby={fieldErrors.language ? 'language-error' : undefined}
                  >
                    <option value="">Select a language</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.language && (
                    <p id="language-error" className="text-xs text-red-600" role="alert">
                      {fieldErrors.language}
                    </p>
                  )}
                </label>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Practice Format</h2>
                  <p className="text-slate-600">How do you usually practice yoga?</p>
                </div>
                <div
                  className={`grid gap-3 md:grid-cols-3 ${
                    fieldErrors.practice_formats ? 'rounded-xl border border-red-200 p-3' : ''
                  }`}
                  aria-invalid={Boolean(fieldErrors.practice_formats)}
                  aria-describedby={fieldErrors.practice_formats ? 'practice_formats-error' : undefined}
                >
                  {practiceOptions.map((option) => {
                    const active = profile.practice_formats.includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setProfile((prev) => ({
                            ...prev,
                            practice_formats: active
                              ? prev.practice_formats.filter((value) => value !== option)
                              : [...prev.practice_formats, option],
                          }))
                          clearFieldError('practice_formats')
                        }}
                        className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                          active
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-700 hover:border-slate-400'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="flex items-center gap-1">Required {requiredMark}</span>
                </div>
                {fieldErrors.practice_formats && (
                  <p id="practice_formats-error" className="text-sm text-red-600" role="alert">
                    {fieldErrors.practice_formats}
                  </p>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Profile Image</h2>
                  <p className="text-slate-600">
                    GOYA is a people-first platform. A clear photo helps others connect with you.
                  </p>
                </div>
                <label
                  className={`group flex cursor-pointer items-center gap-5 rounded-2xl border px-5 py-4 transition ${
                    uploadError
                      ? 'border-red-300 bg-red-50/60'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Profile preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        Preview
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">Upload your profile image</p>
                      <p className="text-xs text-slate-500">Click to choose a file</p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white p-3 text-slate-600 transition group-hover:border-slate-300 group-hover:text-slate-900">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M12 16a1 1 0 0 1-1-1V8.41l-1.3 1.3a1 1 0 1 1-1.4-1.42l3.01-3a1 1 0 0 1 1.38 0l3.01 3a1 1 0 1 1-1.4 1.42L13 8.4V15a1 1 0 0 1-1 1Z" />
                        <path d="M5 16a1 1 0 0 1 1 1v2h12v-2a1 1 0 1 1 2 0v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1Z" />
                      </svg>
                    </div>
                  </div>
                </label>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>Accepted formats: JPG, PNG, WEBP</p>
                  <p>Minimum size: 400×400 px</p>
                  <p>Maximum file size: 5 MB</p>
                </div>
                {(fieldErrors.avatar_url || uploadError) && (
                  <p className="text-sm text-red-600" role="alert">
                    {fieldErrors.avatar_url || uploadError}
                  </p>
                )}
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Agreements</h2>
                  <p className="text-slate-600">Please confirm the following to continue.</p>
                </div>
                <div className="space-y-3" aria-describedby={fieldErrors.code_of_conduct || fieldErrors.code_of_ethics ? 'agreements-error' : undefined}>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreementConduct}
                      onChange={(e) => {
                        setAgreementConduct(e.target.checked)
                        clearFieldError('code_of_conduct')
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      aria-invalid={Boolean(fieldErrors.code_of_conduct)}
                    />
                    I agree to abide by the GOYA Code of Conduct
                  </label>
                  <label className="flex items-start gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreementEthics}
                      onChange={(e) => {
                        setAgreementEthics(e.target.checked)
                        clearFieldError('code_of_ethics')
                      }}
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      aria-invalid={Boolean(fieldErrors.code_of_ethics)}
                    />
                    I agree to the GOYA Code of Ethics
                  </label>
                </div>
                <div className="text-sm text-slate-600">
                  <span className="flex items-center gap-1">Required {requiredMark}</span>
                </div>
                {(fieldErrors.code_of_conduct || fieldErrors.code_of_ethics) && (
                  <p id="agreements-error" className="text-sm text-red-600" role="alert">
                    {fieldErrors.code_of_conduct || fieldErrors.code_of_ethics}
                  </p>
                )}
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">Finish</h2>
                  <p className="text-slate-600">You are ready to join the GOYA community.</p>
                </div>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={isPending}
                  className="w-full rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Finish
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => goToStep(currentStep - 1)}
                className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 hover:border-slate-400"
              >
                Back
              </button>
            ) : (
              <span />
            )}

            {currentStep < TOTAL_STEPS && (
              <button
                type="button"
                onClick={() => startTransition(handleNext)}
                disabled={
                  isPending ||
                  uploading ||
                  (currentStep === 6 && (!profile.avatar_url || Boolean(uploadError)))
                }
                className="rounded-lg bg-slate-900 px-6 py-2 text-sm text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
