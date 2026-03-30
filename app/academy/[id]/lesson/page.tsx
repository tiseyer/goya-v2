'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Course, UserCourseProgress } from '@/lib/types';
import { markLessonComplete } from './actions';

function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

export default function LessonPage() {
  const params   = useParams<{ id: string }>();
  const id       = params.id;
  const router   = useRouter();

  const [course,   setCourse]   = useState<Course | null>(null);
  const [progress, setProgress] = useState<UserCourseProgress | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    async function load() {
      // Fetch course
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (!courseData) { router.replace('/academy'); return; }
      setCourse(courseData as Course);

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/academy/${id}`); return; }

      // Check enrollment — redirect to overview if not enrolled
      const { data: prog } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', id)
        .maybeSingle();

      if (!prog) { router.replace(`/academy/${id}`); return; }

      setProgress(prog as UserCourseProgress);
      setLoading(false);
    }
    load();
  }, [id, router]);

  async function handleMarkComplete() {
    if (!progress || progress.status === 'completed') return;
    setBusy(true);
    setError('');
    const { data, error: dbErr } = await markLessonComplete(progress.id, id);
    if (dbErr) { setError(dbErr); setBusy(false); return; }
    // Track course_completed engagement event
    try {
      const { trackCourseCompleted } = await import('@/lib/analytics/tracking');
      trackCourseCompleted(course?.title ?? id);
    } catch { /* analytics non-critical */ }
    setProgress(data as UserCourseProgress);
    setBusy(false);
  }

  if (loading || !course || !progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCompleted = progress.status === 'completed';
  const lessonTitle = `Video – ${course.title}`;
  const vimeoId     = course.vimeo_url ? extractVimeoId(course.vimeo_url) : null;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top lesson bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-16 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Lesson 1 of 1
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isCompleted
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-[#4E87A0]/10 text-[#4E87A0]'
            }`}>
              {isCompleted ? '✓ Completed' : 'In Progress'}
            </span>
            {/* Prev/Next — disabled (only 1 lesson) */}
            <div className="flex items-center gap-0.5">
              <button disabled className="w-7 h-7 flex items-center justify-center rounded text-slate-200 cursor-not-allowed" aria-label="Previous lesson">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button disabled className="w-7 h-7 flex items-center justify-center rounded text-slate-200 cursor-not-allowed" aria-label="Next lesson">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
          <Link href="/academy" className="hover:text-[#4E87A0] transition-colors">
            Academy
          </Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/academy/${id}`} className="hover:text-[#4E87A0] transition-colors truncate max-w-[180px] sm:max-w-xs">
            {course.title}
          </Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 truncate max-w-[180px] sm:max-w-xs">{lessonTitle}</span>
        </nav>

        {/* Lesson heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C] mb-3">{lessonTitle}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8">
          {course.instructor && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {course.instructor}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Started {new Date(progress.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Video player */}
        {vimeoId ? (
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black mb-6"
            style={{ paddingTop: '56.25%' }}
          >
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={lessonTitle}
            />
          </div>
        ) : (
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-6"
            style={{ paddingTop: '56.25%', background: `linear-gradient(135deg, ${course.gradient_from}, ${course.gradient_to})` }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <svg className="w-16 h-16 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium opacity-80">Video coming soon</p>
            </div>
          </div>
        )}

        {/* Mark as Complete + back link */}
        <div className="max-w-lg space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleMarkComplete}
            disabled={isCompleted || busy}
            className={`w-full py-3.5 font-bold rounded-xl transition-colors text-sm ${
              isCompleted
                ? 'bg-green-500 text-white cursor-default'
                : 'bg-[#4E87A0] text-white hover:bg-[#3A7190] disabled:opacity-60'
            }`}
          >
            {busy ? 'Saving…' : isCompleted ? '✓ Completed' : '✓ Mark as Complete'}
          </button>

          <Link
            href={`/academy/${id}`}
            className="flex items-center gap-2 text-sm text-[#4E87A0] hover:text-[#3A7190] font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Course Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
