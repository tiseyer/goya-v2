'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';
import { YOGA_STYLES } from './Step_S_PracticeStyles';

export default function Step_T_Styles() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.teaching_styles ?? [];

  return (
    <OnboardingStep
      title="Teaching Style(s)"
      subtitle="Which styles do you teach? Choose up to 5."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={YOGA_STYLES}
        value={val}
        onChange={v => setAnswer('teaching_styles', v)}
        maxSelect={5}
      />
    </OnboardingStep>
  );
}
