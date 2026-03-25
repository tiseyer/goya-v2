'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextareaInput from '../components/inputs/TextareaInput';

export default function Step_T_Bio() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.bio ?? '';

  return (
    <OnboardingStep
      title="Your Profile Bio"
      subtitle="Tell your story. Share your teaching journey, certifications, approach, and what inspires you."
      nextDisabled={val.length < 250}
    >
      <TextareaInput
        value={val}
        onChange={v => setAnswer('bio', v)}
        minLength={250}
        maxLength={1000}
        rows={7}
        placeholder="Share your teaching background, certifications, philosophy, and what you love most about teaching yoga…"
      />
    </OnboardingStep>
  );
}
