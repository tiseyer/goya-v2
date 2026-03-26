'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import RadioCards from '../components/inputs/RadioCards';

const OPTIONS = [
  {
    value: 'student',
    label: 'Student Practitioner',
    description: 'I want to learn and deepen my practice',
  },
  {
    value: 'teacher',
    label: 'Certified Teacher',
    description: 'I teach yoga and want to connect with a global community',
  },
  {
    value: 'wellness_practitioner',
    label: 'Wellness Practitioner',
    description: 'I offer wellness services alongside or beyond yoga',
  },
];

export default function Step_MemberType() {
  const { answers, setAnswer, goToNext } = useOnboarding();

  async function handleNext() {
    await goToNext();
  }

  return (
    <OnboardingStep
      title="Welcome to GOYA"
      subtitle="Let's get you set up. How will you be using GOYA?"
      hidePrev
      nextDisabled={!answers.member_type}
      onNext={handleNext}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.member_type}
        onChange={v => setAnswer('member_type', v as 'student' | 'teacher' | 'wellness_practitioner')}
        columns={1}
      />
    </OnboardingStep>
  );
}
