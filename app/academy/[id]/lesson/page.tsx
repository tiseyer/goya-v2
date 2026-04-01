import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export default async function LegacyLessonRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch the first lesson by sort_order
  const { data: firstLesson } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', id)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstLesson) {
    redirect(`/academy/${id}/lesson/${firstLesson.id}`);
  }

  // No lessons — redirect back to course overview
  redirect(`/academy/${id}`);
}
