// app/admin/media/actions.ts
// Server-only. Uses service role for admin-level media queries.
// Do NOT import from client components.

'use server';

import { getSupabaseService } from '@/lib/supabase/service'
import type { Database } from '@/types/supabase'

export const MEDIA_BUCKETS = [
  { key: 'avatars',              label: 'Avatars' },
  { key: 'event-images',         label: 'Events' },
  { key: 'school-logos',         label: 'Courses' },
  { key: 'upgrade-certificates', label: 'Certificates' },
  { key: 'uploads',              label: 'Uploads' },
] as const;

export type BucketKey = typeof MEDIA_BUCKETS[number]['key'];

export type MediaFolder = Database['public']['Tables']['media_folders']['Row'];

// ── MediaItem type ────────────────────────────────────────────────────────────

/**
 * MediaItem represents a row from media_items joined with the uploader's profile.
 * Used by Plans 02-02 and 02-03.
 */
export type MediaItem = {
  id: string;
  bucket: string;
  folder: string | null;
  file_name: string;
  file_path: string;
  file_url: string;
  file_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  title: string | null;
  alt_text: string | null;
  caption: string | null;
  uploaded_by: string | null;
  uploaded_by_role: string | null;
  created_at: string;
  updated_at: string;
  // joined from profiles:
  uploader_name?: string | null;
};

// ── getMediaItems params ──────────────────────────────────────────────────────

export interface GetMediaItemsParams {
  folder?: string | null;
  q?: string;
  type?: 'all' | 'images' | 'pdfs' | 'videos';
  date?: 'all' | 'today' | 'week' | 'month';
  by?: 'all' | 'team' | 'members';
  sort?: 'newest' | 'oldest' | 'name' | 'size';
  cursor?: string | null;
  limit?: number;
}

/**
 * Fetches paginated media items with optional filters/search/sort.
 * Uses service role to bypass RLS — admin page only.
 *
 * Returns { items, nextCursor } for cursor-based infinite scroll.
 * cursor is the created_at value of the last item returned when there are more.
 */
export async function getMediaItems(
  params: GetMediaItemsParams = {}
): Promise<{ items: MediaItem[]; nextCursor: string | null }> {
  const {
    folder,
    q,
    type = 'all',
    date = 'all',
    by = 'all',
    sort = 'newest',
    cursor,
    limit = 50,
  } = params;

  const supabase = getSupabaseService();

  // Base query with left join to profiles for uploader name
  let query = supabase
    .from('media_items')
    .select('*, profiles!media_items_uploaded_by_fkey(full_name)');

  // ── Folder filter ──────────────────────────────────────────────────────────
  if (folder) {
    const isBucket = MEDIA_BUCKETS.some(b => b.key === folder);
    if (isBucket) {
      query = query.eq('bucket', folder);
    } else {
      // UUID — filter by folder column
      query = query.eq('folder', folder);
    }
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

  // ── Uploader filter ────────────────────────────────────────────────────────
  if (by === 'team') {
    query = query.in('uploaded_by_role', ['admin', 'moderator']);
  } else if (by === 'members') {
    query = query.not('uploaded_by_role', 'in', '("admin","moderator")');
  }

  // ── Cursor pagination ──────────────────────────────────────────────────────
  if (cursor) {
    if (sort === 'newest') {
      query = query.lt('created_at', cursor);
    } else if (sort === 'oldest') {
      query = query.gt('created_at', cursor);
    }
    // For name/size sorts cursor is handled client-side (not supported here)
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
    console.error('[getMediaItems] Error fetching media items:', error.message);
    return { items: [], nextCursor: null };
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;

  // Map joined profiles data into flat uploader_name field
  const items: MediaItem[] = pageRows.map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = row as any;
    return {
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
      uploader_name: r.profiles?.full_name ?? null,
    };
  });

  // Cursor = last item's created_at (only useful for time-based sorts)
  const nextCursor =
    hasMore && (sort === 'newest' || sort === 'oldest')
      ? pageRows[pageRows.length - 1].created_at
      : null;

  return { items, nextCursor };
}

/**
 * Returns all media_folders ordered by sort_order asc, name asc.
 * Uses service role to bypass RLS — admin page only.
 */
export async function getFolders(): Promise<MediaFolder[]> {
  const supabase = getSupabaseService();
  const { data, error } = await supabase
    .from('media_folders')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('[getFolders] Error fetching media folders:', error.message);
    return [];
  }

  return data ?? [];
}
