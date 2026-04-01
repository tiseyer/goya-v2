import { getSupabaseService } from '@/lib/supabase/service';
import { paginationToRange } from '@/lib/api/pagination';
import type { PaginationParams } from '@/lib/api/types';
import type { VerificationStatus } from '@/lib/types';

const VERIFICATION_SELECT_FIELDS =
  'id, full_name, email, member_type, verification_status, is_verified, certificate_url, certificate_is_official, created_at, updated_at';

export const VERIFICATIONS_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'full_name',
  'email',
  'verification_status',
];

export interface ListVerificationsParams {
  pagination: PaginationParams;
  verification_status?: VerificationStatus;
  member_type?: string;
}

/**
 * List user verification records from the profiles table with optional filters and pagination.
 * Per VERF-01.
 */
export async function listVerifications(params: ListVerificationsParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const { pagination, verification_status, member_type } = params;

  let query = supabase
    .from('profiles')
    .select(VERIFICATION_SELECT_FIELDS, { count: 'exact' });

  if (verification_status) {
    query = query.eq('verification_status', verification_status);
  }
  if (member_type) {
    query = query.eq('member_type', member_type);
  }

  query = query.order(pagination.sort, { ascending: pagination.order === 'asc' });

  const [from, to] = paginationToRange(pagination);
  query = query.range(from, to);

  const { data, count, error } = await query;
  return { data, count, error };
}

/**
 * Fetch a single user's verification data by profile ID.
 * Per VERF-02.
 */
export async function getVerificationById(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('profiles')
    .select(VERIFICATION_SELECT_FIELDS)
    .eq('id', id)
    .single();

  return { data, error };
}

export interface CreateVerificationParams {
  user_id: string;
  certificate_url?: string | null;
  certificate_is_official?: boolean;
}

/**
 * Initiate a verification for a user by setting verification_status to 'pending'.
 * Per VERF-03.
 * Updates an existing profile record — if no row is found, the user_id does not exist.
 */
export async function createVerification(params: CreateVerificationParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const payload: Record<string, unknown> = {
    verification_status: 'pending',
    ...(params.certificate_url !== undefined && { certificate_url: params.certificate_url }),
    ...(params.certificate_is_official !== undefined && {
      certificate_is_official: params.certificate_is_official,
    }),
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', params.user_id)
    .select(VERIFICATION_SELECT_FIELDS)
    .single();

  return { data, error };
}

export const ALLOWED_VERIFICATION_UPDATE_FIELDS = [
  'verification_status',
  'certificate_url',
  'certificate_is_official',
];

export interface UpdateVerificationParams {
  verification_status?: VerificationStatus;
  certificate_url?: string | null;
  certificate_is_official?: boolean;
}

/**
 * Update verification fields on a profile, auto-syncing is_verified with verification_status.
 * Per VERF-04.
 */
export async function updateVerification(id: string, updates: UpdateVerificationParams) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const payload: Record<string, unknown> = { ...updates };

  // Auto-sync is_verified when verification_status changes
  if (updates.verification_status === 'verified') {
    payload.is_verified = true;
  } else if (
    updates.verification_status === 'rejected' ||
    updates.verification_status === 'unverified'
  ) {
    payload.is_verified = false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', id)
    .select(VERIFICATION_SELECT_FIELDS)
    .single();

  return { data, error };
}

/**
 * Reset all verification fields on a profile to unverified state.
 * Per VERF-05.
 */
export async function deleteVerification(id: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      verification_status: 'unverified',
      is_verified: false,
      certificate_url: null,
      certificate_is_official: null,
    })
    .eq('id', id)
    .select(VERIFICATION_SELECT_FIELDS)
    .single();

  return { data, error };
}
