'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextareaInput from '../components/inputs/TextareaInput';

export default function Step_S_Introduction() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.introduction ?? '';

  return (
    <OnboardingStep
      title="Your Introduction"
      subtitle="Write a short sentence in first person that introduces you to the GOYA community."
      nextDisabled={!val.trim()}
    >
      <TextareaInput
        value={val}
        onChange={v => setAnswer('introduction', v)}
        placeholder="SAMPLE: I'm Linda from Denver and am currently taking my 200 hour yoga teacher training. I am a nurse, mom & dog lover!"
        maxLength={150}
        rows={4}
      />
    </OnboardingStep>
  );
}
