'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_W_RegulatoryDesigs() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.wellness_regulatory_designations ?? '';

  return (
    <OnboardingStep
      title="Which Designation(s) do you hold with your Regulatory body?"
      subtitle="For Example: RMT, NP"
      nextDisabled={!val.trim()}
    >
      <TextInput
        label="Designation(s)"
        value={val}
        onChange={v => setAnswer('wellness_regulatory_designations', v)}
        placeholder="e.g. RMT, NP"
        required
      />
    </OnboardingStep>
  );
}
