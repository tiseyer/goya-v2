'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

export default function Step_Email() {
  const { answers, setAnswer, userEmail } = useOnboarding();
  const email = answers.email ?? userEmail;

  return (
    <OnboardingStep
      title="Email"
      nextDisabled={!email.trim()}
    >
      <TextInput
        label="Email Address"
        value={email}
        onChange={v => setAnswer('email', v)}
        type="email"
        required
      />
    </OnboardingStep>
  );
}
