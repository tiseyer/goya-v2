'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_T_OtherOrgReg() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.other_org_registration ?? '';

  return (
    <OnboardingStep
      title="What is your Membership or Registration Number with the organization?"
      subtitle="If you have more than one, please list just one."
      nextDisabled={!val.trim()}
    >
      <TextInput
        label="Registration Number"
        value={val}
        onChange={v => setAnswer('other_org_registration', v)}
        placeholder="e.g. RYT-12345678"
        required
      />
    </OnboardingStep>
  );
}
