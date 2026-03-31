'use client'

import { useState, useTransition } from 'react'
import { createBillingPortalSession } from '../actions'
import type { DesignationInfo } from './page'

// ── Constants ─────────────────────────────────────────────────────────────────

const DESIGNATION_LABELS: Record<string, string> = {
  rys_200: 'RYS 200 — 200-Hour Yoga School',
  rys_300: 'RYS 300 — 300-Hour Yoga School',
  rys_500: 'RYS 500 — 500-Hour Yoga School',
  rpys: 'RPYS — Prenatal Yoga School',
  rcys: "RCYS — Children's Yoga School",
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { classes: string; label: string }> = {
    active: { classes: 'bg-green-100 text-green-700', label: 'Active' },
    pending: { classes: 'bg-amber-100 text-amber-700', label: 'Pending' },
    cancelled: { classes: 'bg-red-100 text-red-700', label: 'Cancelled' },
    expired: { classes: 'bg-gray-100 text-gray-500', label: 'Expired' },
  }
  const config = map[status] ?? { classes: 'bg-gray-100 text-gray-500', label: status }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}

// ── Manage Billing Button ─────────────────────────────────────────────────────

function ManageBillingButton({ schoolSlug }: { schoolSlug: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await createBillingPortalSession(schoolSlug)
      if ('error' in result) {
        setError(result.error)
      } else {
        window.location.href = result.url
      }
    })
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#1B3A5C] text-white hover:bg-[#15304d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Redirecting...' : 'Manage Billing'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface SubscriptionClientProps {
  schoolName: string
  schoolSlug: string
  designations: DesignationInfo[]
  hasStripeCustomer: boolean
}

export default function SubscriptionClient({
  schoolName,
  schoolSlug,
  designations,
  hasStripeCustomer,
}: SubscriptionClientProps) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1B3A5C]">Subscription</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Your school&apos;s billing status and subscription management.
        </p>
      </div>

      {/* School subscription card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 mb-4">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">School Subscription</h2>
        <p className="text-sm text-[#1B3A5C] font-medium">{schoolName}</p>

        {designations.length === 0 ? (
          <p className="text-sm text-[#6B7280] mt-2">
            No active designations found. Contact{' '}
            <a href="mailto:support@goya.community" className="text-[#1B3A5C] underline hover:no-underline">
              support@goya.community
            </a>{' '}
            to get started.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {designations.map((d) => {
              const label = DESIGNATION_LABELS[d.designation_type] ?? d.designation_type
              return (
                <li key={d.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#374151] font-medium">{label}</p>
                    {d.stripe_subscription_id && (
                      <p className="text-xs text-[#6B7280] mt-0.5">Subscription active</p>
                    )}
                  </div>
                  <StatusBadge status={d.status} />
                </li>
              )
            })}
          </ul>
        )}

        {hasStripeCustomer ? (
          <ManageBillingButton schoolSlug={schoolSlug} />
        ) : designations.length > 0 ? (
          <p className="mt-4 text-sm text-[#6B7280]">
            No billing account linked to this school. Contact{' '}
            <a href="mailto:support@goya.community" className="text-[#1B3A5C] underline hover:no-underline">
              support@goya.community
            </a>{' '}
            for assistance.
          </p>
        ) : null}
      </div>

      <p className="text-xs text-[#9CA3AF]">
        Billing is managed by GOYA. To add designations or update billing information, contact{' '}
        <a href="mailto:support@goya.community" className="text-[#4E87A0] hover:underline">
          support@goya.community
        </a>
        .
      </p>
    </div>
  )
}
