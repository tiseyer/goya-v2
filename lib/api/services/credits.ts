import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { CreditType } from '@/lib/credits';

export const CREDITS_SORT_FIELDS = ['created_at', 'updated_at', 'activity_date', 'amount', 'credit_type', 'status'];

export interface ListCreditsParams {
  pagination: PaginationParams;
  status?: 'pending' | 'approved' | 'rejected';
  user_id?: string;
  credit_type?: CreditType;
  date_from?: string;
  date_to?: string;
}

/**
 * List credit entries with optional filters and pagination.
 * Per CRED-01.
 */
export async function listCredits(params: ListCreditsParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, status, user_id, credit_type, date_from, date_to } = params;

  let query = supabase
    .from('credit_entries')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }
  if (user_id) {
    query = query.eq('user_id', user_id);
  }
  if (credit_type) {
    query = query.eq('credit_type', credit_type);
  }
  if (date_from) {
    query = query.gte('activity_date', date_from);
  }
  if (date_to) {
    query = query.lte('activity_date', date_to);
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single credit entry by ID.
 * Per CRED-02.
 */
export async function getCreditById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('credit_entries')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export interface CreateCreditParams {
  user_id: string;
  credit_type: CreditType;
  amount: number;
  activity_date: string;
  description?: string | null;
  source?: 'manual' | 'automatic';
  status?: 'pending' | 'approved' | 'rejected';
}

/**
 * Create a new credit entry.
 * Per CRED-03.
 */
export async function createCredit(params: CreateCreditParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('credit_entries')
    .insert(params)
    .select()
    .single();

  return { data, error };
}

export const ALLOWED_CREDIT_UPDATE_FIELDS: string[] = ['status', 'rejection_reason'];

export interface UpdateCreditParams {
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
}

/**
 * Update allowed fields on a credit entry.
 * Per CRED-04.
 */
export async function updateCredit(id: string, updates: UpdateCreditParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  // Validate: only allowed fields
  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return { data: null, error: new Error('No valid fields to update') };
  }
  for (const key of keys) {
    if (!ALLOWED_CREDIT_UPDATE_FIELDS.includes(key)) {
      return { data: null, error: new Error(`Field '${key}' is not allowed`) };
    }
  }

  const { data, error } = await supabase
    .from('credit_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Aggregate approved non-expired credits for a user grouped by type.
 * Per CRED-05.
 */
export async function getCreditSummary(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('credit_entries')
    .select('credit_type, amount')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gte('expires_at', today);

  if (error) {
    return { data: null, error };
  }

  const summary: Record<string, number> & { total: number } = {
    ce: 0,
    karma: 0,
    practice: 0,
    teaching: 0,
    community: 0,
    total: 0,
  };

  for (const row of data ?? []) {
    const type = row.credit_type as string;
    if (type in summary && type !== 'total') {
      summary[type] += Number(row.amount);
      summary.total += Number(row.amount);
    }
  }

  return { data: summary, error: null };
}
