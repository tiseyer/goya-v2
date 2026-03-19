'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const INPUT = 'w-full px-4 py-3 rounded-xl bg-[#1a2744] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#1e2e56] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/GOYA Logo White.png" alt="GOYA" className="h-10 mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-slate-400 text-sm mt-1">
            {sent ? 'Check your inbox' : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="bg-[#243560] rounded-2xl p-8 border border-white/10 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#2dd4bf] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Email sent!</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                We sent a password reset link to{' '}
                <span className="text-white font-medium">{email}</span>.
                {' '}Check your spam folder if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-[#2dd4bf] text-sm font-semibold hover:underline"
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

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 bg-[#2dd4bf] text-[#1a2744] font-bold rounded-xl hover:bg-[#14b8a6] transition-colors disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          <Link href="/sign-in" className="text-[#2dd4bf] hover:underline font-semibold">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
