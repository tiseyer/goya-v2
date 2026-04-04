'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp'
import { supabase } from '@/lib/supabase'

interface Props {
  maskedEmail: string
}

export default function VerifyDeviceClient({ maskedEmail }: Props) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'error' | 'success'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Cooldown countdown — decrements once per second
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const sendOTP = useCallback(async () => {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/device-verification/send', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setStatus('error')
        setErrorMsg(data.error ?? 'Failed to send verification code.')
        return
      }
      setStatus('sent')
      setCooldown(60)
    } catch {
      setStatus('error')
      setErrorMsg('Failed to send verification code. Please try again.')
    }
  }, [])

  // Auto-send on mount
  useEffect(() => {
    sendOTP()
  }, [sendOTP])

  const verifyOTP = useCallback(async (otpValue: string) => {
    setStatus('verifying')
    setErrorMsg('')
    try {
      const res = await fetch('/api/device-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpValue }),
      })
      const data = await res.json() as { success?: boolean; error?: string; remainingAttempts?: number }

      if (data.success) {
        setStatus('success')
        router.push('/dashboard')
        return
      }

      // Handle known error cases
      if (data.error === 'code_expired') {
        setErrorMsg('Code expired — sending a new one')
        setOtp('')
        sendOTP()
        return
      }
      if (data.error === 'too_many_attempts') {
        setStatus('error')
        setErrorMsg('Too many attempts. Please sign out and try again.')
        return
      }
      if (data.error === 'invalid_code') {
        setStatus('sent')
        const remaining = data.remainingAttempts
        setErrorMsg(
          remaining !== undefined && remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
            : 'Incorrect code.',
        )
        setOtp('')
        return
      }

      // Fallback
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
      setOtp('')
    } catch {
      setStatus('error')
      setErrorMsg('Something went wrong. Please try again.')
      setOtp('')
    }
  }, [router, sendOTP])

  function handleOtpChange(value: string) {
    setOtp(value)
    if (value.length === 6) {
      verifyOTP(value)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  const isBusy = status === 'sending' || status === 'verifying' || status === 'success'
  const resendDisabled = isBusy || cooldown > 0

  return (
    <div className="bg-[#243560] rounded-2xl p-8 border border-white/10 shadow-2xl">
      {/* Subtitle */}
      <p className="text-slate-300 text-sm text-center mb-6">
        We sent a verification code to{' '}
        <span className="text-[#2dd4bf] font-semibold">{maskedEmail}</span>
      </p>

      {/* OTP Input */}
      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={handleOtpChange}
          disabled={isBusy}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
            <InputOTPSlot index={1} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
            <InputOTPSlot index={2} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
            <InputOTPSlot index={3} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
            <InputOTPSlot index={4} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
            <InputOTPSlot index={5} className="w-10 h-12 text-lg bg-[#1a2744] border-white/15 text-white" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Status messages */}
      {status === 'sending' && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Sending code…</p>
        </div>
      )}

      {status === 'verifying' && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-4 h-4 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Verifying…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <p className="text-[#2dd4bf] text-sm font-semibold">Verified! Redirecting…</p>
        </div>
      )}

      {errorMsg && (
        <p className="text-red-400 text-sm text-center mb-4">{errorMsg}</p>
      )}

      {/* Resend button */}
      <button
        type="button"
        onClick={() => {
          setOtp('')
          sendOTP()
        }}
        disabled={resendDisabled}
        className="w-full py-3 bg-[#2dd4bf] text-[#1a2744] font-bold rounded-xl hover:bg-[#14b8a6] transition-colors disabled:opacity-60 text-sm mb-4"
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
      </button>

      {/* Sign out */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-slate-400 hover:text-white text-sm underline cursor-pointer transition-colors"
        >
          Not you? Sign out
        </button>
      </div>
    </div>
  )
}
