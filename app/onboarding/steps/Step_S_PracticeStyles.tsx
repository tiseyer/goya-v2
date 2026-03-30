'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';

export const YOGA_STYLES = [
  { value: 'hatha', label: 'Hatha Yoga' },
  { value: 'vinyasa', label: 'Vinyasa Flow' },
  { value: 'yin', label: 'Yin Yoga' },
  { value: 'restorative', label: 'Restorative Yoga' },
  { value: 'ashtanga', label: 'Ashtanga Yoga' },
  { value: 'prenatal', label: 'Prenatal Yoga' },
  { value: 'postnatal', label: 'Postnatal Yoga' },
  { value: 'childrens', label: "Children's Yoga" },
  { value: 'power', label: 'Power Yoga' },
  { value: 'kundalini', label: 'Kundalini Yoga' },
  { value: 'hot', label: 'Hot Yoga' },
  { value: 'gentle', label: 'Gentle Yoga' },
  { value: 'modern_contemporary', label: 'Modern Contemporary Yoga' },
  { value: 'traditional_lineage', label: 'Traditional Lineage Based Yoga' },
  { value: 'trauma_informed', label: 'Trauma-Informed Yoga' },
  { value: 'iyengar', label: 'Iyengar Yoga' },
  { value: 'somatic', label: 'Somatic Yoga' },
  { value: 'chair', label: 'Chair Yoga' },
  { value: 'aerial', label: 'Aerial Yoga' },
];

export default function Step_S_PracticeStyles() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.practice_styles ?? [];

  return (
    <OnboardingStep
      title="Practice Style"
      subtitle="Which styles best describe your practice? Choose 1 to 5 options."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={YOGA_STYLES}
        value={val}
        onChange={v => setAnswer('practice_styles', v)}
        maxSelect={5}
      />
    </OnboardingStep>
  );
}
