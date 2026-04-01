'use server'

import { logAuditEvent, type AuditEventParams } from '@/lib/audit';
import { getSupabaseService } from '@/lib/supabase/service';

/**
 * Server action wrapper so client components can fire audit events.
 * Auto-populates actor_name and actor_role from the profiles table when
 * actor_id is provided but name/role are missing.
 * Fire-and-forget — never throws.
 */
export async function logAuditEventAction(params: AuditEventParams): Promise<void> {
  // Auto-populate actor_name and actor_role if actor_id is provided but name/role missing
  if (params.actor_id && (!params.actor_name || !params.actor_role)) {
    try {
      const supabase = getSupabaseService();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', params.actor_id)
        .single();
      if (profile) {
        if (!params.actor_name) params.actor_name = profile.full_name ?? undefined;
        if (!params.actor_role) params.actor_role = profile.role ?? undefined;
      }
    } catch {
      // Silent — don't break audit logging
    }
  }
  await logAuditEvent(params);
}
