'use client';

import Link from 'next/link';
import { useOnboarding } from './OnboardingProvider';

const TOTAL_STEPS = 3;

export default function OnboardingShell({ children }: { children: React.ReactNode }) {
  const { currentStep } = useOnboarding();
  const showProgress = currentStep >= 1 && currentStep <= TOTAL_STEPS;
  const progressPct  = showProgress ? Math.round((currentStep / TOTAL_STEPS) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-bold text-lg tracking-tight text-[#1B3A5C]">
            GOYA
          </Link>

          {/* Step indicator */}
          {showProgress && (
            <span className="text-xs font-semibold text-slate-400">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-[#4E87A0] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </main>
    </div>
  );
}
