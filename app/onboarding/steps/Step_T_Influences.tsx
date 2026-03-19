'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';

const OPTIONS = [
  { value: 'traditional_lineages', label: 'Traditional Lineages' },
  { value: 'eastern_philosophy', label: 'Eastern Philosophy' },
  { value: 'modern_contemporary', label: 'Modern Contemporary Yoga Educators' },
  { value: 'independent_self_study', label: 'Independent Self-Study' },
];

export default function Step_T_Influences() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.influences ?? [];

  return (
    <OnboardingStep
      title="Influences"
      subtitle="What has most influenced your teaching? Select all that apply."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={OPTIONS}
        value={val}
        onChange={v => setAnswer('influences', v)}
      />
    </OnboardingStep>
  );
}
