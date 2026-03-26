'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import RadioCards from '../components/inputs/RadioCards';

const OPTIONS = [
  { value: 'GOYA CYT200', label: 'GOYA CYT200 (200 Hour)' },
  { value: 'GOYA CYT500', label: 'GOYA CYT500 (500 Hour)' },
  { value: 'GOYA CCYT', label: "GOYA CCYT (Children's)" },
  { value: 'GOYA CPYT', label: 'GOYA CPYT (Prenatal)' },
  { value: 'GOYA CRYT', label: 'GOYA CRYT (Restorative)' },
  { value: 'GOYA CYYT', label: 'GOYA CYYT (Yin)' },
  { value: 'GOYA CAYT', label: 'GOYA CAYT (Ayurveda)' },
  { value: 'GOYA CMT', label: 'GOYA CMT (Meditation)' },
];

export default function Step_T_Status() {
  const { answers, setAnswer } = useOnboarding();

  return (
    <OnboardingStep
      title="Which Teacher Status are you registering for?"
      subtitle="Select the designation that best reflects your certification."
      nextDisabled={!answers.teacher_status}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.teacher_status}
        onChange={v => setAnswer('teacher_status', v)}
        columns={2}
      />
    </OnboardingStep>
  );
}
