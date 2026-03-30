'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';

export const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'croatian', label: 'Croatian' },
  { value: 'czech', label: 'Czech' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'finnish', label: 'Finnish' },
  { value: 'greek', label: 'Greek' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'italian', label: 'Italian' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'mandarin', label: 'Mandarin' },
  { value: 'polish', label: 'Polish' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'slovakian', label: 'Slovakian' },
  { value: 'swedish', label: 'Swedish' },
  { value: 'thai', label: 'Thai' },
  { value: 'ukrainian', label: 'Ukrainian' },
  { value: 'urdu', label: 'Urdu' },
  { value: 'other', label: 'Other' },
];

export default function LanguagesStep() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.languages ?? [];

  return (
    <OnboardingStep
      title="Languages"
      subtitle="Which languages do you practice in? Select all that apply."
      nextDisabled={val.length === 0}
    >
      <CheckboxCards
        options={LANGUAGES}
        value={val}
        onChange={v => setAnswer('languages', v)}
      />
    </OnboardingStep>
  );
}
