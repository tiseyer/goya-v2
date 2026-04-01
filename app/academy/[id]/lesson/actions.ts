'use server';

import { getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';

export async function markLessonComplete(progressId: string, courseId: string) {
  const effectiveClient = await getEffectiveClient();
  const now = new Date().toISOString();

  const { data, error } = await effectiveClient
    .from('user_course_progress')
    .update({ status: 'completed', completed_at: now })
    .eq('id', progressId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  await logImpersonationAction('lesson_completed', { lessonId: courseId });

  return { data, error: null };
}
