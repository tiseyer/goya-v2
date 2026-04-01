'use client'
import { endImpersonation } from '@/app/actions/impersonation'
import type { ImpersonationState } from '@/lib/impersonation'

export default function ImpersonationBanner({ state }: { state: ImpersonationState }) {
  if (!state.isImpersonating || !state.targetProfile) return null

  const targetName = state.targetProfile.full_name || state.targetProfile.email || 'Unknown User'
  const targetEmail = state.targetProfile.email || ''

  return (
    <div className="fixed top-0 left-0 right-0 z-[9990] bg-amber-400 border-b-2 border-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-4 h-4 text-amber-900 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs font-semibold text-amber-900 truncate">
            Viewing as <span className="font-black">{targetName}</span>
            {targetEmail && <span className="font-normal"> ({targetEmail})</span>}
            {' '}— your actions will affect their account
          </p>
        </div>
        <form action={endImpersonation}>
          <button
            type="submit"
            className="shrink-0 bg-amber-900 text-amber-50 text-xs font-semibold px-3 py-1 rounded-lg hover:bg-amber-800 transition-colors whitespace-nowrap"
          >
            ↩ Switch Back
          </button>
        </form>
      </div>
    </div>
  )
}
