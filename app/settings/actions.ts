'use server';

import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';
import { logAuditEvent } from '@/lib/audit';
import { createSupabaseServerActionClient } from '@/lib/supabaseServer';

export async function updateProfile(updates: Record<string, unknown>) {
  const effectiveUserId = await getEffectiveUserId();
  const effectiveClient = await getEffectiveClient();

  const { error } = await effectiveClient
    .from('profiles')
    .update(updates)
    .eq('id', effectiveUserId);

  if (error) return { error: error.message };

  await logImpersonationAction('profile_updated', { fields_changed: Object.keys(updates) });

  // Fetch actor info for audit
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await effectiveClient
    .from('profiles')
    .select('full_name, role')
    .eq('id', effectiveUserId)
    .single();

  void logAuditEvent({
    category: 'user',
    action: 'user.profile_updated',
    actor_id: user?.id ?? effectiveUserId,
    actor_name: profile?.full_name ?? undefined,
    actor_role: profile?.role ?? undefined,
    target_type: 'USER',
    target_id: effectiveUserId,
    target_label: profile?.full_name ?? undefined,
    description: `Profile updated (fields: ${Object.keys(updates).join(', ')})`,
    metadata: { fields_changed: Object.keys(updates) },
  });

  return { error: null };
}
