import { getSupabaseService } from '@/lib/supabase/service';

type AuditCategory = 'admin' | 'user' | 'system';
type AuditSeverity = 'info' | 'warning' | 'error';

interface AuditEntry {
  category: AuditCategory;
  action: string;
  severity?: AuditSeverity;
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  target_type?: string;
  target_id?: string;
  target_label?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Write an entry to the audit_log table.
 * Uses the service role client (bypasses RLS).
 * Silently catches errors to never break calling code.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = getSupabaseService();
    await supabase.from('audit_log').insert({
      category: entry.category,
      action: entry.action,
      severity: entry.severity ?? 'info',
      actor_id: entry.actor_id ?? null,
      actor_name: entry.actor_name ?? null,
      actor_role: entry.actor_role ?? null,
      target_type: entry.target_type ?? null,
      target_id: entry.target_id ?? null,
      target_label: entry.target_label ?? null,
      description: entry.description ?? null,
      metadata: entry.metadata ?? {},
      ip_address: entry.ip_address ?? null,
    });
  } catch {
    // Never let audit logging break the calling flow
    console.error('[audit] Failed to write audit log entry');
  }
}
