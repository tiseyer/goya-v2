'use server';

import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';

interface SubmitCreditPayload {
  creditType: string;
  amount: number;
  activityDate: string;
  description: string;
}

export async function submitCreditEntry(payload: SubmitCreditPayload) {
  const { creditType, amount, activityDate, description } = payload;

  const effectiveUserId = await getEffectiveUserId();
  const effectiveClient = await getEffectiveClient();

  const { error } = await effectiveClient
    .from('credit_entries')
    .insert({
      user_id: effectiveUserId,
      credit_type: creditType,
      amount,
      activity_date: activityDate,
      description,
      source: 'manual',
      status: 'pending',
    });

  if (error) return { error: error.message };

  await logImpersonationAction('credits_submitted', { type: creditType, amount, date: activityDate });

  return { error: null };
}
