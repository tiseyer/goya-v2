'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_T_OtherOrgDesigs() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.other_org_designations ?? '';

  return (
    <OnboardingStep
      title="What designation(s) do you hold with other organizations?"
      subtitle="For Example: RYT200, RPYT, E-RYT500"
      nextDisabled={!val.trim()}
    >
      <TextInput
        label="Designation(s)"
        value={val}
        onChange={v => setAnswer('other_org_designations', v)}
        placeholder="e.g. RYT200, E-RYT500"
        required
      />
    </OnboardingStep>
  );
}
