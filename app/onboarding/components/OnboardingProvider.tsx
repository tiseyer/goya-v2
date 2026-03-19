'use client';

import { createContext, useContext } from 'react';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import type { OnboardingAnswers, StepKey } from '../lib/steps';

interface OnboardingContextValue {
  answers: OnboardingAnswers;
  setAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  currentStepKey: StepKey;
  currentIndex: number;
  totalSteps: number;
  stepSequence: StepKey[];
  isLoading: boolean;
  isSaving: boolean;
  savedFlash: boolean;
  userId: string | null;
  userEmail: string;
  goToNext: (overrideAnswers?: Partial<OnboardingAnswers>) => Promise<void>;
  goToPrev: () => void;
  persist: (newAnswers: OnboardingAnswers, newStepKey: StepKey) => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const value = useOnboardingProgress();

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
