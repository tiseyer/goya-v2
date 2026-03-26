'use server';

import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';
import { submitOnboarding } from './submitOnboarding';
import type { OnboardingAnswers } from './steps';

export async function submitOnboardingAction(
  answers: OnboardingAnswers,
  memberType: 'student' | 'teacher' | 'wellness_practitioner'
) {
  const effectiveUserId = await getEffectiveUserId();
  const effectiveClient = await getEffectiveClient();

  const error = await submitOnboarding(effectiveClient, effectiveUserId, answers, memberType);

  if (error) return { error: error.message };

  await logImpersonationAction('onboarding_step_saved', { step: 'submit', memberType });

  return { error: null };
}
