'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export async function enrollAndStart(courseId: string) {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/sign-in?next=/academy/${courseId}`);
  }

  // Insert progress row — ignore if already exists (ON CONFLICT DO NOTHING)
  await supabase
    .from('user_course_progress')
    .upsert(
      { user_id: user.id, course_id: courseId, status: 'in_progress' },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    );

  redirect(`/academy/${courseId}/lesson`);
}
