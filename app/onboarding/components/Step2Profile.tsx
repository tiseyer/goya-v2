'use client';

import { useOnboarding } from './OnboardingProvider';
import OnboardingStep from './OnboardingStep';
import TextInput from './inputs/TextInput';
import TextareaInput from './inputs/TextareaInput';
import SelectInput from './inputs/SelectInput';
import CheckboxCards from './inputs/CheckboxCards';

const PRACTICE_LEVELS = [
  { value: 'beginner',     label: 'Beginner (< 1 year)' },
  { value: 'intermediate', label: 'Intermediate (1–5 years)' },
  { value: 'advanced',     label: 'Advanced (5+ years)' },
];

const YEARS_TEACHING = [
  { value: '0-1',  label: 'Less than 1 year' },
  { value: '1-3',  label: '1–3 years' },
  { value: '3-5',  label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+',  label: '10+ years' },
];

const YOGA_STYLES = [
  { value: 'hatha',      label: 'Hatha' },
  { value: 'vinyasa',    label: 'Vinyasa' },
  { value: 'ashtanga',   label: 'Ashtanga' },
  { value: 'yin',        label: 'Yin' },
  { value: 'restorative',label: 'Restorative' },
  { value: 'kundalini',  label: 'Kundalini' },
  { value: 'iyengar',    label: 'Iyengar' },
  { value: 'prenatal',   label: 'Prenatal' },
  { value: 'kids',       label: 'Kids Yoga' },
  { value: 'other',      label: 'Other' },
];

export default function Step2Profile() {
  const { answers, setAnswer } = useOnboarding();
  const isTeacher = answers.member_type === 'teacher' || answers.member_type === 'wellness_practitioner';

  return (
    <OnboardingStep
      stepNumber={2}
      title="Tell us about yourself"
      subtitle="This information will appear on your public profile."
      continueDisabled={!answers.full_name?.trim()}
    >
      <div className="space-y-5">
        <TextInput
          label="Full name"
          value={answers.full_name ?? ''}
          onChange={val => setAnswer('full_name', val)}
          placeholder="Your full name"
          required
        />

        <TextInput
          label="Location"
          value={answers.location ?? ''}
          onChange={val => setAnswer('location', val)}
          placeholder="City, Country"
          helpText="E.g. Bali, Indonesia"
        />

        <TextareaInput
          label="Bio"
          value={answers.bio ?? ''}
          onChange={val => setAnswer('bio', val)}
          placeholder={isTeacher
            ? 'Share your teaching philosophy, lineage, and what inspires your practice…'
            : 'Tell the community a little about yourself and your yoga journey…'}
          rows={4}
          maxLength={400}
        />

        {isTeacher ? (
          <>
            <SelectInput
              label="Years teaching"
              value={answers.years_teaching ?? ''}
              onChange={val => setAnswer('years_teaching', val)}
              options={YEARS_TEACHING}
              placeholder="Select range…"
            />
            <CheckboxCards
              label="Yoga styles you teach"
              options={YOGA_STYLES}
              value={answers.practice_styles ?? []}
              onChange={val => setAnswer('practice_styles', val)}
              maxSelect={5}
            />
          </>
        ) : (
          <>
            <SelectInput
              label="Practice level"
              value={answers.practice_level ?? ''}
              onChange={val => setAnswer('practice_level', val)}
              options={PRACTICE_LEVELS}
              placeholder="Select your level…"
            />
            <CheckboxCards
              label="Styles you enjoy"
              options={YOGA_STYLES}
              value={answers.practice_styles ?? []}
              onChange={val => setAnswer('practice_styles', val)}
              maxSelect={5}
            />
          </>
        )}
      </div>
    </OnboardingStep>
  );
}
