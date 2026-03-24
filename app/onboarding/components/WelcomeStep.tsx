'use client';

import { useOnboarding } from './OnboardingProvider';

export default function WelcomeStep() {
  const { goToNext, isSaving, answers } = useOnboarding();

  const firstName = answers.first_name ?? '';

  return (
    <div className="text-center space-y-8 py-8">
      {/* Icon */}
      <div className="w-20 h-20 bg-gradient-to-br from-[#4E87A0] to-[#1B3A5C] rounded-3xl flex items-center justify-center mx-auto shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>

      {/* Heading */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1B3A5C]">
          Welcome to GOYA{firstName ? `, ${firstName}` : ''}!
        </h1>
        <p className="text-slate-500 text-base max-w-sm mx-auto leading-relaxed">
          Let's take 2 minutes to set up your profile so you can connect with the global yoga community.
        </p>
      </div>

      {/* Steps preview */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 text-left max-w-sm mx-auto space-y-3">
        {[
          { num: 1, label: 'Choose your member type' },
          { num: 2, label: 'Tell us about yourself' },
          { num: 3, label: 'Add a photo & documents' },
        ].map(step => (
          <div key={step.num} className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-[#4E87A0]/10 text-[#4E87A0] flex items-center justify-center text-xs font-bold shrink-0">
              {step.num}
            </div>
            <span className="text-sm text-slate-600">{step.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => goToNext()}
        disabled={isSaving}
        className="w-full max-w-sm mx-auto py-3.5 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm disabled:opacity-50 block"
      >
        {isSaving ? 'Starting…' : 'Get Started →'}
      </button>

      <p className="text-xs text-slate-400">Takes about 2 minutes</p>
    </div>
  );
}
