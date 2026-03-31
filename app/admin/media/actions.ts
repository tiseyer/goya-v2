// app/admin/media/actions.ts
// Server-only. Uses service role for admin-level media queries.
// Do NOT import from client components.

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
