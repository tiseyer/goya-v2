'use client';

import Link from 'next/link';
import type { Course, UserCourseProgress } from '@/lib/types';

interface Props {
  course:       Course;
  userId:       string | null;
  progress:     UserCourseProgress | null;
  enrollAction: () => Promise<void>;
}

export default function CourseEnrollCard({ course, userId, progress, enrollAction }: Props) {
  const isCompleted  = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  const isEnrolled   = !!progress;

  const lastActivity = progress?.completed_at ?? progress?.enrolled_at ?? null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 space-y-4">
      {/* Gradient strip */}
      <div
        className="w-full h-2 rounded-full"
        style={{ background: `linear-gradient(to right, ${course.gradient_from}, ${course.gradient_to})` }}
      />

      {/* Completed badge */}
      {isCompleted && (
        <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Course Completed
        </div>
      )}

      {/* Progress bar (enrolled only) */}
      {isEnrolled && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-medium">Your Progress</span>
            <span className="text-xs font-bold text-[#4E87A0]">{isCompleted ? '100%' : '0%'}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-[#4E87A0] h-2 rounded-full transition-all"
              style={{ width: isCompleted ? '100%' : '5%' }}
            />
          </div>
          {lastActivity && (
            <p className="text-xs text-slate-400 mt-1.5">
              Last activity on {new Date(lastActivity).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* CTAs */}
      {!userId ? (
        /* Not logged in */
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Sign in or join to access this course</p>
          <Link
            href="/register"
            className="block w-full text-center py-3 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm"
          >
            Join GOYA to Watch
          </Link>
          <Link
            href="/sign-in"
            className="block w-full text-center py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>
      ) : isCompleted ? (
        /* Completed */
        <Link
          href={`/academy/${course.id}/lesson`}
          className="block w-full text-center py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
        >
          Revisit Course
        </Link>
      ) : isInProgress ? (
        /* In progress */
        <Link
          href={`/academy/${course.id}/lesson`}
          className="block w-full text-center py-3 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm"
        >
          Continue
        </Link>
      ) : (
        /* Logged in, not enrolled */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Access</span>
            <span className={`font-semibold ${course.access === 'free' ? 'text-emerald-600' : 'text-[#1B3A5C]'}`}>
              {course.access === 'free' ? 'Free' : 'Members Only'}
            </span>
          </div>
          <form action={enrollAction}>
            <button
              type="submit"
              onClick={() => {
                try {
                  import('@/lib/analytics/tracking').then(({ trackCourseStarted }) => {
                    trackCourseStarted(course.title);
                  });
                } catch { /* analytics non-critical */ }
              }}
              className="w-full py-3 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors text-sm"
            >
              Start Course
            </button>
          </form>
        </div>
      )}

      {/* Course Includes (shown when logged in) */}
      {userId && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Course Includes</p>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-[#4E87A0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              1 Lesson
            </div>
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-[#4E87A0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Course Certificate
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
