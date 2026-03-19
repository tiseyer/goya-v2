'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';

const OPTIONS = [
  { value: 'strength_stability', label: 'Strength & Stability' },
  { value: 'flexibility_mobility', label: 'Flexibility & Mobility' },
  { value: 'balance_coordination', label: 'Balance & Coordination' },
  { value: 'relaxation_stress', label: 'Relaxation & Stress Relief' },
  { value: 'meditation_mindfulness', label: 'Meditation & Mindfulness' },
  { value: 'traditional_teachings', label: 'Traditional Teachings' },
  { value: 'breath_work', label: 'Breath Work' },
  { value: 'daily_movement', label: 'Daily Movement & Wellbeing' },
  { value: 'restorative_recovery', label: 'Restorative & Recovery' },
  { value: 'energy_spiritual', label: 'Energy & Spiritual Exploration' },
  { value: 'teaching_skill', label: 'Teaching & Skill Development' },
];

export default function Step_T_Focus() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.teaching_focus ?? [];

  return (
    <OnboardingStep
      title="Teaching Focus"
      subtitle="Select all that apply."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={OPTIONS}
        value={val}
        onChange={v => setAnswer('teaching_focus', v)}
      />
    </OnboardingStep>
  );
}
