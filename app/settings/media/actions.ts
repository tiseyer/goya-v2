// app/settings/media/actions.ts
// Member-scoped media queries. Uses user Supabase client to respect RLS.
// All queries are filtered to uploaded_by = currentUserId.

'use server';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { MediaItem } from '@/app/admin/media/actions';

export type { MediaItem };

// ── getMemberMediaItems params ────────────────────────────────────────────────

export interface GetMemberMediaItemsParams {
  currentUserId: string;
  folder?: string | null;
  q?: string;
  type?: 'all' | 'images' | 'pdfs' | 'videos';
  date?: 'all' | 'today' | 'week' | 'month';
  sort?: 'newest' | 'oldest' | 'name' | 'size';
  cursor?: string | null;
  limit?: number;
}

/**
 * Fetches paginated media items belonging to the current user.
 * Uses user-scoped Supabase client so RLS enforces uploaded_by = auth.uid().
 * The currentUserId filter is applied redundantly for safety.
 *
 * Returns { items, nextCursor } for cursor-based infinite scroll.
 */
export async function getMemberMediaItems(
  params: GetMemberMediaItemsParams
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  const {
    currentUserId,
    folder,
    q,
    type = 'all',
    date = 'all',
    sort = 'newest',
    cursor,
    limit = 50,
  } = params;

  const supabase = await createSupabaseServerClient();

  // Base query filtered to the current user's files
  let query = supabase
    .from('media_items')
    .select('*')
    .eq('uploaded_by', currentUserId);

  // ── Folder / bucket filter ─────────────────────────────────────────────────
  if (folder) {
    // Member sidebar uses bucket keys (avatars, upgrade-certificates, uploads)
    query = query.eq('bucket', folder);
  }

  // ── Search ─────────────────────────────────────────────────────────────────
  if (q && q.trim()) {
    const escaped = q.trim();
    query = query.or(`file_name.ilike.%${escaped}%,title.ilike.%${escaped}%`);
  }

  // ── File type filter ───────────────────────────────────────────────────────
  if (type === 'images') {
    query = query.like('file_type', 'image/%');
  } else if (type === 'pdfs') {
    query = query.eq('file_type', 'application/pdf');
  } else if (type === 'videos') {
    query = query.like('file_type', 'video/%');
  }

  // ── Date filter ────────────────────────────────────────────────────────────
  if (date !== 'all') {
    const now = new Date();
    const todayMidnightUTC = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    if (date === 'today') {
      query = query.gte('created_at', todayMidnightUTC.toISOString());
    } else if (date === 'week') {
      const weekAgo = new Date(todayMidnightUTC);
      weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
      query = query.gte('created_at', weekAgo.toISOString());
    } else if (date === 'month') {
      const monthAgo = new Date(todayMidnightUTC);
      monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
      query = query.gte('created_at', monthAgo.toISOString());
    }
  }

  // ── Cursor pagination ──────────────────────────────────────────────────────
  if (cursor) {
    if (sort === 'newest') {
      query = query.lt('created_at', cursor);
    } else if (sort === 'oldest') {
      query = query.gt('created_at', cursor);
    }
  }

  // ── Sort ───────────────────────────────────────────────────────────────────
  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else if (sort === 'name') {
    query = query.order('file_name', { ascending: true });
  } else if (sort === 'size') {
    query = query.order('file_size', { ascending: false });
  }

  // ── Limit (fetch one extra to detect next page) ────────────────────────────
  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    console.error('[getMemberMediaItems] Error fetching media items:', error.message);
    return { items: [], nextCursor: null };
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  const items: MediaItem[] = pageRows.map((r) => ({
    id: r.id,
    bucket: r.bucket,
    folder: r.folder,
    file_name: r.file_name,
    file_path: r.file_path,
    file_url: r.file_url,
    file_type: r.file_type,
    file_size: r.file_size ?? 0,
    width: r.width,
    height: r.height,
    title: r.title,
    alt_text: r.alt_text,
    caption: r.caption,
    uploaded_by: r.uploaded_by,
    uploaded_by_role: r.uploaded_by_role,
    created_at: r.created_at,
    updated_at: r.updated_at,
    // Member view does not show uploader name — set to null
    uploader_name: null,
  }));

  const nextCursor =
    hasMore && (sort === 'newest' || sort === 'oldest')
      ? pageRows[pageRows.length - 1].created_at
      : null;

  return { items, nextCursor };
}
