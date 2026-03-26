import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { UserRole, SubscriptionStatus } from '@/lib/types';

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
