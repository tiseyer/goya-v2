'use client';

import { useOnboarding } from './components/OnboardingProvider';
import WelcomeStep       from './components/WelcomeStep';
import Step1MemberType   from './components/Step1MemberType';
import Step2Profile      from './components/Step2Profile';
import Step3Documents    from './components/Step3Documents';
import CompletionStep    from './components/CompletionStep';

export default function OnboardingPage() {
  const { currentStep, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (currentStep) {
    case 0:  return <WelcomeStep />;
    case 1:  return <Step1MemberType />;
    case 2:  return <Step2Profile />;
    case 3:  return <Step3Documents />;
    default: return <CompletionStep />;
  }
}
