import { getSupabaseService } from '@/lib/supabase/service';
import type { Json } from '@/types/supabase';

export type AuditCategory = 'admin' | 'user' | 'system';
export type AuditSeverity = 'info' | 'warning' | 'error';

export interface AuditEventParams {
  category: AuditCategory;
  severity?: AuditSeverity;
  action: string;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  target_type?: string;
  target_id?: string;
  target_label?: string;
  description: string;
  metadata?: Record<string, Json>;
  ip_address?: string;
}

/**
 * Write an entry to the audit_log table.
 * Uses the service role client (bypasses RLS).
 * Silently catches errors to never break calling code.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = getSupabaseService();
    await supabase.from('audit_log').insert({
      category: params.category,
      action: params.action,
      severity: params.severity ?? 'info',
      actor_id: params.actor_id ?? null,
      actor_name: params.actor_name ?? null,
      actor_role: params.actor_role ?? null,
      target_type: params.target_type ?? null,
      target_id: params.target_id ?? null,
      target_label: params.target_label ?? null,
      description: params.description,
      metadata: params.metadata ?? {},
      ip_address: params.ip_address ?? null,
    });
  } catch {
    // Never let audit logging break the calling flow
    console.error('[audit] Failed to write audit log entry');
  }
}

/** @deprecated Use logAuditEvent instead */
export const logAudit = logAuditEvent;
