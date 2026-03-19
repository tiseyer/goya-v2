'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const INPUT = 'w-full px-4 py-3 rounded-xl bg-[#1a2744] border border-white/15 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }
    router.refresh();
    router.push('/dashboard');
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
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your GOYA account</p>
        </div>

        <div className="bg-[#243560] rounded-2xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={LABEL}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={INPUT}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</span>
                <Link href="/forgot-password" className="text-[10px] text-[#2dd4bf] hover:underline font-semibold uppercase tracking-wide">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={INPUT}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#2dd4bf] text-[#1a2744] font-bold rounded-xl hover:bg-[#14b8a6] transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in\u2026' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#2dd4bf] font-semibold hover:underline">Join GOYA</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
