'use client';

import { useOnboarding, type MemberType } from './OnboardingProvider';
import OnboardingStep from './OnboardingStep';
import RadioCards from './inputs/RadioCards';

const OPTIONS: Array<{ value: MemberType; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: 'student',
    label: 'Student / Practitioner',
    description: 'I practice yoga and want to deepen my journey.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    value: 'teacher',
    label: 'Yoga Teacher',
    description: 'I teach yoga and want to connect with the GOYA community.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'wellness_practitioner',
    label: 'Wellness Practitioner',
    description: 'I offer complementary wellness services alongside yoga.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
];

export default function Step1MemberType() {
  const { answers, saveAnswer, goToNext, isSaving } = useOnboarding();

  return (
    <OnboardingStep
      stepNumber={1}
      title="What brings you to GOYA?"
      subtitle="This helps us personalise your experience and connect you with the right people."
      continueDisabled={!answers.member_type}
    >
      <RadioCards
        options={OPTIONS}
        value={answers.member_type}
        onChange={val => saveAnswer('member_type', val)}
      />

      {answers.member_type && answers.member_type !== 'student' && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Verification required:</strong> Teacher and wellness practitioner accounts are reviewed by our team. You'll be able to use GOYA right away, and we'll notify you once verified.
          </p>
        </div>
      )}
    </OnboardingStep>
  );
}
