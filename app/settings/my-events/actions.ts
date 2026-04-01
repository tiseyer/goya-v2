'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import { writeEventAuditLog } from '@/lib/events/audit';

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

export interface MemberEventFormData {
  title: string;
  category: string;
  format: string;
  date: string;
  end_date?: string | null;
  all_day?: boolean;
  time_start: string | null;
  time_end: string | null;
  instructor?: string;
  location?: string;
  description?: string;
  price?: number;
  is_free?: boolean;
  registration_required?: boolean;
  spots_total?: number | null;
  spots_remaining?: number | null;
  website_url?: string | null;
  featured_image_url?: string | null;
  organizer_ids?: string[];
  status: 'draft' | 'pending_review';
}

export async function createMemberEvent(formData: MemberEventFormData) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data, error } = await service.from('events').insert({
    title: formData.title,
    category: formData.category,
    format: formData.format,
    date: formData.date,
    time_start: formData.time_start,
    time_end: formData.time_end,
    instructor: formData.instructor || null,
    location: formData.location || null,
    description: formData.description || null,
    price: formData.is_free ? 0 : (formData.price ?? 0),
    is_free: formData.is_free ?? false,
    spots_total: formData.spots_total ?? null,
    spots_remaining: formData.spots_remaining ?? null,
    featured_image_url: formData.featured_image_url ?? null,
    organizer_ids: formData.organizer_ids ?? [user.id],
    status: formData.status,
    event_type: 'member',
    created_by: user.id,
  }).select('id').single();

  if (error) return { success: false, error: error.message };

  await writeEventAuditLog({
    event_id: data.id,
    action: 'created',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { title: formData.title, status: formData.status },
  });

  revalidatePath('/settings/my-events');
  return { success: true, eventId: data.id };
}

export async function updateMemberEvent(eventId: string, formData: MemberEventFormData) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  // Verify ownership and editable status
  const { data: existing, error: fetchErr } = await service
    .from('events')
    .select('created_by, status')
    .eq('id', eventId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Event not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };
  if (!['draft', 'rejected'].includes(existing.status)) {
    return { success: false, error: 'Event cannot be edited in its current status' };
  }

  const updatePayload: Record<string, unknown> = {
    title: formData.title,
    category: formData.category,
    format: formData.format,
    date: formData.date,
    time_start: formData.time_start,
    time_end: formData.time_end,
    instructor: formData.instructor || null,
    location: formData.location || null,
    description: formData.description || null,
    price: formData.is_free ? 0 : (formData.price ?? 0),
    is_free: formData.is_free ?? false,
    spots_total: formData.spots_total ?? null,
    spots_remaining: formData.spots_remaining ?? null,
    featured_image_url: formData.featured_image_url ?? null,
    organizer_ids: formData.organizer_ids ?? [user.id],
    status: formData.status,
  };

  // If resubmitting a rejected event, clear the rejection reason
  if (existing.status === 'rejected' && formData.status === 'pending_review') {
    updatePayload.rejection_reason = null;
  }

  const { error } = await service
    .from('events')
    .update(updatePayload)
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };

  await writeEventAuditLog({
    event_id: eventId,
    action: 'edited',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: existing.status, new_status: formData.status, title: formData.title },
  });

  revalidatePath('/settings/my-events');
  return { success: true };
}

export async function submitEventForReview(eventId: string) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data: existing, error: fetchErr } = await service
    .from('events')
    .select('created_by, status')
    .eq('id', eventId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Event not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };
  if (existing.status !== 'draft') {
    return { success: false, error: 'Only draft events can be submitted for review' };
  }

  const { error } = await service
    .from('events')
    .update({ status: 'pending_review' })
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };

  await writeEventAuditLog({
    event_id: eventId,
    action: 'status_changed',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: 'draft', new_status: 'pending_review' },
  });

  revalidatePath('/settings/my-events');
  return { success: true };
}

export async function deleteMemberEvent(eventId: string) {
  const { user, profile } = await getAuthenticatedUser();
  const service = getSupabaseService() as any;

  const { data: existing, error: fetchErr } = await service
    .from('events')
    .select('created_by, status')
    .eq('id', eventId)
    .single();

  if (fetchErr || !existing) return { success: false, error: 'Event not found' };
  if (existing.created_by !== user.id) return { success: false, error: 'Not authorized' };

  const { error } = await service
    .from('events')
    .update({ status: 'deleted', deleted_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };

  await writeEventAuditLog({
    event_id: eventId,
    action: 'deleted',
    performed_by: user.id,
    performed_by_role: profile.role,
    changes: { previous_status: existing.status },
  });

  revalidatePath('/settings/my-events');
  return { success: true };
}
