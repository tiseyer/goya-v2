'use client'

import { useState } from 'react'
import { setNewPassword } from './actions'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6E88B0]/20 focus:border-[#6E88B0] transition-colors'
const LABEL = 'block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide'

export default function SetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await setNewPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // If no error, the server action called redirect() — page navigates automatically
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-4 bg-[#f8f9fa]">
      <div className="w-full max-w-md">
        {/* Logo — no Link wrapper, user must set their password */}
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/GOYA Logo Blue.png" alt="GOYA" className="w-40 mx-auto" />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[var(--goya-border)] shadow-sm">
          {/* Welcome message */}
          <h1 className="text-xl font-bold text-slate-900 text-center">Welcome to GOYA</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">
            Please set a new password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={LABEL} htmlFor="password">New Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className={INPUT}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={INPUT}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6E88B0] text-white font-bold rounded-xl hover:bg-[#1e3a52] transition-colors disabled:opacity-60"
            >
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
