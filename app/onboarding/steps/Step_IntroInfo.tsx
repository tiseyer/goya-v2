'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';

const CONTENT: Record<string, string> = {
  student:
    'You have selected the Student Practitioner designation. If you attain Teacher status, you will have the opportunity to upgrade your designation later.',
  teacher:
    "You've selected the Certified Teacher designation. You're registering as a qualified teacher of Yoga, Meditation or Ayurveda. Once your registration is verified, you'll have the option to register a School, add other Teaching Designations, and upgrade to Experienced Teacher status.",
  wellness_practitioner:
    'You have selected the Wellness Practitioner designation. If you also have yoga or meditation teaching qualifications, you can add these designations after your initial registration as a Wellness Practitioner.',
};

export default function Step_IntroInfo() {
  const { answers } = useOnboarding();
  const mt = answers.member_type ?? 'student';
  const content = CONTENT[mt] ?? '';

  return (
    <OnboardingStep title="Your Designation">
      <p className="text-sm text-slate-600 leading-relaxed">{content}</p>
    </OnboardingStep>
  );
}
