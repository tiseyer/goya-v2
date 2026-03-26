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
