'use client';

import OnboardingProvider from './components/OnboardingProvider';
import OnboardingShell from './components/OnboardingShell';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingShell>
        {children}
      </OnboardingShell>
    </OnboardingProvider>
  );
}
