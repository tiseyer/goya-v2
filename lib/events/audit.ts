import { getSupabaseService } from '@/lib/supabase/service';

export type EventAuditAction = 'created' | 'edited' | 'status_changed' | 'deleted';

interface WriteEventAuditLogParams {
  event_id: string;
  action: EventAuditAction;
  performed_by: string;
  performed_by_role: string;
  changes?: Record<string, unknown>;
}

/**
 * Write a row to the event_audit_log table.
 * Uses service role to bypass RLS (audit_log has admin-only SELECT).
 */
export async function writeEventAuditLog(params: WriteEventAuditLogParams) {
  const serviceClient = getSupabaseService();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('event_audit_log')
    .insert({
      event_id: params.event_id,
      action: params.action,
      performed_by: params.performed_by,
      performed_by_role: params.performed_by_role,
      changes: params.changes ?? null,
    });

  if (error) {
    console.error('[event_audit_log] write failed:', error.message);
  }
}
