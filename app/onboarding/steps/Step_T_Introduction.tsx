'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextareaInput from '../components/inputs/TextareaInput';

export default function Step_T_Introduction() {
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
        placeholder="SAMPLE: I'm a certified yoga teacher based in Vancouver, specializing in Vinyasa and Yin yoga. I'm passionate about helping students find balance in their daily lives."
        maxLength={150}
        rows={4}
      />
    </OnboardingStep>
  );
}
