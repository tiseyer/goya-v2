'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';

const OPTIONS = [
  { value: 'stress_anxiety', label: 'Stress & Anxiety Relief' },
  { value: 'pain_rehabilitation', label: 'Pain Management & Rehabilitation' },
  { value: 'mental_emotional', label: 'Mental Health & Emotional Wellbeing' },
  { value: 'nutrition_lifestyle', label: 'Nutrition & Lifestyle' },
  { value: 'energy_spiritual', label: 'Energy & Spiritual Wellbeing' },
  { value: 'womens_health', label: "Women's Health" },
  { value: 'sports_performance', label: 'Sports Performance & Recovery' },
  { value: 'children_families', label: 'Children & Families' },
  { value: 'chronic_illness', label: 'Chronic Illness Support' },
  { value: 'mindfulness_meditation', label: 'Mindfulness & Meditation' },
  { value: 'other', label: 'Other' },
];

export default function Step_W_Focus() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.wellness_focus ?? [];

  return (
    <OnboardingStep
      title="Wellness Focus"
      subtitle="Select all that apply."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={OPTIONS}
        value={val}
        onChange={v => setAnswer('wellness_focus', v)}
      />
    </OnboardingStep>
  );
}
