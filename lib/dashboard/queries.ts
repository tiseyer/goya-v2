import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── Return types ─────────────────────────────────────────────────────────────

export interface EventRow {
  id: string
  title: string
  date: string
  end_date: string | null
  location: string | null
  is_online: boolean | null
  format: string | null
  status: string
  slug: string | null
  categories: string[] | null
}

export interface CourseCategory {
  id: string
  name: string
  color: string | null
}

export interface CourseRow {
  id: string
  title: string
  description: string | null
  status: string
  duration_minutes: number | null
  category_id: string | null
  course_type: string | null
  image_url: string | null
  created_by: string | null
  course_categories: CourseCategory | null
}

export interface ConnectionProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
  username: string | null
}

export interface AcceptedConnection {
  connectionId: string
  profile: ConnectionProfile
}

export interface FacultyProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

export interface FacultyRow {
  id: string
  position: string | null
  is_principal_trainer: boolean | null
  profile: FacultyProfile | null
}

export interface InProgressCourseRow {
  id: string
  course_id: string
  status: string
  enrolled_at: string
  completed_at: string | null
  courses: {
    id: string
    title: string
    image_url: string | null
    duration_minutes: number | null
  } | null
}

// ─── Fetch functions ──────────────────────────────────────────────────────────

/**
 * Fetches upcoming published events ordered by date ascending.
 */
export async function fetchUpcomingEvents(
  supabase: SupabaseClient,
  limit = 8,
): Promise<EventRow[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('id, title, date, end_date, location, is_online, format, status, slug, categories')
    .eq('status', 'published')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit)
  return (data ?? []) as EventRow[]
}

/**
 * Fetches recently created published courses with their category.
 */
export async function fetchRecentCourses(
  supabase: SupabaseClient,
  limit = 8,
): Promise<CourseRow[]> {
  const { data } = await supabase
    .from('courses')
    .select(
      'id, title, description, status, duration_minutes, category_id, course_type, image_url, created_by, course_categories(id, name, color)',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as CourseRow[]
}

/**
 * Fetches accepted connections for a user and returns a flat array of the
 * "other" person's profile for each connection.
 */
export async function fetchAcceptedConnections(
  supabase: SupabaseClient,
  userId: string,
  limit = 12,
): Promise<AcceptedConnection[]> {
  const { data } = await supabase
    .from('connections')
    .select(`
      id, status, created_at,
      requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url, role, username),
      recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url, role, username)
    `)
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  const rows = (data ?? []) as unknown as Array<{
    id: string
    requester: ConnectionProfile
    recipient: ConnectionProfile
  }>

  return rows.map((row) => ({
    connectionId: row.id,
    profile: (row.requester?.id === userId ? row.recipient : row.requester) as ConnectionProfile,
  }))
}

/**
 * Fetches faculty members for a school with their profile details.
 */
export async function fetchSchoolFaculty(
  supabase: SupabaseClient,
  schoolId: string,
  limit = 8,
): Promise<FacultyRow[]> {
  const { data } = await supabase
    .from('school_faculty')
    .select('id, position, is_principal_trainer, profile:profile_id(id, full_name, avatar_url, role)')
    .eq('school_id', schoolId)
    .limit(limit)
  return (data ?? []) as unknown as FacultyRow[]
}

/**
 * Fetches courses the user is currently enrolled in and still in progress,
 * ordered by enrollment date descending.
 */
export async function fetchUserInProgressCourses(
  supabase: SupabaseClient,
  userId: string,
  limit = 4,
): Promise<InProgressCourseRow[]> {
  const { data } = await supabase
    .from('user_course_progress')
    .select(
      'id, course_id, status, enrolled_at, completed_at, courses(id, title, image_url, duration_minutes)',
    )
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('enrolled_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as InProgressCourseRow[]
}
