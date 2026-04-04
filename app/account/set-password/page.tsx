'use client'

import { useState } from 'react'
import { setNewPassword } from './actions'
import { isPasswordStrong } from '@/lib/password-rules'
import PasswordStrengthChecker from '@/app/components/ui/PasswordStrengthChecker'

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345c83]/20 focus:border-[#345c83] transition-colors'
const LABEL = 'block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide'

export default function SetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.set('password', password)
    formData.set('confirmPassword', confirmPassword)
    const result = await setNewPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const canSubmit = isPasswordStrong(password) && confirmPassword === password && !loading

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-4 bg-[#f8f9fa]">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/GOYA Logo Blue.png" alt="GOYA" className="w-40 mx-auto" />
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[var(--goya-border)] shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 text-center">Welcome to GOYA</h1>
          <p className="text-sm text-slate-500 text-center mt-1 mb-6">
            Please set a new password to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={LABEL} htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={INPUT}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthChecker password={password} />
            </div>
            <div>
              <label className={LABEL} htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={INPUT}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-3 bg-[#345c83] text-white font-bold rounded-xl hover:bg-[#1e3a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting password...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
