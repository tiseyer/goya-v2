import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getEffectiveUserId } from '@/lib/supabase/getEffectiveUserId';
import { getSupabaseService } from '@/lib/supabase/service';
import type { Course, UserCourseProgress } from '@/lib/types';
import type { Lesson } from '@/lib/courses/lessons';
import { enrollAndStart } from './actions';
import CourseEnrollCard from './CourseEnrollCard';
import CourseViewTracker from './CourseViewTracker';

export const dynamic = 'force-dynamic';

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-600 bg-emerald-50 border-emerald-200',
  Intermediate: 'text-amber-600 bg-amber-50 border-amber-200',
  Advanced:     'text-rose-600 bg-rose-50 border-rose-200',
  'All Levels': 'text-slate-600 bg-slate-100 border-slate-200',
};

const TYPE_ICONS: Record<string, string> = {
  video: '\uD83C\uDFAC',
  audio: '\uD83C\uDFB5',
  text:  '\uD83D\uDCDD',
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch course with category join
  const { data: courseData } = await supabase
    .from('courses')
    .select('*, course_categories(name, color)')
    .eq('id', id)
    .single();

  if (!courseData) notFound();
  const course = courseData as Course;

  const categoryName  = (courseData as any)?.course_categories?.name ?? null;
  const categoryColor = (courseData as any)?.course_categories?.color ?? null;

  // Fetch lessons ordered by sort_order
  const { data: lessonsData } = await supabase
    .from('lessons')
    .select('id, title, type, duration_minutes, sort_order')
    .eq('course_id', id)
    .order('sort_order', { ascending: true });
  const lessons = (lessonsData ?? []) as Pick<Lesson, 'id' | 'title' | 'type' | 'duration_minutes' | 'sort_order'>[];

  // Auth + progress — use effective user ID (impersonated or real)
  const { data: { user } } = await supabase.auth.getUser();
  let effectiveUserId: string | null = null;
  try { effectiveUserId = await getEffectiveUserId(); } catch { /* not authenticated */ }
  let progress: UserCourseProgress | null = null;
  if (effectiveUserId) {
    const svc = getSupabaseService();
    const { data } = await (svc as any)
      .from('user_course_progress')
      .select('*')
      .eq('user_id', effectiveUserId)
      .eq('course_id', id)
      .maybeSingle();
    progress = (data as UserCourseProgress | null) ?? null;
  }

  const isEnrolled = !!progress;

  // canManage check: organizer_ids OR admin/moderator role
  let canManage = false;
  if (user) {
    if (course.organizer_ids?.includes(user.id)) {
      canManage = true;
    } else {
      const { data: authProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (authProfile?.role === 'admin' || authProfile?.role === 'moderator') {
        canManage = true;
      }
    }
  }

  // Fetch organizer profiles
  let organizers: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  if (course.organizer_ids && course.organizer_ids.length > 0) {
    const { data: orgProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', course.organizer_ids);
    organizers = orgProfiles ?? [];
  }

  // Fetch instructor profiles from join table
  let instructors: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  const { data: instructorRows } = await supabase
    .from('course_instructors')
    .select('profile_id')
    .eq('course_id', id);
  if (instructorRows && instructorRows.length > 0) {
    const { data: instrProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', instructorRows.map(r => r.profile_id));
    instructors = instrProfiles ?? [];
  }

  // Fetch attendee count + first 20 profiles (if show_attendees)
  const { count: attendeeCount } = await supabase
    .from('course_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', id);
  let attendees: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  if (course.show_attendees) {
    const { data: attData } = await supabase
      .from('course_attendees')
      .select('profile_id')
      .eq('course_id', id)
      .order('created_at', { ascending: true })
      .limit(20);
    if (attData && attData.length > 0) {
      const { data: attProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, username')
        .in('id', attData.map(r => r.profile_id));
      attendees = attProfiles ?? [];
    }
  }

  // Bind server action to this course id
  const boundEnroll = enrollAndStart.bind(null, id);

  return (
    <div className="min-h-screen bg-slate-50">
      <CourseViewTracker courseId={id} courseName={course.title} />
      {/* Hero */}
      <div
        className="relative pt-24 pb-16 px-4 sm:px-6 lg:px-8"
        style={{ background: `linear-gradient(135deg, ${course.gradient_from}dd, ${course.gradient_to}dd)` }}
      >
        <div className="max-w-6xl mx-auto">
          <Link
            href="/academy"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-8 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academy
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {categoryName && (
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                style={{
                  color: categoryColor ?? '#64748B',
                  backgroundColor: categoryColor ? `${categoryColor}15` : '#f1f5f9',
                  borderColor: categoryColor ? `${categoryColor}40` : '#e2e8f0',
                }}
              >
                {categoryName}
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              course.access === 'free'
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-white bg-white/20 border-white/30'
            }`}>
              {course.access === 'free' ? 'Free' : 'Members Only'}
            </span>
            {course.level && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${LEVEL_COLORS[course.level] ?? 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                {course.level}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 max-w-3xl">{course.title}</h1>
          {course.short_description && (
            <p className="text-white/85 text-base max-w-2xl mb-5">{course.short_description}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-5 text-sm text-white/75">
            {course.instructor && instructors.length === 0 && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {course.instructor}
              </span>
            )}
            {formatDuration(course.duration_minutes) && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDuration(course.duration_minutes)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {lessons.length} Lesson{lessons.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* LEFT column */}
          <div className="space-y-6">

            {/* About this Course */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-4">About this Course</h2>
              <p className="text-[#374151] leading-relaxed">
                {course.description || course.short_description || 'Full details coming soon.'}
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mt-3">
                This course is part of the GOYA Academy curriculum and may qualify for Continuing Education (CE) credit hours toward your GOYA registration renewal.
              </p>
            </div>

            {/* Course Content */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1B3A5C]">Course Content</h2>
                <span className="text-xs text-slate-400 font-medium">
                  {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
                  {course.duration_minutes ? ` \u00B7 ${formatDuration(course.duration_minutes)}` : ''}
                </span>
              </div>

              {lessons.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No lessons available yet.</p>
              ) : (
                <div className="space-y-1">
                  {lessons.map((lesson, index) => {
                    const lessonLink = isEnrolled ? `/academy/${id}/lesson/${lesson.id}` : null;
                    return (
                      <div key={lesson.id} className={`border border-slate-100 rounded-xl overflow-hidden ${!isEnrolled ? 'opacity-90' : ''}`}>
                        {lessonLink ? (
                          <Link href={lessonLink} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group">
                            <span className="text-base shrink-0">{TYPE_ICONS[lesson.type] ?? '\uD83D\uDCDD'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-[#1B3A5C] group-hover:text-[#4E87A0] transition-colors truncate block">
                                {index + 1}. {lesson.title}
                              </span>
                            </div>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-slate-400 shrink-0">{formatDuration(lesson.duration_minutes)}</span>
                            )}
                            <svg className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-[#4E87A0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-4 p-4">
                            <span className="text-base shrink-0 opacity-50">{TYPE_ICONS[lesson.type] ?? '\uD83D\uDCDD'}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-slate-400 truncate block">{index + 1}. {lesson.title}</span>
                            </div>
                            {lesson.duration_minutes && (
                              <span className="text-xs text-slate-300 shrink-0">{formatDuration(lesson.duration_minutes)}</span>
                            )}
                            <svg className="w-4 h-4 text-slate-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {!isEnrolled && lessons.length > 0 && (
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Enroll to access lesson content
                </p>
              )}
            </div>

            {/* Attendees section */}
            {course.show_attendees && attendees.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#1B3A5C]">Attendees</h2>
                  <span className="text-xs text-slate-400 font-medium">{attendeeCount ?? 0} enrolled</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {attendees.map((att) => (
                    <Link key={att.id} href={`/members/${att.username ?? att.id}`} className="flex items-center gap-2 group">
                      {att.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={att.avatar_url} alt={att.full_name ?? 'Attendee'} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
                          {(att.full_name ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <p className="text-xs font-medium text-primary-dark group-hover:text-primary transition-colors truncate">
                        {att.full_name ?? 'Member'}
                      </p>
                    </Link>
                  ))}
                </div>
                {(attendeeCount ?? 0) > 20 && (
                  <p className="text-xs text-slate-400 mt-3">and {(attendeeCount ?? 0) - 20} more...</p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT column — sticky card */}
          <div>
            <div className="sticky top-24">
              {/* Edit button for organizers and admin/moderator */}
              {canManage && (
                <div className="mb-4">
                  <Link
                    href={`/admin/courses/${id}/edit`}
                    className="block text-center py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                  >
                    Edit Course
                  </Link>
                </div>
              )}

              <CourseEnrollCard
                course={course}
                userId={effectiveUserId ?? user?.id ?? null}
                progress={progress}
                enrollAction={boundEnroll}
              />

              {/* Instructor widget — profile-based (join table) */}
              {instructors.length > 0 && course.show_instructors !== false && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {instructors.length === 1 ? 'Instructor' : 'Instructors'}
                  </h3>
                  <div className="space-y-3">
                    {instructors.map((inst) => (
                      <Link key={inst.id} href={`/members/${inst.username ?? inst.id}`} className="flex items-center gap-3 group">
                        {inst.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={inst.avatar_url} alt={inst.full_name ?? 'Instructor'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {(inst.full_name ?? '?')[0].toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm font-medium text-primary-dark group-hover:text-primary transition-colors">
                          {inst.full_name ?? 'Unknown'}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor fallback — text-based (pre-migration courses) */}
              {instructors.length === 0 && course.instructor && course.show_instructors !== false && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Instructor</h3>
                  <p className="text-sm font-medium text-primary-dark">{course.instructor}</p>
                </div>
              )}

              {/* Organizer widget */}
              {organizers.length > 0 && course.show_organizers !== false && (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {organizers.length === 1 ? 'Organizer' : 'Organizers'}
                  </h3>
                  <div className="space-y-3">
                    {organizers.map((org) => (
                      <Link key={org.id} href={`/members/${org.username ?? org.id}`} className="flex items-center gap-3 group">
                        {org.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={org.avatar_url} alt={org.full_name ?? 'Organizer'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {(org.full_name ?? '?')[0].toUpperCase()}
                          </div>
                        )}
                        <p className="text-sm font-medium text-primary-dark group-hover:text-primary transition-colors">
                          {org.full_name ?? 'Unknown'}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
