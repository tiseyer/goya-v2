'use client';

import Link from 'next/link';
import { useOnboarding } from './OnboardingProvider';

export default function CompletionStep() {
  const { answers } = useOnboarding();
  const firstName   = answers.first_name ?? 'there';
  const isTeacher   = answers.member_type === 'teacher' || answers.member_type === 'wellness_practitioner';

  return (
    <div className="text-center space-y-8 py-8">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Heading */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C]">
          You're all set, {firstName}!
        </h1>
        <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
          Your GOYA profile has been created. Welcome to the community.
        </p>
      </div>

      {/* Verification notice for teachers */}
      {isTeacher && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 max-w-sm mx-auto text-left">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-800 mb-1">Verification pending</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Our team will review your credentials within 1–3 business days. You'll receive an email once verified.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 max-w-sm mx-auto text-left space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What's next</p>
        {[
          { label: 'Explore the Academy', href: '/academy', icon: '📚' },
          { label: 'Browse Events',       href: '/events',  icon: '🗓' },
          { label: 'Find Connections',    href: '/connections', icon: '🤝' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
            <svg className="w-3.5 h-3.5 ml-auto text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Dashboard CTA */}
      <Link
        href="/dashboard"
        className="inline-block w-full max-w-sm py-3.5 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm"
      >
        Go to Dashboard →
      </Link>
    </div>
  );
}
