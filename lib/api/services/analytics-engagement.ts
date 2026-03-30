import { getSupabaseService } from '@/lib/supabase/service';

export interface EngagementStatsParams {
  date_from?: string;
  date_to?: string;
}

export interface EngagementStats {
  events: {
    total_events: number;
    total_registrations: number;
    avg_registrations_per_event: number;
  };
  courses: {
    total_courses: number;
    total_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
  };
}

/**
 * Get engagement statistics for events and courses.
 * Per ANLY-04.
 */
export async function getEngagementStats(params?: EngagementStatsParams): Promise<{ data: EngagementStats | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const date_from = params?.date_from;
  const date_to = params?.date_to;

  // Build events query
  let eventsQuery = supabase
    .from('events')
    .select('id, status, start_date, max_spots, deleted_at, created_at')
    .is('deleted_at', null);
  if (date_from) eventsQuery = eventsQuery.gte('start_date', date_from);
  if (date_to) eventsQuery = eventsQuery.lte('start_date', date_to);

  // Build event_registrations query
  const registrationsQuery = supabase
    .from('event_registrations')
    .select('id, event_id, status, created_at');

  // Build courses query
  let coursesQuery = supabase
    .from('courses')
    .select('id, status, deleted_at, created_at')
    .is('deleted_at', null);
  if (date_from) coursesQuery = coursesQuery.gte('created_at', date_from);
  if (date_to) coursesQuery = coursesQuery.lte('created_at', date_to);

  // Build course_enrollments query
  const enrollmentsQuery = supabase
    .from('course_enrollments')
    .select('id, course_id, user_id, status, completed_at, created_at');

  // Run all queries in parallel
  const [eventsResult, registrationsResult, coursesResult, enrollmentsResult] = await Promise.all([
    eventsQuery,
    registrationsQuery,
    coursesQuery,
    enrollmentsQuery,
  ]);

  if (eventsResult.error) return { data: null, error: eventsResult.error };
  if (registrationsResult.error) return { data: null, error: registrationsResult.error };
  if (coursesResult.error) return { data: null, error: coursesResult.error };
  if (enrollmentsResult.error) return { data: null, error: enrollmentsResult.error };

  const events = eventsResult.data ?? [];
  const registrations = registrationsResult.data ?? [];
  const courses = coursesResult.data ?? [];
  const enrollments = enrollmentsResult.data ?? [];

  // Build sets of valid IDs (filtered events/courses)
  const eventIdSet = new Set<string>(events.map((e: { id: string }) => e.id));
  const courseIdSet = new Set<string>(courses.map((c: { id: string }) => c.id));

  // Filter registrations/enrollments to only those for valid events/courses
  const filteredRegistrations = registrations.filter((r: { event_id: string }) => eventIdSet.has(r.event_id));
  const filteredEnrollments = enrollments.filter((e: { course_id: string }) => courseIdSet.has(e.course_id));

  const total_events = events.length;
  const total_registrations = filteredRegistrations.length;
  const avg_registrations_per_event = total_events > 0 ? total_registrations / total_events : 0;

  const total_courses = courses.length;
  const total_enrollments = filteredEnrollments.length;
  const completed_enrollments = filteredEnrollments.filter(
    (e: { status: string }) => e.status === 'completed'
  ).length;
  const completion_rate = total_enrollments > 0 ? completed_enrollments / total_enrollments : 0;

  return {
    data: {
      events: {
        total_events,
        total_registrations,
        avg_registrations_per_event,
      },
      courses: {
        total_courses,
        total_enrollments,
        completed_enrollments,
        completion_rate,
      },
    },
    error: null,
  };
}

export interface CreditStatsParams {
  date_from?: string;
  date_to?: string;
}

export interface CreditStats {
  total_submissions: number;
  by_status: {
    pending: number;
    approved: number;
    rejected: number;
  };
  by_type: Record<string, { count: number; total_hours: number }>;
  total_approved_hours: number;
}

/**
 * Get credit submission statistics by status and type.
 * Per ANLY-05.
 */
export async function getCreditStats(params?: CreditStatsParams): Promise<{ data: CreditStats | null; error: Error | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;
  const date_from = params?.date_from;
  const date_to = params?.date_to;

  let query = supabase
    .from('credit_entries')
    .select('id, credit_type, amount, status, activity_date, created_at');

  if (date_from) query = query.gte('activity_date', date_from);
  if (date_to) query = query.lte('activity_date', date_to);

  const { data, error } = await query;

  if (error) return { data: null, error };

  const rows = data ?? [];

  const total_submissions = rows.length;
  const by_status = { pending: 0, approved: 0, rejected: 0 };
  const by_type: Record<string, { count: number; total_hours: number }> = {};
  let total_approved_hours = 0;

  for (const row of rows) {
    const status = row.status as string;
    if (status === 'pending') by_status.pending += 1;
    else if (status === 'approved') by_status.approved += 1;
    else if (status === 'rejected') by_status.rejected += 1;

    const credit_type = row.credit_type as string;
    if (!by_type[credit_type]) {
      by_type[credit_type] = { count: 0, total_hours: 0 };
    }
    by_type[credit_type].count += 1;
    by_type[credit_type].total_hours += Number(row.amount);

    if (status === 'approved') {
      total_approved_hours += Number(row.amount);
    }
  }

  return {
    data: {
      total_submissions,
      by_status,
      by_type,
      total_approved_hours,
    },
    error: null,
  };
}
