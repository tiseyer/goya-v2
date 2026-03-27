'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ─── types & data ──────────────────────────────────────────────────────────────

type Role = 'Student' | 'Teacher' | 'Wellness Practitioner';

const ROLES: Array<{ value: Role; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: 'Student',
    label: 'Student',
    description: 'Deepen your practice and connect with a global community of practitioners.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'Teacher',
    label: 'Teacher',
    description: 'Showcase your credentials, log CE hours, and grow your teaching presence.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    value: 'Wellness Practitioner',
    label: 'Wellness Practitioner',
    description: 'Integrate yoga with other healing modalities and reach a wider audience.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

const COUNTRIES = [
  'Australia', 'Austria', 'Belgium', 'Brazil', 'Canada', 'China', 'Denmark', 'Finland',
  'France', 'Germany', 'Ghana', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan',
  'Mexico', 'Netherlands', 'New Zealand', 'Norway', 'Portugal', 'South Korea', 'Spain',
  'Sweden', 'Switzerland', 'United Kingdom', 'United States', 'Other',
];

const STEPS = [
  { n: 1, label: 'Choose Role' },
  { n: 2, label: 'Your Info' },
  { n: 3, label: 'Welcome' },
];

// ─── shared input style ────────────────────────────────────────────────────────
const INPUT = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345c83]/20 focus:border-[#345c83] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide';

// ─── page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', country: '', agreed: false,
  });

  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => router.push('/dashboard'), 2500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

  const canProceed2 =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.country &&
    form.agreed;

  async function handleOAuthLogin(provider: 'google' | 'apple') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
      },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col items-center justify-center px-4 bg-[#f8f9fa]">

      {/* Logo */}
      <div className="text-center mb-6">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/GOYA Logo Blue.png" alt="GOYA" className="h-8 mx-auto" />
        </Link>
      </div>

      {/* Card — same container for every step */}
      <div className="w-full max-w-[520px]">

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8 select-none">
          {STEPS.map((s, i) => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    done
                      ? 'bg-[#345c83] text-white'
                      : active
                      ? 'bg-[#345c83] text-white ring-4 ring-[#345c83]/20'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    active ? 'text-[#345c83]' : done ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="w-16 sm:w-24 mx-2 mb-5">
                    <div className="h-px relative overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#345c83] transition-all duration-500"
                        style={{ width: step > s.n ? '100%' : '0%' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Step content — same card shell */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 sm:p-10" key={step}>
            <div className="animate-step-in">

              {/* ── Step 1: Role ──────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <div className="mb-7">
                    <h1 className="text-xl font-bold text-slate-900 mb-1.5">How do you practice?</h1>
                    <p className="text-slate-500 text-sm">Choose the role that best describes you.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 mb-5">
                    {ROLES.map(r => {
                      const selected = role === r.value;
                      return (
                        <button
                          key={r.value}
                          onClick={() => setRole(r.value)}
                          className={`flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                            selected
                              ? 'border-[#345c83] bg-[#eef4f9]'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`mt-0.5 shrink-0 transition-colors ${selected ? 'text-[#345c83]' : 'text-slate-400'}`}>
                            {r.icon}
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm mb-1 transition-colors ${selected ? 'text-slate-900' : 'text-slate-700'}`}>
                              {r.label}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                          </div>
                          {/* Checkmark */}
                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                            selected ? 'bg-[#345c83] border-[#345c83]' : 'border-slate-300'
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-400 mb-6 text-center">
                    Want a School account? Register as a Teacher — you can found a school from your profile.
                  </p>

                  <button
                    disabled={!role}
                    onClick={() => setStep(2)}
                    className="w-full bg-[#345c83] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1e3a52] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue &rarr;
                  </button>
                </>
              )}

              {/* ── Step 2: Form ──────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <div className="mb-7">
                    <h1 className="text-xl font-bold text-slate-900 mb-1.5">Create your account</h1>
                    <p className="text-slate-500 text-sm">
                      Joining as{' '}
                      <span className="text-[#345c83] font-semibold">{role}</span>
                    </p>
                  </div>

                  {/* Social login */}
                  <div className="space-y-3 mb-6">
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('google')}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Continue with Google
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOAuthLogin('apple')}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      Continue with Apple
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium uppercase">or</span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL}>First Name</label>
                        <input
                          type="text" placeholder="Ada" value={form.firstName}
                          onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                          className={INPUT}
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Last Name</label>
                        <input
                          type="text" placeholder="Lovelace" value={form.lastName}
                          onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                          className={INPUT}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL}>Email Address</label>
                      <input
                        type="email" placeholder="you@example.com" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={INPUT}
                      />
                    </div>

                    <div>
                      <label className={LABEL}>Password</label>
                      <input
                        type="password" placeholder="Min. 8 characters" value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className={INPUT}
                      />
                      {form.password.length > 0 && form.password.length < 8 && (
                        <p className="text-xs text-rose-500 mt-1.5">Password must be at least 8 characters</p>
                      )}
                    </div>

                    <div>
                      <label className={LABEL}>Country</label>
                      <select
                        value={form.country}
                        onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                        className={INPUT}
                      >
                        <option value="">Select your country</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${
                        form.agreed ? 'bg-[#345c83] border-[#345c83]' : 'border-slate-300 group-hover:border-slate-400'
                      }`}
                        onClick={() => setForm(f => ({ ...f, agreed: !f.agreed }))}
                      >
                        {form.agreed && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 leading-relaxed pt-0.5">
                        I agree to the{' '}
                        <Link href="/terms" className="text-[#345c83] hover:underline">Terms of Use</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-[#345c83] hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-5 py-3.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 text-sm font-semibold transition-colors"
                    >
                      &larr; Back
                    </button>
                    <button
                      disabled={!canProceed2 || loading}
                      onClick={async () => {
                        setLoading(true);
                        setError('');
                        const { error } = await supabase.auth.signUp({
                          email: form.email,
                          password: form.password,
                          options: {
                            data: {
                              full_name: `${form.firstName} ${form.lastName}`,
                              role: role,
                              country: form.country,
                            },
                          },
                        });
                        if (error) {
                          setError(error.message);
                          setLoading(false);
                          return;
                        }
                        setStep(3);
                      }}
                      className="flex-1 bg-[#345c83] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#1e3a52] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Account\u2026' : 'Create Account \u2192'}
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 3: Success ───────────────────────────────────── */}
              {step === 3 && (
                <div className="text-center py-4">
                  {/* Checkmark */}
                  <div className="relative w-20 h-20 mx-auto mb-7">
                    <div className="absolute inset-0 bg-[#345c83]/20 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationIterationCount: 1 }} />
                    <div className="relative w-20 h-20 bg-[#345c83] rounded-full flex items-center justify-center shadow-lg shadow-[#345c83]/30">
                      <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-slate-900 mb-2">
                    Welcome to GOYA{form.firstName ? `, ${form.firstName}` : ''}!
                  </h1>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    Your account is ready. Explore the global yoga community and connect with practitioners worldwide.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Link
                      href="/members"
                      className="bg-[#345c83] text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#1e3a52] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      Explore Members
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link
                      href="/academy"
                      className="border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                      Browse Academy
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Sign-in link */}
        {step < 3 && (
          <p className="text-center text-slate-400 text-xs mt-6">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#345c83] hover:underline font-semibold">Sign in</Link>
          </p>
        )}

        {/* Privacy / Terms */}
        {step < 3 && (
          <p className="text-center text-xs text-slate-400 mt-3">
            <Link href="/privacy" className="text-slate-400 hover:text-slate-600 hover:underline">Privacy Policy</Link>
            {' '}&middot;{' '}
            <Link href="/terms" className="text-slate-400 hover:text-slate-600 hover:underline">Terms of Use</Link>
          </p>
        )}
      </div>
    </div>
  );
}
