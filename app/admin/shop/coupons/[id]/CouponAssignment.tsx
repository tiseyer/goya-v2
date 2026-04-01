'use client'

import { useState, useTransition } from 'react'
import { assignCoupon } from './actions'

type Profile = {
  id: string
  full_name: string | null
  email: string | null
}

interface CouponAssignmentProps {
  stripeCouponId: string
  allProfiles: Profile[]
}

export default function CouponAssignment({ stripeCouponId, allProfiles }: CouponAssignmentProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const filtered = search.trim()
    ? allProfiles.filter((p) => {
        const q = search.toLowerCase()
        return (
          (p.full_name ?? '').toLowerCase().includes(q) ||
          (p.email ?? '').toLowerCase().includes(q)
        )
      })
    : []

  function handleSelectProfile(profile: Profile) {
    setSelectedUserId(profile.id)
    setSearch(`${profile.full_name ?? ''} (${profile.email ?? ''})`)
  }

  function handleAssign() {
    if (!selectedUserId) return
    setToast(null)

    startTransition(async () => {
      const result = await assignCoupon(stripeCouponId, selectedUserId)
      if (result.success) {
        setToast({ type: 'success', message: 'Coupon assigned successfully.' })
        setSelectedUserId('')
        setSearch('')
      } else {
        setToast({ type: 'error', message: result.error ?? 'Failed to assign coupon.' })
      }
    })
  }

  return (
    <div className="space-y-3">
      {/* User search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setSelectedUserId('')
          }}
          placeholder="Search user by name or email..."
          className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
        />
        {/* Dropdown results */}
        {filtered.length > 0 && !selectedUserId && (
          <ul className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.slice(0, 20).map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  onClick={() => handleSelectProfile(profile)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#F3F4F6] transition-colors"
                >
                  <span className="font-medium text-[#374151]">{profile.full_name ?? '(no name)'}</span>
                  {profile.email && (
                    <span className="ml-1.5 text-[#6B7280]">{profile.email}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Assign button */}
      <button
        type="button"
        onClick={handleAssign}
        disabled={!selectedUserId || isPending}
        className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#142d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Assigning...' : 'Assign Coupon'}
      </button>

      {/* Toast feedback */}
      {toast && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
