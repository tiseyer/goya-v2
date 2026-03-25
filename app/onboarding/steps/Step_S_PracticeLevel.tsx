'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import RadioCards from '../components/inputs/RadioCards';

const OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export default function Step_S_PracticeLevel() {
  const { answers, setAnswer } = useOnboarding();

  return (
    <OnboardingStep
      title="Practice Level"
      subtitle="Which experience level best describes your current practice?"
      nextDisabled={!answers.practice_level}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.practice_level}
        onChange={v => setAnswer('practice_level', v)}
        columns={3}
      />
    </OnboardingStep>
  );
}
