'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345c83]/20 focus:border-[#345c83] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-4 bg-[#f8f9fa]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/GOYA Logo Blue.png" alt="GOYA" className="w-40 mx-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-[var(--goya-border)] shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900 mb-1">Reset your password</h1>
          <p className="text-slate-500 text-sm mb-6">
            {sent ? 'Check your inbox' : "Enter your email and we'll send you a reset link"}
          </p>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#345c83] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-900 font-semibold mb-2">Email sent!</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                We sent a password reset link to{' '}
                <span className="text-slate-900 font-medium">{email}</span>.
                {' '}Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-[#345c83] text-sm font-semibold hover:underline"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={LABEL}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={INPUT}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-[#345c83] text-white font-bold rounded-xl hover:bg-[#1e3a52] transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending\u2026' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          <Link href="/sign-in" className="text-[#345c83] hover:underline font-semibold">
            &larr; Back to sign in
          </Link>
        </p>

        <p className="text-center text-xs text-slate-400 mt-3">
          <Link href="/privacy" className="text-slate-400 hover:text-slate-600 hover:underline">Privacy Policy</Link>
          {' '}&middot;{' '}
          <Link href="/terms" className="text-slate-400 hover:text-slate-600 hover:underline">Terms of Use</Link>
        </p>
      </div>
    </div>
  );
}
