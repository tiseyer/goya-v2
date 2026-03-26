'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import CheckboxCards from '../components/inputs/CheckboxCards';
import TextInput from '../components/inputs/TextInput';

const ORG_OPTIONS = [
  { value: 'Yoga Alliance', label: 'Yoga Alliance' },
  { value: 'Yoga Alliance Professional UK', label: 'Yoga Alliance Professional UK' },
  { value: 'Yoga Alliance International', label: 'Yoga Alliance International' },
  { value: 'International Association of Yoga Therapists', label: 'International Association of Yoga Therapists' },
  { value: 'American Yoga Council', label: 'American Yoga Council' },
  { value: 'Other', label: 'Other' },
];

export default function Step_T_OtherOrgNames() {
  const { answers, setAnswer } = useOnboarding();
  const val = answers.other_org_names ?? [];
  const showOther = val.includes('Other');

  return (
    <OnboardingStep
      title="Which Organization(s)?"
      subtitle="Choose all that apply."
      nextDisabled={val.length === 0}
    >
      <div className="space-y-4">
        <CheckboxCards
          options={ORG_OPTIONS}
          value={val}
          onChange={v => setAnswer('other_org_names', v)}
        />
        {showOther && (
          <TextInput
            label="Name of 'Other' Organization"
            value={answers.other_org_name_other ?? ''}
            onChange={v => setAnswer('other_org_name_other', v)}
            placeholder="Organization name"
          />
        )}
      </div>
    </OnboardingStep>
  );
}
