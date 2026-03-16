'use client';

import { useState } from 'react';
import Link from 'next/link';

type Role = 'Student' | 'Teacher' | 'Wellness Practitioner';

const ROLES: Array<{ value: Role; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: 'Student',
    label: 'Student',
    description: 'I\'m here to learn, deepen my practice, and connect with the global yoga community.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'Teacher',
    label: 'Teacher',
    description: 'I\'m a certified or aspiring yoga teacher looking to showcase my credentials and grow my practice.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    value: 'Wellness Practitioner',
    label: 'Wellness Practitioner',
    description: 'I integrate yoga with other wellness disciplines — therapy, coaching, nutrition, or healing arts.',
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

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', country: '', agreed: false });

  const canProceedStep2 = form.firstName && form.lastName && form.email && form.password.length >= 8 && form.country && form.agreed;

  return (
    <div className="min-h-screen bg-[#1a2744] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link href="/" className="mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/GOYA Logo White.png" alt="GOYA" style={{ width: '100px', height: 'auto' }} />
      </Link>

      <div className="w-full max-w-2xl">
        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? 'bg-[#2dd4bf] text-[#1a2744]' : 'bg-white/10 text-slate-400'
                }`}>
                  {s}
                </div>
                {s < 2 && <div className={`w-16 h-0.5 rounded-full ${step > s ? 'bg-[#2dd4bf]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">How do you practice?</h1>
              <p className="text-slate-400">Choose the role that best describes you.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    role === r.value
                      ? 'bg-[#2dd4bf]/10 border-[#2dd4bf] text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <div className={`mb-4 ${role === r.value ? 'text-[#2dd4bf]' : 'text-slate-400'}`}>
                    {r.icon}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{r.label}</h3>
                  <p className="text-xs leading-relaxed opacity-70">{r.description}</p>
                  {role === r.value && (
                    <div className="mt-3 w-5 h-5 bg-[#2dd4bf] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-center text-slate-500 text-xs mb-6">
              Want to create a School account?{' '}
              <span className="text-slate-400">Register as a Teacher — you can found a school from your profile.</span>
            </p>
            <button
              disabled={!role}
              onClick={() => setStep(2)}
              className="w-full bg-[#2dd4bf] text-[#1a2744] py-3.5 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Basic info */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-8 shadow-xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1a2744] mb-1">Create your account</h1>
              <p className="text-slate-500 text-sm">Joining as a <span className="font-semibold text-[#1a2744]">{role}</span></p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/40 focus:border-[#2dd4bf] bg-white"
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreed}
                  onChange={e => setForm(f => ({ ...f, agreed: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 accent-[#2dd4bf]"
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-[#2dd4bf] hover:underline">Terms of Use</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-[#2dd4bf] hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
                className="flex-1 bg-[#2dd4bf] text-[#1a2744] py-3 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create Account →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="text-center">
            <div className="w-20 h-20 bg-[#2dd4bf] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#2dd4bf]/30">
              <svg className="w-10 h-10 text-[#1a2744]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Welcome to GOYA</h1>
            <p className="text-slate-300 text-lg mb-2">
              {form.firstName ? `Hello, ${form.firstName}!` : 'Your account has been created.'}
            </p>
            <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto">
              You&apos;re now part of the global yoga community. Explore the member directory to connect with practitioners worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/members"
                className="bg-[#2dd4bf] text-[#1a2744] px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#14b8a6] transition-colors inline-flex items-center justify-center gap-2"
              >
                Explore Members
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/academy"
                className="border border-white/20 text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Browse Academy
              </Link>
            </div>
          </div>
        )}

        {step < 3 && (
          <p className="text-center text-slate-500 text-xs mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#2dd4bf] hover:underline font-medium">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
