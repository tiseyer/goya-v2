import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { UserRole, SubscriptionStatus, MemberType } from '@/lib/types';

export const USERS_SORT_FIELDS = ['created_at', 'updated_at', 'full_name', 'email', 'role'];

export interface ListUsersParams {
  pagination: PaginationParams;
  role?: UserRole;
  subscription_status?: SubscriptionStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
}

/**
 * List users from the profiles table with optional filters and pagination.
 * Per USER-01.
 */
export async function listUsers(params: ListUsersParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, role, subscription_status, search, date_from, date_to } = params;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }
  if (subscription_status) {
    query = query.eq('subscription_status', subscription_status);
  }
  if (date_from) {
    query = query.gte('created_at', date_from);
  }
  if (date_to) {
    query = query.lte('created_at', date_to);
  }
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
    );
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single user profile by ID.
 * Per USER-02.
 */
export async function getUserById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export interface UpdateUserParams {
  role?: UserRole;
  subscription_status?: SubscriptionStatus;
  member_type?: MemberType | null;
}

const ALLOWED_UPDATE_FIELDS: (keyof UpdateUserParams)[] = ['role', 'subscription_status', 'member_type'];

/**
 * Update allowed fields on a user profile.
 * Per USER-03.
 */
export async function updateUser(id: string, updates: UpdateUserParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Validate: only allowed fields
  const keys = Object.keys(updates) as (keyof UpdateUserParams)[];
  if (keys.length === 0) {
    return { data: null, error: new Error('No valid fields to update') };
  }
  for (const key of keys) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key)) {
      return { data: null, error: new Error(`Field '${key}' is not allowed`) };
    }
  }

  const payload = { ...updates, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export const CREDITS_SORT_FIELDS = ['created_at', 'activity_date', 'amount', 'credit_type', 'status'];

/**
 * Fetch paginated credit entries for a user.
 * Per USER-04.
 */
export async function getUserCredits(userId: string, pagination: PaginationParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const [from, to] = paginationToRange(pagination);

  const { data, count, error } = await supabase
    .from('credit_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order(pagination.sort, { ascending: pagination.order === 'asc' })
    .range(from, to);

  return { data, count, error };
}

/**
 * Fetch user designations (purchased certifications) joined with product info.
 * Per USER-05.
 */
export async function getUserCertifications(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('user_designations')
    .select('*, products(name, full_name, category, slug)')
    .eq('user_id', userId)
    .is('deleted_at', null);

  return { data, error };
}

/**
 * Fetch verification data from a user's profile.
 * Per USER-06.
 */
export async function getUserVerifications(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, verification_status, is_verified, certificate_url, certificate_is_official')
    .eq('id', userId)
    .single();

  return { data, error };
}
