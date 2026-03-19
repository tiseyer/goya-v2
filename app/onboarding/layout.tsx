'use client';

import Link from 'next/link';
import OnboardingProvider, { useOnboarding } from './components/OnboardingProvider';

function OnboardingShellInner({ children }: { children: React.ReactNode }) {
  const { currentIndex, totalSteps, currentStepKey, answers } = useOnboarding();
  const showProgress = !!answers.member_type && currentStepKey !== 'member_type';
  const progressPct = totalSteps > 1 ? Math.round(((currentIndex) / (totalSteps - 1)) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f7f6' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-black text-xl tracking-tight text-[#1B3A5C]">
            GOYA
          </Link>
          {showProgress && (
            <span className="text-xs font-semibold text-slate-400">
              Step {currentIndex + 1} of {totalSteps}
            </span>
          )}
        </div>
        {showProgress && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: '#9e6b7a' }}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingShellInner>
        {children}
      </OnboardingShellInner>
    </OnboardingProvider>
  );
}
