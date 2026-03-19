'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextareaInput from '../components/inputs/TextareaInput';

export default function Step_W_Journey() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.bio ?? '';

  return (
    <OnboardingStep
      title="Your Wellness Journey"
      subtitle="Share your professional journey, background, approach to wellness, and what drives your passion for helping others."
      nextDisabled={val.length < 250}
    >
      <TextareaInput
        value={val}
        onChange={v => setAnswer('bio', v)}
        minLength={250}
        maxLength={1000}
        rows={7}
        placeholder="Share your wellness background, training, philosophy, and what you love most about your work with clients…"
      />
    </OnboardingStep>
  );
}
