'use client'

import { useState } from 'react'
import { createPortalSession } from './actions'

interface PortalButtonProps {
  stripeCustomerId: string
}

export function PortalButton({ stripeCustomerId }: PortalButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const { url } = await createPortalSession(stripeCustomerId)
      window.location.href = url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#1B3A5C] text-white hover:bg-[#15304d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Weiterleiten…' : 'Verwalten'}
    </button>
  )
}
