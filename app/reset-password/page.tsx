'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const INPUT = 'w-full px-4 py-3 rounded-xl bg-[#1a2744] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide';

export default function ResetPasswordPage() {

  // 'loading' = exchanging token, 'ready' = show form, 'error' = link invalid, 'success' = done
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'success'>('loading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Safety net: if any old links still carry ?code= directly to this page,
    // redirect through /auth/callback for server-side code exchange.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=/reset-password`;
      return;
    }

    let settled = false;

    // Listen for PASSWORD_RECOVERY event (fires when session has recovery grant)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        settled = true;
        setStatus('ready');
      }
    });

    // Check for existing session established by /auth/callback redirect
    // Use getUser() instead of getSession() — getUser() validates with the server
    // and is more reliable after a server-side code exchange redirect.
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (settled) return; // onAuthStateChange already handled it
      if (user) {
        setStatus('ready');
      } else {
        // No session — wait briefly for onAuthStateChange before giving up
        // (cookies may still be propagating)
        setTimeout(() => {
          if (!settled) {
            setStatus('error');
          }
        }, 2000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setStatus('success');

    // Clear cookie server-side, then hard redirect
    try {
      await fetch('/api/auth/complete-reset', { method: 'POST' });
    } catch {
      // Even if API call fails, still try to redirect
    }

    // Hard redirect ensures middleware sees cleared cookie on the fresh request
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
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
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
          <p className="text-slate-400 text-sm mt-1">Choose a strong password for your account</p>
        </div>

        <div className="bg-[#243560] rounded-2xl p-8 border border-white/10 shadow-2xl">
          {/* Loading — exchanging token */}
          {status === 'loading' && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-8 h-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Verifying reset link…</p>
            </div>
          )}

          {/* Invalid / expired link */}
          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Link expired or invalid</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                This password reset link has expired or already been used. Request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-[#2dd4bf] text-[#1a2744] font-bold px-6 py-2.5 rounded-xl hover:bg-[#14b8a6] transition-colors text-sm"
              >
                Request new link
              </Link>
            </div>
          )}

          {/* Password form */}
          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={LABEL}>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={INPUT}
                  placeholder="Min. 8 characters"
                  required
                  autoFocus
                />
                {password.length > 0 && password.length < 8 && (
                  <p className="text-xs text-rose-400 mt-1.5">Password must be at least 8 characters</p>
                )}
              </div>
              <div>
                <label className={LABEL}>Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className={INPUT}
                  placeholder="Repeat your password"
                  required
                />
              </div>

              {formError && <p className="text-red-400 text-sm">{formError}</p>}

              <button
                type="submit"
                disabled={submitting || !password || !confirm}
                className="w-full py-3 bg-[#2dd4bf] text-[#1a2744] font-bold rounded-xl hover:bg-[#14b8a6] transition-colors disabled:opacity-60"
              >
                {submitting ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          {/* Success */}
          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-[#2dd4bf] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-2">Password updated!</p>
              <p className="text-slate-400 text-sm">Redirecting you to your dashboard…</p>
            </div>
          )}
        </div>

        {status !== 'success' && (
          <p className="text-center text-slate-600 text-xs mt-6">
            <Link href="/sign-in" className="text-[#2dd4bf] hover:underline font-semibold">
              ← Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
