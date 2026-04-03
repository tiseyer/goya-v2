'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';

interface MemberSearchResult {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

/**
 * Search members by name for the organizer picker.
 * - Admin/moderator: search all profiles
 * - Other roles: search only accepted connections + same-school members
 */
export async function searchMembers(
  query: string,
  options: {
    role?: string;
    userId?: string;
    excludeIds?: string[];
    limit?: number;
    roleFilter?: string[];
  } = {}
): Promise<MemberSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = await createSupabaseServerActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const service = getSupabaseService() as ReturnType<typeof getSupabaseService>;
  const searchTerm = `%${query.trim()}%`;
  const limit = options.limit ?? 10;
  const excludeIds = options.excludeIds ?? [];

  // Determine the caller's role if not provided
  let callerRole = options.role;
  if (!callerRole) {
    const { data: profile } = await (service as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    callerRole = profile?.role ?? 'student';
  }

  const isPrivileged = callerRole === 'admin' || callerRole === 'moderator';

  if (isPrivileged) {
    // Admin/moderator: search all profiles by name
    let q = (service as any)
      .from('profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', searchTerm)
      .neq('id', user.id)
      .limit(limit);

    // Filter by role if specified (e.g. instructor/organizer pickers exclude students)
    if (options.roleFilter && options.roleFilter.length > 0) {
      q = q.in('role', options.roleFilter);
    }

    // Exclude already-selected IDs
    if (excludeIds.length > 0) {
      for (const id of excludeIds) {
        q = q.neq('id', id);
      }
    }

    const { data, error } = await q;
    if (error) {
      console.error('searchMembers (admin) error:', error);
      return [];
    }
    return (data ?? []) as MemberSearchResult[];
  }

  // Non-privileged: search within accepted connections
  const { data: connectionRows, error: connErr } = await (service as any)
    .from('connections')
    .select('requester_id, recipient_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

  if (connErr) {
    console.error('searchMembers connections error:', connErr);
    return [];
  }

  // Extract connected user IDs
  const connectedIds = new Set<string>();
  for (const row of connectionRows ?? []) {
    const otherId = row.requester_id === user.id ? row.recipient_id : row.requester_id;
    if (!excludeIds.includes(otherId) && otherId !== user.id) {
      connectedIds.add(otherId);
    }
  }

  if (connectedIds.size === 0) return [];

  // Query profiles for connected users matching the search term
  const idsArray = Array.from(connectedIds);
  let connQ = (service as any)
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', idsArray)
    .ilike('full_name', searchTerm)
    .limit(limit);

  // Apply role filter if specified
  if (options.roleFilter && options.roleFilter.length > 0) {
    connQ = connQ.in('role', options.roleFilter);
  }

  const { data, error } = await connQ;

  if (error) {
    console.error('searchMembers (connections) error:', error);
    return [];
  }

  return (data ?? []) as MemberSearchResult[];
}

/**
 * Fetch profiles by IDs — used to hydrate organizer chips on form load.
 */
export async function getProfilesByIds(
  ids: string[]
): Promise<MemberSearchResult[]> {
  if (!ids.length) return [];

  const service = getSupabaseService() as ReturnType<typeof getSupabaseService>;
  const { data, error } = await (service as any)
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids);

  if (error) {
    console.error('getProfilesByIds error:', error);
    return [];
  }

  return (data ?? []) as MemberSearchResult[];
}
