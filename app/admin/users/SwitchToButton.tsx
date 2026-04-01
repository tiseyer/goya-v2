'use client'
import { startImpersonation } from '@/app/actions/impersonation'
import { useState } from 'react'

export default function SwitchToButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <form
      action={async () => {
        setLoading(true)
        await startImpersonation(userId)
      }}
    >
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#00B5A3] border border-[#00B5A3] rounded-lg hover:bg-[#00B5A3]/10 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="w-3 h-3 border border-[#00B5A3] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
        Switch To
      </button>
    </form>
  )
}
