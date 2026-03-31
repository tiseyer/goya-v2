import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Course, UserCourseProgress } from '@/lib/types';
import { enrollAndStart } from './actions';
import CourseEnrollCard from './CourseEnrollCard';
import PageContainer from '@/app/components/ui/PageContainer';

export const dynamic = 'force-dynamic';

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-600 bg-emerald-50 border-emerald-200',
  Intermediate: 'text-amber-600 bg-amber-50 border-amber-200',
  Advanced:     'text-rose-600 bg-rose-50 border-rose-200',
  'All Levels': 'text-slate-600 bg-slate-100 border-slate-200',
};

const CATEGORY_COLORS: Record<string, string> = {
  Workshop:         'text-teal-700 bg-teal-50 border-teal-200',
  'Yoga Sequence':  'text-green-700 bg-green-50 border-green-200',
  'Dharma Talk':    'text-blue-700 bg-blue-50 border-blue-200',
  'Music Playlist': 'text-pink-700 bg-pink-50 border-pink-200',
  Research:         'text-slate-600 bg-slate-100 border-slate-200',
};

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch course
  const { data: courseData } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (!courseData) notFound();
  const course = courseData as Course;

  // Auth + progress
  const { data: { user } } = await supabase.auth.getUser();
  let progress: UserCourseProgress | null = null;
  if (user) {
    const { data } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', id)
      .maybeSingle();
    progress = (data as UserCourseProgress | null) ?? null;
  }

  const isEnrolled   = !!progress;
  const isCompleted  = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const lessonTitle  = `Video – ${course.title}`;

  // Bind server action to this course id
  const boundEnroll = enrollAndStart.bind(null, id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary relative overflow-hidden flex items-center h-[200px] sm:h-[220px] md:h-[240px]">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Soft glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <PageContainer className="relative">
          <Link
            href="/academy"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-2 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academy
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[course.category] ?? 'text-slate-600 bg-slate-100 border-slate-200'}`}>
              {course.category}
            </span>
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

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 max-w-3xl">{course.title}</h1>
          {course.short_description && (
            <p className="text-white/85 text-sm max-w-2xl">{course.short_description}</p>
          )}
        </PageContainer>
      </div>

      {/* Main content */}
      <PageContainer className="py-10">
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
                <span className="text-xs text-slate-400 font-medium">1 lesson{course.duration ? ` · ${course.duration}` : ''}</span>
              </div>

              {/* Lesson row */}
              <div className={`border border-slate-100 rounded-xl overflow-hidden ${!isEnrolled ? 'opacity-90' : ''}`}>
                {isEnrolled ? (
                  <Link
                    href={`/academy/${id}/lesson`}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-[#4E87A0]'
                    }`}>
                      {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {isInProgress && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#4E87A0]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-[#1B3A5C] group-hover:text-[#4E87A0] transition-colors truncate">
                          {lessonTitle}
                        </span>
                      </div>
                    </div>
                    {course.duration && (
                      <span className="text-xs text-slate-400 shrink-0">{course.duration}</span>
                    )}
                    <svg className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-[#4E87A0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-slate-400 truncate">{lessonTitle}</span>
                      </div>
                    </div>
                    {course.duration && (
                      <span className="text-xs text-slate-300 shrink-0">{course.duration}</span>
                    )}
                    <svg className="w-4 h-4 text-slate-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>

              {!isEnrolled && (
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
                userId={user?.id ?? null}
                progress={progress}
                enrollAction={boundEnroll}
              />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
