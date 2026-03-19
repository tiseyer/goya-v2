'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_W_OrgName() {
  const { answers, setAnswer } = useOnboarding();

  return (
    <OnboardingStep title="Organization Name (if applicable)">
      <TextInput
        label="Organization Name"
        value={answers.wellness_org_name ?? ''}
        onChange={v => setAnswer('wellness_org_name', v)}
        placeholder="Example: Zen Massage Therapy"
        helpText="Leave blank if you practice independently."
      />
    </OnboardingStep>
  );
}
