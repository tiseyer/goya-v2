'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextareaInput from '../components/inputs/TextareaInput';

export default function Step_S_Bio() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.bio ?? '';

  return (
    <OnboardingStep
      title="Your Profile Bio"
      subtitle="Tell your story. Share your background, your journey, your passions and what brings you to GOYA."
      nextDisabled={val.length < 250}
    >
      <TextareaInput
        value={val}
        onChange={v => setAnswer('bio', v)}
        minLength={250}
        maxLength={1000}
        rows={7}
        placeholder="Share your yoga journey, background, and what you hope to find in the GOYA community…"
      />
    </OnboardingStep>
  );
}
