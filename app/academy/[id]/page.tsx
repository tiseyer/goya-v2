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
            {course.instructor && (
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
          </div>

          {/* RIGHT column — sticky card */}
          <div>
            <div className="sticky top-24">
              <CourseEnrollCard
                course={course}
                userId={effectiveUserId ?? user?.id ?? null}
                progress={progress}
                enrollAction={boundEnroll}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
