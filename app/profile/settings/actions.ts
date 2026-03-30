'use server';

import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';

export async function updateProfile(updates: Record<string, unknown>) {
  const effectiveUserId = await getEffectiveUserId();
  const effectiveClient = await getEffectiveClient();

  const { error } = await effectiveClient
    .from('profiles')
    .update(updates)
    .eq('id', effectiveUserId);

  if (error) return { error: error.message };

  await logImpersonationAction('profile_updated', { fields_changed: Object.keys(updates) });

  return { error: null };
}
