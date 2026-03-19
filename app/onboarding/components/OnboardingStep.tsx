'use client';

import { useOnboarding } from './OnboardingProvider';

interface OnboardingStepProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext?: () => Promise<void> | void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hidePrev?: boolean;
}

export default function OnboardingStep({
  title,
  subtitle,
  children,
  onNext,
  nextLabel = 'NEXT →',
  nextDisabled = false,
  hidePrev = false,
}: OnboardingStepProps) {
  const { goToNext, goToPrev, isSaving, savedFlash } = useOnboarding();

  async function handleNext() {
    if (onNext) {
      await onNext();
    } else {
      await goToNext();
    }
  }

  return (
    <div>
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        )}
        <div className="mt-6">
          {children}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex gap-3">
        {!hidePrev && (
          <button
            type="button"
            onClick={goToPrev}
            disabled={isSaving}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-50"
            style={{ background: '#9e6b7a' }}
          >
            ← PREVIOUS
          </button>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={nextDisabled || isSaving}
          className={`px-6 py-3 rounded-xl font-semibold text-sm text-white transition-opacity disabled:opacity-50 ${hidePrev ? 'w-full' : 'flex-1'}`}
          style={{ background: '#9e6b7a' }}
        >
          {isSaving ? 'Saving…' : nextLabel}
        </button>
      </div>

      {/* Autosave indicator */}
      <p className="text-center text-xs text-slate-400 mt-3">
        {savedFlash ? '✓ Progress saved' : 'Your progress is saved automatically ✓'}
      </p>
    </div>
  );
}
