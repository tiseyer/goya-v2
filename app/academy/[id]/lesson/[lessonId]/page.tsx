'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Course, UserCourseProgress } from '@/lib/types';
import type { Lesson } from '@/lib/courses/lessons';
import { markLessonComplete } from './actions';

function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

type SiblingLesson = { id: string; title: string; sort_order: number };

export default function LessonPlayerPage() {
  const params     = useParams<{ id: string; lessonId: string }>();
  const id         = params.id;
  const lessonId   = params.lessonId;
  const router     = useRouter();

  const [course,     setCourse]     = useState<Course | null>(null);
  const [lesson,     setLesson]     = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<SiblingLesson[]>([]);
  const [progress,   setProgress]   = useState<UserCourseProgress | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');

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

      // Fetch the specific lesson
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (!lessonData) { router.replace(`/academy/${id}`); return; }
      setLesson(lessonData as Lesson);

      // Fetch all sibling lessons for prev/next navigation
      const { data: siblingsData } = await supabase
        .from('lessons')
        .select('id, title, sort_order')
        .eq('course_id', id)
        .order('sort_order', { ascending: true });

      setAllLessons((siblingsData as SiblingLesson[]) ?? []);

      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace(`/academy/${id}`); return; }

      // Check enrollment
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
  }, [id, lessonId, router]);

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

  if (loading || !course || !lesson || !progress) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCompleted  = progress.status === 'completed';
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson   = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson   = currentIndex >= 0 && currentIndex < allLessons.length - 1
    ? allLessons[currentIndex + 1]
    : null;

  const duration = formatDuration(lesson.duration_minutes);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Top lesson bar */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {currentIndex >= 0
              ? `Lesson ${currentIndex + 1} of ${allLessons.length}`
              : 'Lesson'}
          </span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isCompleted
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-[#4E87A0]/10 text-[#4E87A0]'
            }`}>
              {isCompleted ? '\u2713 Completed' : 'In Progress'}
            </span>
            {/* Prev/Next navigation */}
            <div className="flex items-center gap-0.5">
              {prevLesson ? (
                <Link
                  href={`/academy/${id}/lesson/${prevLesson.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-[#4E87A0] transition-colors"
                  aria-label="Previous lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-200 cursor-not-allowed"
                  aria-label="Previous lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {nextLesson ? (
                <Link
                  href={`/academy/${id}/lesson/${nextLesson.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-[#4E87A0] transition-colors"
                  aria-label="Next lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-7 h-7 flex items-center justify-center rounded text-slate-200 cursor-not-allowed"
                  aria-label="Next lesson"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
          <Link href="/academy" className="hover:text-[#4E87A0] transition-colors">
            Academy
          </Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link
            href={`/academy/${id}`}
            className="hover:text-[#4E87A0] transition-colors truncate max-w-[180px] sm:max-w-xs"
          >
            {course.title}
          </Link>
          <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-600 truncate max-w-[180px] sm:max-w-xs">{lesson.title}</span>
        </nav>

        {/* Lesson heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1B3A5C] mb-3">{lesson.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8">
          {course.instructor && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {course.instructor}
            </span>
          )}
          {duration && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {duration}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Started {new Date(progress.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        {/* Type-specific content */}
        {lesson.type === 'video' && (
          <>
            {lesson.video_platform === 'vimeo' && lesson.video_url && extractVimeoId(lesson.video_url) ? (
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black mb-6"
                style={{ paddingTop: '56.25%' }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://player.vimeo.com/video/${extractVimeoId(lesson.video_url)}?badge=0&autopause=0&player_id=0`}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title={lesson.title}
                />
              </div>
            ) : lesson.video_platform === 'youtube' && lesson.video_url && extractYouTubeId(lesson.video_url) ? (
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black mb-6"
                style={{ paddingTop: '56.25%' }}
              >
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${extractYouTubeId(lesson.video_url)}?rel=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title={lesson.title}
                />
              </div>
            ) : (
              <div
                className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-6"
                style={{
                  paddingTop: '56.25%',
                  background: `linear-gradient(135deg, ${course.gradient_from ?? '#4E87A0'}, ${course.gradient_to ?? '#1B3A5C'})`,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <svg className="w-16 h-16 mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium opacity-80">Video unavailable</p>
                </div>
              </div>
            )}
          </>
        )}

        {lesson.type === 'audio' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 mb-6">
            {lesson.featured_image_url && (
              <img
                src={lesson.featured_image_url}
                alt={lesson.title}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}
            <audio controls className="w-full" preload="metadata">
              <source src={lesson.audio_url!} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {lesson.type === 'text' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 sm:p-8 mb-6">
            {lesson.featured_image_url && (
              <img
                src={lesson.featured_image_url}
                alt={lesson.title}
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
            )}
            <div className="prose prose-slate max-w-none">
              {lesson.description?.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Short description */}
        {lesson.short_description && (
          <p className="text-sm text-slate-600 mb-4">{lesson.short_description}</p>
        )}

        {/* Full description for video/audio */}
        {lesson.type !== 'text' && lesson.description && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">About this lesson</h3>
            <div className="prose prose-slate prose-sm max-w-none text-slate-600">
              {lesson.description.split('\n').filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
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
            {busy ? 'Saving\u2026' : isCompleted ? '\u2713 Completed' : '\u2713 Mark as Complete'}
          </button>

          {nextLesson && (
            <Link
              href={`/academy/${id}/lesson/${nextLesson.id}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 font-bold rounded-xl border border-[#4E87A0] text-[#4E87A0] hover:bg-[#4E87A0]/5 transition-colors text-sm"
            >
              Next: {nextLesson.title}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}

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
