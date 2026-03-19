'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_FullName() {
  const { answers, setAnswer } = useOnboarding();
  const canProceed = !!(answers.first_name?.trim() && answers.last_name?.trim());

  return (
    <OnboardingStep
      title="Full Legal Name"
      nextDisabled={!canProceed}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="First and Middle Name"
          value={answers.first_name ?? ''}
          onChange={v => setAnswer('first_name', v)}
          placeholder="Jane"
          required
        />
        <TextInput
          label="Last Name"
          value={answers.last_name ?? ''}
          onChange={v => setAnswer('last_name', v)}
          placeholder="Smith"
          required
        />
      </div>
    </OnboardingStep>
  );
}
