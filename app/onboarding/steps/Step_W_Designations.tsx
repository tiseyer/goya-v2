'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';
import TextInput from '../components/inputs/TextInput';

const OPTIONS = [
  { value: 'Massage Therapist', label: 'Massage Therapist' },
  { value: 'Acupuncturist', label: 'Acupuncturist' },
  { value: 'Naturopath', label: 'Naturopath' },
  { value: 'Dietician', label: 'Dietician' },
  { value: 'Psychologist', label: 'Psychologist' },
  { value: 'Psychotherapist', label: 'Psychotherapist' },
  { value: 'Yoga Therapist', label: 'Yoga Therapist' },
  { value: 'Nurse Practitioner', label: 'Nurse Practitioner' },
  { value: 'Reiki Master', label: 'Reiki Master' },
  { value: 'Chiropractor', label: 'Chiropractor' },
  { value: 'Cranio-Sacral Therapist', label: 'Cranio-Sacral Therapist' },
  { value: 'Counsellor', label: 'Counsellor' },
  { value: 'Herbalist', label: 'Herbalist' },
  { value: 'TCM Practitioner', label: 'TCM Practitioner' },
  { value: 'Osteopath', label: 'Osteopath' },
  { value: 'Other', label: 'Other' },
];

export default function Step_W_Designations() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.wellness_designations ?? [];
  const showOther = val.includes('Other');

  return (
    <OnboardingStep
      title="What is your Practitioner Designation(s)?"
      nextDisabled={val.length === 0}
    >
      <div className="space-y-4">
        <CheckboxCards
          options={OPTIONS}
          value={val}
          onChange={v => setAnswer('wellness_designations', v)}
        />
        {showOther && (
          <TextInput
            label="Name of 'Other' Designation"
            value={answers.wellness_designation_other ?? ''}
            onChange={v => setAnswer('wellness_designation_other', v)}
            placeholder="Enter your designation"
          />
        )}
      </div>
    </OnboardingStep>
  );
}
