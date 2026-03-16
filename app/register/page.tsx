'use client';

import { useState } from 'react';
import Link from 'next/link';

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
const INPUT = 'w-full px-4 py-3 rounded-xl bg-[#1a2744] border border-white/15 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] transition-colors';
const LABEL = 'block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide';

// ─── page ──────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', country: '', agreed: false,
  });

  const canProceed2 =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.country &&
    form.agreed;

  return (
    <div className="min-h-screen bg-[#1a2744] flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="mb-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/GOYA Logo White.png" alt="GOYA" style={{ width: '96px', height: 'auto' }} />
      </Link>

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
                      ? 'bg-[#2dd4bf] text-[#1a2744]'
                      : active
                      ? 'bg-[#2dd4bf] text-[#1a2744] ring-4 ring-[#2dd4bf]/20'
                      : 'bg-white/10 text-slate-500'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.n}
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    active ? 'text-[#2dd4bf]' : done ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {/* Connector */}
                {i < STEPS.length - 1 && (
                  <div className="w-16 sm:w-24 mx-2 mb-5">
                    <div className="h-px relative overflow-hidden rounded-full bg-white/10">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#2dd4bf] transition-all duration-500"
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
        <div className="bg-[#1e2e56] rounded-2xl border border-white/8 shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10" key={step}>
            <div className="animate-step-in">

              {/* ── Step 1: Role ──────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <div className="mb-7">
                    <h1 className="text-xl font-bold text-white mb-1.5">How do you practice?</h1>
                    <p className="text-slate-400 text-sm">Choose the role that best describes you.</p>
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
                              ? 'border-[#2dd4bf] bg-[#2dd4bf]/8'
                              : 'border-white/10 bg-[#1a2744] hover:border-white/25 hover:bg-white/5'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`mt-0.5 shrink-0 transition-colors ${selected ? 'text-[#2dd4bf]' : 'text-slate-500'}`}>
                            {r.icon}
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm mb-1 transition-colors ${selected ? 'text-white' : 'text-slate-200'}`}>
                              {r.label}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                          </div>
                          {/* Checkmark */}
                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${
                            selected ? 'bg-[#2dd4bf] border-[#2dd4bf]' : 'border-white/20'
                          }`}>
                            {selected && (
                              <svg className="w-3 h-3 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-600 mb-6 text-center">
                    Want a School account? Register as a Teacher — you can found a school from your profile.
                  </p>

                  <button
                    disabled={!role}
                    onClick={() => setStep(2)}
                    className="w-full bg-[#2dd4bf] text-[#1a2744] py-3.5 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Continue →
                  </button>
                </>
              )}

              {/* ── Step 2: Form ──────────────────────────────────────── */}
              {step === 2 && (
                <>
                  <div className="mb-7">
                    <h1 className="text-xl font-bold text-white mb-1.5">Create your account</h1>
                    <p className="text-slate-400 text-sm">
                      Joining as{' '}
                      <span className="text-[#2dd4bf] font-semibold">{role}</span>
                    </p>
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
                        <p className="text-xs text-rose-400 mt-1.5">Password must be at least 8 characters</p>
                      )}
                    </div>

                    <div>
                      <label className={LABEL}>Country</label>
                      <select
                        value={form.country}
                        onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                        className={INPUT}
                      >
                        <option value="" className="bg-[#1a2744]">Select your country</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c} className="bg-[#1a2744]">{c}</option>
                        ))}
                      </select>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-all ${
                        form.agreed ? 'bg-[#2dd4bf] border-[#2dd4bf]' : 'border-white/20 group-hover:border-white/40'
                      }`}
                        onClick={() => setForm(f => ({ ...f, agreed: !f.agreed }))}
                      >
                        {form.agreed && (
                          <svg className="w-3 h-3 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 leading-relaxed pt-0.5">
                        I agree to the{' '}
                        <Link href="/terms" className="text-[#2dd4bf] hover:underline">Terms of Use</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-[#2dd4bf] hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="px-5 py-3.5 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:border-white/30 text-sm font-semibold transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      disabled={!canProceed2}
                      onClick={() => setStep(3)}
                      className="flex-1 bg-[#2dd4bf] text-[#1a2744] py-3.5 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Create Account →
                    </button>
                  </div>
                </>
              )}

              {/* ── Step 3: Success ───────────────────────────────────── */}
              {step === 3 && (
                <div className="text-center py-4">
                  {/* Checkmark */}
                  <div className="relative w-20 h-20 mx-auto mb-7">
                    <div className="absolute inset-0 bg-[#2dd4bf]/20 rounded-full animate-ping" style={{ animationDuration: '1.5s', animationIterationCount: 1 }} />
                    <div className="relative w-20 h-20 bg-[#2dd4bf] rounded-full flex items-center justify-center shadow-lg shadow-[#2dd4bf]/30">
                      <svg className="w-9 h-9 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold text-white mb-2">
                    Welcome to GOYA{form.firstName ? `, ${form.firstName}` : ''}!
                  </h1>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                    Your account is ready. Explore the global yoga community and connect with practitioners worldwide.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Link
                      href="/members"
                      className="bg-[#2dd4bf] text-[#1a2744] px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors inline-flex items-center justify-center gap-2"
                    >
                      Explore Members
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                    <Link
                      href="/academy"
                      className="border border-white/15 text-slate-300 hover:text-white hover:border-white/30 px-6 py-3.5 rounded-xl font-semibold text-sm transition-colors"
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
          <p className="text-center text-slate-600 text-xs mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#2dd4bf] hover:underline font-semibold">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
