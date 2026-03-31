'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { generateSlug } from '@/lib/schools/slug'
import { createSchoolCheckoutSession } from './actions'

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  slug: string
  name: string
  full_name: string
  image_path: string
  price_cents: number
}

interface WizardDraft {
  schoolName: string
  slug: string
  selectedTypes: string[]
}

const DRAFT_KEY = 'school-registration-draft'
const ANNUAL_PRICE_EUR = 40
const SIGNUP_PRICE_EUR = 99

// Convert product slug to designation type: 'goya-cys200' -> 'CYS200'
function slugToDesignationType(productSlug: string): string {
  return productSlug.replace(/^goya-/, '').toUpperCase()
}

// ── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { n: 1, label: 'School Name' },
    { n: 2, label: 'Designations' },
    { n: 3, label: 'Payment' },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, idx) => {
        const isDone = currentStep > step.n
        const isCurrent = currentStep === step.n

        return (
          <div key={step.n} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors ${
                  isDone
                    ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white'
                    : isCurrent
                    ? 'bg-white border-[#1B3A5C] text-[#1B3A5C]'
                    : 'bg-white border-[#D1D5DB] text-[#9CA3AF]'
                }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.n
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent ? 'text-[#1B3A5C]' : isDone ? 'text-[#1B3A5C]' : 'text-[#9CA3AF]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-colors ${
                  currentStep > step.n ? 'bg-[#1B3A5C]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: School Name ──────────────────────────────────────────────────────

type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error'

function Step1SchoolName({
  schoolName,
  slug,
  onSchoolNameChange,
  onSlugChange,
  onContinue,
}: {
  schoolName: string
  slug: string
  onSchoolNameChange: (v: string) => void
  onSlugChange: (v: string) => void
  onContinue: () => void
}) {
  const [slugStatus, setSlugStatus] = useState<SlugStatus>('idle')
  const [slugEdited, setSlugEdited] = useState(false)
  const [checkTimer, setCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  // Auto-generate slug from name (only if user hasn't manually edited it)
  useEffect(() => {
    if (!slugEdited && schoolName.length > 0) {
      onSlugChange(generateSlug(schoolName))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolName, slugEdited])

  // Debounced uniqueness check
  const scheduleCheck = useCallback((slugValue: string) => {
    if (checkTimer) clearTimeout(checkTimer)
    if (!slugValue || slugValue.length < 1) {
      setSlugStatus('idle')
      return
    }
    setSlugStatus('checking')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/schools/check-slug?slug=${encodeURIComponent(slugValue)}`)
        const data = await res.json()
        setSlugStatus(data.available ? 'available' : 'taken')
      } catch {
        setSlugStatus('error')
      }
    }, 500)
    setCheckTimer(timer)
  }, [checkTimer])

  useEffect(() => {
    if (slug) scheduleCheck(slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  function handleSlugChange(value: string) {
    setSlugEdited(true)
    // Sanitize: lowercase, hyphens only
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')
    onSlugChange(sanitized)
  }

  const canContinue =
    schoolName.trim().length >= 3 &&
    slug.length >= 1 &&
    slugStatus === 'available'

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Name Your School</h2>
      <p className="text-[#6B7280] text-sm mb-8">
        Give your school a name and a unique URL slug.
      </p>

      <div className="space-y-6">
        {/* School Name */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            School Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={schoolName}
            onChange={(e) => onSchoolNameChange(e.target.value)}
            placeholder="e.g. Sunrise Yoga Academy"
            autoFocus
            className="w-full text-base border border-[#E5E7EB] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] transition-colors"
          />
          {schoolName.length > 0 && schoolName.trim().length < 3 && (
            <p className="mt-1.5 text-xs text-[#9CA3AF]">Minimum 3 characters</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            School URL
          </label>
          <div className="flex items-center border border-[#E5E7EB] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A5C]/20 focus-within:border-[#1B3A5C] transition-colors">
            <span className="px-3 py-3 bg-[#F7F8FA] text-sm text-[#9CA3AF] border-r border-[#E5E7EB] whitespace-nowrap select-none">
              goya.org/schools/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-yoga-school"
              className="flex-1 px-3 py-3 outline-none text-sm bg-transparent"
            />
            <div className="px-3">
              {slugStatus === 'checking' && (
                <svg className="animate-spin w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {slugStatus === 'available' && (
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {slugStatus === 'taken' && (
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          <div className="mt-1.5 text-xs">
            {slugStatus === 'available' && <span className="text-green-600">Available</span>}
            {slugStatus === 'taken' && <span className="text-red-500">This URL is already taken. Try a different name.</span>}
            {slugStatus === 'error' && <span className="text-amber-500">Could not verify availability. Please try again.</span>}
            {slugStatus === 'idle' && slug.length === 0 && <span className="text-[#9CA3AF]">A unique URL for your school</span>}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="w-full bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

// ── Step 2: Designations ─────────────────────────────────────────────────────

function Step2Designations({
  products,
  selectedTypes,
  onToggle,
  onContinue,
  onBack,
  isLoading,
}: {
  products: Product[]
  selectedTypes: string[]
  onToggle: (type: string) => void
  onContinue: () => void
  onBack: () => void
  isLoading: boolean
}) {
  const count = selectedTypes.length
  const annualTotal = count * ANNUAL_PRICE_EUR
  const signupTotal = count * SIGNUP_PRICE_EUR

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
        <h2 className="text-2xl font-bold text-[#1B3A5C] mb-2">Choose Your Designations</h2>
        <p className="text-[#6B7280] text-sm mb-8">
          Select the designations your school will offer. Each designation costs EUR {ANNUAL_PRICE_EUR}.00/year plus a one-time EUR {SIGNUP_PRICE_EUR}.00 signup fee.
        </p>

        {/* Product Grid */}
        {products.length === 0 ? (
          <p className="text-center text-[#9CA3AF] py-8">No designations available at this time.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {products.map((product) => {
              const type = slugToDesignationType(product.slug)
              const isSelected = selectedTypes.includes(type)

              return (
                <button
                  key={product.slug}
                  type="button"
                  onClick={() => onToggle(type)}
                  className={`text-left rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 ${
                    isSelected
                      ? 'border-[#1B3A5C] bg-blue-50/50'
                      : 'border-[#E5E7EB] bg-white hover:border-[#C4D0DE]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Designation image */}
                    <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB]">
                      {product.image_path ? (
                        <Image
                          src={product.image_path}
                          alt={product.name}
                          fill
                          className="object-contain p-1"
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#9CA3AF] text-xs font-bold">
                          {product.name.replace('GOYA-', '')}
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[#1B3A5C] text-sm">{product.name}</p>
                        {/* Checkbox indicator */}
                        <div
                          className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                            isSelected ? 'bg-[#1B3A5C] border-[#1B3A5C]' : 'border-[#D1D5DB]'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed">{product.full_name}</p>
                      <p className="text-xs text-[#9CA3AF] mt-1.5">
                        EUR {ANNUAL_PRICE_EUR}/year + EUR {SIGNUP_PRICE_EUR} signup
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Running Total */}
        <div className="bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] p-5 mb-3">
          {count === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center">Select designations above to see pricing</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#374151] font-medium">
                  Selected: {count} designation{count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6B7280]">Annual subscription</span>
                <span className="font-semibold text-[#1B3A5C]">EUR {annualTotal}.00/year</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-[#E5E7EB] pt-2">
                <span className="text-[#6B7280]">One-time signup fee</span>
                <span className="font-semibold text-[#1B3A5C]">EUR {signupTotal}.00</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-[#9CA3AF] mb-6">
          Can&apos;t find your specialty? You can add more designations later.
        </p>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm border border-[#E5E7EB] text-[#4E87A0] hover:bg-[#F7F8FA] transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={count === 0 || isLoading}
            className="flex-1 bg-[#1B3A5C] text-white rounded-xl px-6 py-3 font-semibold text-sm hover:bg-[#16304f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Redirecting to payment...
              </span>
            ) : (
              'Continue to Payment →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Wizard ──────────────────────────────────────────────────────────────

export default function SchoolCreateWizard({ products }: { products: Product[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stepParam = searchParams.get('step')
  const step = stepParam === '2' ? 2 : 1

  const [schoolName, setSchoolName] = useState('')
  const [slug, setSlug] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft: WizardDraft = JSON.parse(saved)
        if (draft.schoolName) setSchoolName(draft.schoolName)
        if (draft.slug) setSlug(draft.slug)
        if (draft.selectedTypes) setSelectedTypes(draft.selectedTypes)
      }
    } catch {
      // ignore
    }
  }, [])

  // Save draft to localStorage on change
  useEffect(() => {
    try {
      const draft: WizardDraft = { schoolName, slug, selectedTypes }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // ignore
    }
  }, [schoolName, slug, selectedTypes])

  function goToStep(n: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (n === 1) {
      params.delete('step')
    } else {
      params.set('step', String(n))
    }
    router.push(`/schools/create?${params.toString()}`)
  }

  function handleToggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  async function handleContinueToPayment() {
    if (selectedTypes.length === 0) return
    setIsLoading(true)
    setPaymentError(null)

    try {
      const result = await createSchoolCheckoutSession(schoolName, slug, selectedTypes)

      if ('url' in result) {
        // Clear draft before redirect
        try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
        window.location.href = result.url
      } else {
        setPaymentError(result.error)
        setIsLoading(false)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setPaymentError(message)
      setIsLoading(false)
    }
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <Step1SchoolName
          schoolName={schoolName}
          slug={slug}
          onSchoolNameChange={setSchoolName}
          onSlugChange={setSlug}
          onContinue={() => goToStep(2)}
        />
      )}

      {step === 2 && (
        <>
          <Step2Designations
            products={products}
            selectedTypes={selectedTypes}
            onToggle={handleToggleType}
            onContinue={handleContinueToPayment}
            onBack={() => goToStep(1)}
            isLoading={isLoading}
          />

          {paymentError && (
            <div className="max-w-3xl mx-auto mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-red-700">{paymentError}</p>
                <button
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="mt-1 text-xs text-red-600 hover:underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
