import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { EventCategory, EventFormat, EventStatus } from '@/lib/types';

export const EVENTS_SORT_FIELDS = ['created_at', 'updated_at', 'date', 'title', 'category', 'status'];

export interface ListEventsParams {
  pagination: PaginationParams;
  category?: EventCategory;
  status?: EventStatus;
  format?: EventFormat;
  date_from?: string;
  date_to?: string;
}

/**
 * List events with optional filters and pagination.
 * Per EVNT-01.
 */
export async function listEvents(params: ListEventsParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, category, status, format, date_from, date_to } = params;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .is('deleted_at', null);

  if (category) {
    query = query.eq('category', category);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (format) {
    query = query.eq('format', format);
  }
  if (date_from) {
    query = query.gte('date', date_from);
  }
  if (date_to) {
    query = query.lte('date', date_to);
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single event by ID. Excludes soft-deleted events.
 * Per EVNT-02.
 */
export async function getEventById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  return { data, error };
}

export interface CreateEventParams {
  title: string;
  category: EventCategory;
  format: EventFormat;
  description?: string | null;
  date: string;
  time_start: string;
  time_end: string;
  location?: string | null;
  instructor?: string | null;
  price?: number;
  is_free?: boolean;
  spots_total?: number | null;
  spots_remaining?: number | null;
  featured_image_url?: string | null;
  status?: EventStatus;
}

/**
 * Create a new event.
 * Per EVNT-03.
 */
export async function createEvent(params: CreateEventParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('events')
    .insert(params)
    .select()
    .single();

  return { data, error };
}

export interface UpdateEventParams {
  title?: string;
  category?: EventCategory;
  format?: EventFormat;
  description?: string | null;
  date?: string;
  time_start?: string;
  time_end?: string;
  location?: string | null;
  instructor?: string | null;
  price?: number;
  is_free?: boolean;
  spots_total?: number | null;
  spots_remaining?: number | null;
  featured_image_url?: string | null;
  status?: EventStatus;
}

export const ALLOWED_EVENT_UPDATE_FIELDS: (keyof UpdateEventParams)[] = [
  'title',
  'category',
  'format',
  'description',
  'date',
  'time_start',
  'time_end',
  'location',
  'instructor',
  'price',
  'is_free',
  'spots_total',
  'spots_remaining',
  'featured_image_url',
  'status',
];

/**
 * Update allowed fields on an event.
 * Per EVNT-04.
 */
export async function updateEvent(id: string, updates: UpdateEventParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Validate: only allowed fields
  const keys = Object.keys(updates) as (keyof UpdateEventParams)[];
  if (keys.length === 0) {
    return { data: null, error: new Error('No valid fields to update') };
  }
  for (const key of keys) {
    if (!ALLOWED_EVENT_UPDATE_FIELDS.includes(key)) {
      return { data: null, error: new Error(`Field '${key}' is not allowed`) };
    }
  }

  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  return { data, error };
}

/**
 * Soft-delete an event by setting deleted_at and status='deleted'.
 * Per EVNT-05.
 */
export async function deleteEvent(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  return { data, error };
}

/**
 * Register a user for an event.
 * Per EVNT-06.
 * - Returns ALREADY_REGISTERED if the user is already registered.
 * - Returns NO_SPOTS if the event has spots tracking and none remain.
 * - Decrements spots_remaining on successful registration when spots are tracked.
 */
export async function registerUser(eventId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Check event exists and is not deleted
  const { data: event } = await getEventById(eventId);
  if (!event) {
    return { data: null, error: 'EVENT_NOT_FOUND' as const };
  }

  // Check if already registered
  const { data: existing } = await supabase
    .from('event_registrations')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: 'ALREADY_REGISTERED' as const };
  }

  // Check spots availability (only when spots are tracked)
  if (event.spots_remaining !== null && event.spots_remaining <= 0) {
    return { data: null, error: 'NO_SPOTS' as const };
  }

  // Insert registration
  const { data: registration, error: insertError } = await supabase
    .from('event_registrations')
    .insert({ event_id: eventId, user_id: userId })
    .select()
    .single();

  if (insertError || !registration) {
    return { data: null, error: insertError ?? 'INSERT_FAILED' };
  }

  // Decrement spots_remaining if spots are tracked
  if (event.spots_remaining !== null) {
    await supabase
      .from('events')
      .update({ spots_remaining: event.spots_remaining - 1 })
      .eq('id', eventId);
  }

  return { data: registration, error: null };
}

/**
 * Unregister a user from an event.
 * Per EVNT-07.
 * - Returns NOT_FOUND if no registration exists.
 * - Increments spots_remaining when spots are tracked.
 */
export async function unregisterUser(eventId: string, userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Delete the registration
  const { data: deleted, error: deleteError } = await supabase
    .from('event_registrations')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (deleteError || !deleted) {
    return { data: null, error: 'NOT_FOUND' as const };
  }

  // Increment spots_remaining if event tracks spots
  const { data: event } = await getEventById(eventId);
  if (event && event.spots_remaining !== null) {
    await supabase
      .from('events')
      .update({ spots_remaining: event.spots_remaining + 1 })
      .eq('id', eventId);
  }

  return { data: deleted, error: null };
}
