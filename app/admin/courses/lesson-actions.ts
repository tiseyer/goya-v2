'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import type { Lesson, LessonFormData } from '@/lib/courses/lessons';
import { logAdminCourseAction } from '@/app/admin/courses/actions';

/**
 * Fetch all lessons for a course, ordered by sort_order ascending.
 */
export async function fetchLessons(
  courseId: string,
): Promise<{ data: Lesson[]; error: string | null }> {
  const supabase = await createSupabaseServerActionClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true });

  if (error) return { data: [], error: error.message };
  return { data: (data as Lesson[]) ?? [], error: null };
}

/**
 * Create a new lesson for a course.
 * sort_order is computed as MAX(sort_order) + 1024, or 1024 if no lessons exist yet.
 */
export async function createLesson(
  courseId: string,
  formData: LessonFormData,
): Promise<{ data: Lesson | null; error: string | null }> {
  const supabase = await createSupabaseServerActionClient();

  // Compute sort_order
  const { data: maxRow } = await supabase
    .from('lessons')
    .select('sort_order')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const newSortOrder = maxRow ? maxRow.sort_order + 1024 : 1024;

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      course_id: courseId,
      title: formData.title,
      type: formData.type,
      video_platform: formData.video_platform,
      video_url: formData.video_url,
      audio_url: formData.audio_url,
      featured_image_url: formData.featured_image_url,
      short_description: formData.short_description,
      description: formData.description,
      duration_minutes: formData.duration_minutes,
      sort_order: newSortOrder,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  await logAdminCourseAction(courseId, 'edited', { added_lesson: formData.title });

  return { data: data as Lesson, error: null };
}

/**
 * Update an existing lesson.
 */
export async function updateLesson(
  lessonId: string,
  courseId: string,
  formData: LessonFormData,
): Promise<{ data: Lesson | null; error: string | null }> {
  const supabase = await createSupabaseServerActionClient();

  const { data, error } = await supabase
    .from('lessons')
    .update({
      title: formData.title,
      type: formData.type,
      video_platform: formData.video_platform,
      video_url: formData.video_url,
      audio_url: formData.audio_url,
      featured_image_url: formData.featured_image_url,
      short_description: formData.short_description,
      description: formData.description,
      duration_minutes: formData.duration_minutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };

  await logAdminCourseAction(courseId, 'edited', { updated_lesson: formData.title });

  return { data: data as Lesson, error: null };
}

/**
 * Delete a lesson by id.
 */
export async function deleteLesson(
  lessonId: string,
  courseId: string,
  lessonTitle: string,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
  if (error) return { error: error.message };

  await logAdminCourseAction(courseId, 'edited', { deleted_lesson: lessonTitle });

  return { error: null };
}

/**
 * Update the sort_order of a single lesson (float midpoint drag reorder).
 */
export async function reorderLesson(
  lessonId: string,
  newSortOrder: number,
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServerActionClient();

  const { error } = await supabase
    .from('lessons')
    .update({
      sort_order: newSortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lessonId);

  if (error) return { error: error.message };
  return { error: null };
}
