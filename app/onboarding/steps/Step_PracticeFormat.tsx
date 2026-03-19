'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import RadioCards from '../components/inputs/RadioCards';

const OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'in_person', label: 'In-Person' },
  { value: 'hybrid', label: 'Hybrid (Online & In-Person)' },
];

const TITLE: Record<string, string> = {
  student: 'How do you practice?',
  teacher: 'How do you teach?',
  wellness_practitioner: 'How do you work with clients?',
};

export default function Step_PracticeFormat() {
  const { answers, setAnswer } = useOnboarding();
  const mt = answers.member_type ?? 'student';

  return (
    <OnboardingStep
      title={TITLE[mt] ?? 'How do you practice?'}
      nextDisabled={!answers.practice_format}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.practice_format}
        onChange={v => setAnswer('practice_format', v as 'online' | 'in_person' | 'hybrid')}
        columns={1}
      />
    </OnboardingStep>
  );
}
