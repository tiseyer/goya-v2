'use client';

import { useOnboarding } from './OnboardingProvider';

interface Props {
  stepNumber: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onContinue?: () => void | Promise<void>;
  continueLabel?: string;
  continueDisabled?: boolean;
  hideContinue?: boolean;
}

export default function OnboardingStep({
  stepNumber,
  title,
  subtitle,
  children,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  hideContinue = false,
}: Props) {
  const { goToNext, goToPrev, isSaving, currentStep } = useOnboarding();

  async function handleContinue() {
    if (onContinue) {
      await onContinue();
    } else {
      await goToNext();
    }
  }

  return (
    <div className="space-y-8">
      {/* Step header */}
      <div>
        <p className="text-xs font-semibold text-[#4E87A0] uppercase tracking-widest mb-2">
          Step {stepNumber} of 3
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C] mb-2">{title}</h1>
        {subtitle && (
          <p className="text-slate-500 text-sm leading-relaxed">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div>{children}</div>

      {/* Navigation */}
      {!hideContinue && (
        <div className="flex items-center gap-3 pt-2">
          {currentStep > 1 && (
            <button
              onClick={goToPrev}
              disabled={isSaving}
              className="px-5 py-3 text-sm font-semibold text-slate-500 hover:text-[#1B3A5C] transition-colors disabled:opacity-40"
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={continueDisabled || isSaving}
            className="flex-1 py-3 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : continueLabel}
          </button>
        </div>
      )}
    </div>
  );
}
