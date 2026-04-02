import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EventRow, CourseRow } from '@/lib/dashboard/queries'

/**
 * Fetches published upcoming events created by a specific member.
 * Mirrors fetchUpcomingEvents from lib/dashboard/queries.ts but adds created_by filter.
 */
export async function fetchMemberEvents(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
): Promise<EventRow[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('id, title, date, end_date, location, is_online, format, status, slug, categories')
    .eq('created_by', userId)
    .eq('status', 'published')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit)
  return (data ?? []) as EventRow[]
}

/**
 * Fetches published courses created by a specific member.
 * Mirrors fetchRecentCourses from lib/dashboard/queries.ts but adds created_by filter.
 */
export async function fetchMemberCourses(
  supabase: SupabaseClient,
  userId: string,
  limit = 8,
): Promise<CourseRow[]> {
  const { data } = await supabase
    .from('courses')
    .select(
      'id, title, description, status, duration_minutes, category_id, course_type, image_url, created_by, course_categories(id, name, color)',
    )
    .eq('created_by', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as CourseRow[]
}
