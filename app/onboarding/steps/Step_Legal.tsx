'use client';

import { useState } from 'react';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TermsCheckboxGroup from '../components/inputs/TermsCheckboxGroup';

export default function Step_Legal() {
  const { goToNext } = useOnboarding();
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);

  function handleChange(index: number, checked: boolean) {
    setChecks(prev => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
  }

  const allAgreed = checks.every(Boolean);

  return (
    <OnboardingStep
      title="Almost there! Please review and agree to the following."
      nextDisabled={!allAgreed}
      nextLabel="AGREE & CONTINUE →"
      onNext={async () => { await goToNext({ agreed_terms: true }); }}
    >
      <TermsCheckboxGroup value={checks} onChange={handleChange} />
    </OnboardingStep>
  );
}
