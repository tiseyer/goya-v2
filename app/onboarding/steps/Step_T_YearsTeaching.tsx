'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import RadioCards from '../components/inputs/RadioCards';

const OPTIONS = [
  { value: '0-1', label: '0–1 years' },
  { value: '1-2', label: '1–2 years' },
  { value: '2-3', label: '2–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10-15', label: '10–15 years' },
  { value: '15-20', label: '15–20 years' },
  { value: '20+', label: '20+ years' },
];

export default function Step_T_YearsTeaching() {
  const { answers, setAnswer } = useOnboarding();

  return (
    <OnboardingStep
      title="Years Teaching"
      nextDisabled={!answers.years_teaching}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.years_teaching}
        onChange={v => setAnswer('years_teaching', v)}
        columns={3}
      />
    </OnboardingStep>
  );
}
