'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Course, UserCourseProgress } from '@/lib/types';

function extractVimeoId(url: string): string | null {
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/);
  return match ? match[1] : null;
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-500',
  Intermediate: 'text-amber-500',
  Advanced:     'text-rose-500',
  'All Levels': 'text-slate-400',
};

export default function CoursePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [course,       setCourse]       = useState<Course | null>(null);
  const [related,      setRelated]      = useState<Course[]>([]);
  const [userProgress, setUserProgress] = useState<UserCourseProgress | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [busy,         setBusy]         = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    async function load() {
      // Fetch course (allow published or admin/mod to view draft too)
      const { data: courseData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (!courseData) { setLoading(false); return; }
      setCourse(courseData as Course);

      // Fetch related courses
      const { data: relatedData } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .eq('category', (courseData as Course).category)
        .neq('id', id)
        .limit(3);
      setRelated((relatedData as Course[]) ?? []);

      // Check user auth + progress
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: prog } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', id)
          .maybeSingle();
        setUserProgress((prog as UserCourseProgress | null) ?? null);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  async function handleMarkComplete() {
    if (!userId || !course) return;
    setBusy(true);
    setError('');
    const now = new Date().toISOString();

    if (!userProgress) {
      // Enroll + mark complete in one insert
      const { data, error: dbErr } = await supabase
        .from('user_course_progress')
        .insert({ user_id: userId, course_id: course.id, status: 'completed', completed_at: now })
        .select()
        .single();
      if (dbErr) { setError(dbErr.message); setBusy(false); return; }
      setUserProgress(data as UserCourseProgress);
    } else if (userProgress.status === 'in_progress') {
      const { data, error: dbErr } = await supabase
        .from('user_course_progress')
        .update({ status: 'completed', completed_at: now })
        .eq('id', userProgress.id)
        .select()
        .single();
      if (dbErr) { setError(dbErr.message); setBusy(false); return; }
      setUserProgress(data as UserCourseProgress);
    }

    setBusy(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    notFound();
    return null;
  }

  const isCompleted  = userProgress?.status === 'completed';
  const isInProgress = userProgress?.status === 'in_progress';
  const vimeoId = course.vimeo_url ? extractVimeoId(course.vimeo_url) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1B3A5C] pt-24 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/academy"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Academy
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-white/10 text-slate-300 px-3 py-1 rounded-full border border-white/15">
              {course.category}
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              course.access === 'free' ? 'bg-emerald-400 text-white' : 'bg-[#4E87A0]/80 text-white'
            }`}>
              {course.access === 'free' ? 'Free' : 'Members Only'}
            </span>
            {course.level && (
              <span className={`text-xs font-medium ${LEVEL_COLORS[course.level] ?? 'text-slate-400'}`}>
                {course.level}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{course.title}</h1>
          <p className="text-slate-300 text-base mb-5 max-w-2xl">{course.short_description}</p>

          <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
            {course.instructor && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {course.instructor}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {course.duration}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main: video player + info */}
          <div className="lg:col-span-2 space-y-6">

            {/* Video area */}
            {vimeoId ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-black" style={{ paddingTop: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0`}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={course.title}
                />
              </div>
            ) : course.thumbnail_url ? (
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg" style={{ paddingTop: '56.25%' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-full rounded-2xl shadow-lg flex items-center justify-center"
                style={{
                  paddingTop: '56.25%',
                  background: `linear-gradient(135deg, ${course.gradient_from}, ${course.gradient_to})`,
                  position: 'relative',
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium opacity-80">Video coming soon</p>
                  </div>
                </div>
              </div>
            )}

            {/* Progress display */}
            {(isInProgress || isCompleted) && (
              <div className="p-4 bg-white rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Your Progress</span>
                  <span className="text-sm font-bold text-[#4E87A0]">{isCompleted ? '100%' : 'In Progress'}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-[#4E87A0] h-2 rounded-full transition-all"
                    style={{ width: isCompleted ? '100%' : '50%' }}
                  />
                </div>
              </div>
            )}

            {/* Mark as complete */}
            {userId && (
              <div>
                {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleted || busy}
                  className={`w-full py-3 font-bold rounded-xl transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-[#4E87A0] text-white hover:bg-[#3A7190] disabled:opacity-60'
                  }`}
                >
                  {busy ? 'Saving…' : isCompleted ? '✓ Completed' : '✓ Mark as Complete'}
                </button>
              </div>
            )}

            {!userId && (
              <div className="p-4 bg-[#F7F8FA] rounded-xl border border-[#E5E7EB] text-center">
                <p className="text-sm text-slate-600 mb-3">Sign in to track your progress</p>
                <div className="flex gap-3 justify-center">
                  <Link href="/sign-in" className="px-4 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors">Sign In</Link>
                  <Link href="/register" className="px-4 py-2 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-white transition-colors">Join GOYA</Link>
                </div>
              </div>
            )}

            {/* About */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
              <h2 className="text-base font-semibold text-[#1B3A5C] mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
                About this Course
              </h2>
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {course.description || course.short_description || 'Full details coming soon.'}
              </p>
              <p className="text-slate-500 text-sm leading-relaxed mt-3">
                This course is part of the GOYA Academy curriculum and may qualify for Continuing Education (CE) credit hours toward your GOYA registration renewal. Check your member dashboard for eligibility.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div
                className="w-full h-2 rounded-full mb-5"
                style={{ background: `linear-gradient(to right, ${course.gradient_from}, ${course.gradient_to})` }}
              />
              {course.access === 'free' ? (
                <>
                  <p className="text-2xl font-bold text-[#1B3A5C] mb-1">Free</p>
                  <p className="text-slate-500 text-xs mb-5">Open to everyone</p>
                  {!userId && (
                    <Link href="/sign-in" className="block w-full bg-[#4E87A0] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#3A7190] transition-colors text-center">
                      Start Watching
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Members Only</p>
                  <p className="text-slate-500 text-xs mb-5">Available with a GOYA membership</p>
                  {!userId && (
                    <>
                      <Link href="/register" className="block w-full bg-[#4E87A0] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#3A7190] transition-colors text-center">
                        Join GOYA to Watch
                      </Link>
                      <Link href="/sign-in" className="block w-full mt-2 border border-slate-200 text-slate-600 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors text-center">
                        Sign In
                      </Link>
                    </>
                  )}
                </>
              )}
              {userId && isCompleted && (
                <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Course Completed
                </div>
              )}
            </div>

            {/* Course details */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1B3A5C] mb-4">Course Details</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Instructor', value: course.instructor },
                  { label: 'Duration',   value: course.duration   },
                  { label: 'Level',      value: course.level      },
                  { label: 'Category',   value: course.category   },
                  { label: 'Access',     value: course.access === 'free' ? 'Free' : 'Members Only' },
                ].filter(r => r.value).map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-medium text-slate-700 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related courses */}
        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[#1B3A5C] mb-6">More in {course.category}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {related.map(c => (
                <Link
                  key={c.id}
                  href={`/academy/${c.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  <div
                    className="h-28"
                    style={{ background: `linear-gradient(135deg, ${c.gradient_from}, ${c.gradient_to})` }}
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-[#1B3A5C] text-sm mb-1 group-hover:text-[#4E87A0] transition-colors line-clamp-2">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-400">{c.instructor}{c.duration ? ` · ${c.duration}` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
