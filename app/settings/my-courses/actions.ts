'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import { writeCourseAuditLog } from '@/lib/courses/audit';

const ALLOWED_ROLES = ['teacher', 'wellness_practitioner', 'admin'];

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const service = getSupabaseService() as any;
  const { data: profile, error } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) throw new Error('Profile not found');
  if (!ALLOWED_ROLES.includes(profile.role)) throw new Error('Unauthorized role');

  return { user, profile };
}

export interface MemberCourseFormData {
  title: string;
  category: string;
  level: string | null;
  access: string;
  instructor?: string;
  duration?: string;
  short_description?: string;
  description?: string;
  vimeo_url?: string;
  thumbnail_url?: string;
  gradient_from?: string;
  gradient_to?: string;
  status: 'draft' | 'pending_review';
}

export async function createMemberCourse(formData: MemberCourseFormData) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data, error } = await service.from('courses').insert({
    title: formData.title,
    category: formData.category,
    level: formData.level || null,
    access: formData.access,
    instructor: formData.instructor || null,
    duration: formData.duration || null,
    short_description: formData.short_description || null,
    description: formData.description || null,
    vimeo_url: formData.vimeo_url || null,
    thumbnail_url: formData.thumbnail_url || null,
    gradient_from: formData.gradient_from || '#0f766e',
    gradient_to: formData.gradient_to || '#134e4a',
    status: formData.status,
    course_type: 'member',
    created_by: user.id,
  }).select('id').single();

  if (error) return { success: false, error: error.message };

  await writeCourseAuditLog({
    course_id: data.id,
    action: 'created',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { title: formData.title, status: formData.status },
  });

  revalidatePath('/settings/my-courses');
  return { success: true, courseId: data.id };
}

export async function updateMemberCourse(courseId: string, formData: MemberCourseFormData) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  // Verify ownership and editable status
  const { data: existing, error: fetchErr } = await service
    .from('courses')
    .select('created_by, status')
    .eq('id', courseId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Course not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };
  if (!['draft', 'rejected'].includes(existing.status)) {
    return { success: false, error: 'Course cannot be edited in its current status' };
  }

  const updatePayload: Record<string, unknown> = {
    title: formData.title,
    category: formData.category,
    level: formData.level || null,
    access: formData.access,
    instructor: formData.instructor || null,
    duration: formData.duration || null,
    short_description: formData.short_description || null,
    description: formData.description || null,
    vimeo_url: formData.vimeo_url || null,
    thumbnail_url: formData.thumbnail_url || null,
    gradient_from: formData.gradient_from || '#0f766e',
    gradient_to: formData.gradient_to || '#134e4a',
    status: formData.status,
  };

  // If resubmitting a rejected course, clear the rejection reason
  if (existing.status === 'rejected' && formData.status === 'pending_review') {
    updatePayload.rejection_reason = null;
  }

  const { error } = await service
    .from('courses')
    .update(updatePayload)
    .eq('id', courseId);

  if (error) return { success: false, error: error.message };

  await writeCourseAuditLog({
    course_id: courseId,
    action: 'edited',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: existing.status, new_status: formData.status, title: formData.title },
  });

  revalidatePath('/settings/my-courses');
  return { success: true };
}

export async function submitCourseForReview(courseId: string) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data: existing, error: fetchErr } = await service
    .from('courses')
    .select('created_by, status')
    .eq('id', courseId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Course not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };
  if (existing.status !== 'draft') {
    return { success: false, error: 'Only draft courses can be submitted for review' };
  }

  const { error } = await service
    .from('courses')
    .update({ status: 'pending_review' })
    .eq('id', courseId);

  if (error) return { success: false, error: error.message };

  await writeCourseAuditLog({
    course_id: courseId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: 'draft', new_status: 'pending_review' },
  });

  revalidatePath('/settings/my-courses');
  return { success: true };
}

export async function deleteMemberCourse(courseId: string) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data: existing, error: fetchErr } = await service
    .from('courses')
    .select('created_by, status')
    .eq('id', courseId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Course not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };

  const { error } = await service
    .from('courses')
    .update({ status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', courseId);

  if (error) return { success: false, error: error.message };

  await writeCourseAuditLog({
    course_id: courseId,
    action: 'deleted',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: existing.status },
  });

  revalidatePath('/settings/my-courses');
  return { success: true };
}
