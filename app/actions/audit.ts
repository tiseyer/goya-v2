'use server'

import { logAuditEvent, type AuditEventParams } from '@/lib/audit';

/**
 * Server action wrapper so client components can fire audit events.
 * Fire-and-forget — never throws.
 */
export async function logAuditEventAction(params: AuditEventParams): Promise<void> {
  await logAuditEvent(params);
}
