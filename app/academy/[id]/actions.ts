'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId';
import { logImpersonationAction } from '@/lib/impersonation';
import { redirect } from 'next/navigation';

export async function enrollAndStart(courseId: string) {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=/academy/${courseId}`);
  }

  const effectiveUserId = await getEffectiveUserId();
  const effectiveClient = await getEffectiveClient();

  // Insert progress row — ignore if already exists (ON CONFLICT DO NOTHING)
  await effectiveClient
    .from('user_course_progress')
    .upsert(
      { user_id: effectiveUserId, course_id: courseId, status: 'in_progress' },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    );

  await logImpersonationAction('lesson_completed', { lessonId: courseId });

  redirect(`/academy/${courseId}/lesson`);
}
