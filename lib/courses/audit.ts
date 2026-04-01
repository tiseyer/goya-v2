import { getSupabaseService } from '@/lib/supabase/service';

export type CourseAuditAction = 'created' | 'edited' | 'status_changed' | 'deleted';

interface WriteCourseAuditLogParams {
  course_id: string;
  action: CourseAuditAction;
  performed_by: string;
  performed_by_role: string;
  changes?: Record<string, unknown>;
}

/**
 * Write a row to the course_audit_log table.
 * Uses service role to bypass RLS (audit_log has admin-only SELECT).
 */
export async function writeCourseAuditLog(params: WriteCourseAuditLogParams) {
  const serviceClient = getSupabaseService();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any)
    .from('course_audit_log')
    .insert({
      course_id: params.course_id,
      action: params.action,
      performed_by: params.performed_by,
      performed_by_role: params.performed_by_role,
      changes: params.changes ?? null,
    });

  if (error) {
    console.error('[course_audit_log] write failed:', error.message);
  }
}
