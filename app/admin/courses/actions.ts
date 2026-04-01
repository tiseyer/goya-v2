'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import { writeCourseAuditLog, type CourseAuditAction } from '@/lib/courses/audit';

/**
 * Write an audit log entry for admin course operations.
 * Called from client components after successful Supabase mutations.
 */
export async function logAdminCourseAction(
  courseId: string,
  action: CourseAuditAction,
  changes?: Record<string, unknown>,
) {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const serviceClient = getSupabaseService();
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) return;

  await writeCourseAuditLog({
    course_id: courseId,
    action,
    performed_by: user.id,
    performed_by_role: profile.role,
    changes,
  });
}
