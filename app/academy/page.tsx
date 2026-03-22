'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Course, UserCourseProgress, CourseCategory } from '@/lib/types';
import PageHero from '@/app/components/PageHero';

const CATEGORIES: Array<'All' | CourseCategory> = [
  'All', 'Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research',
];

const PROGRESS_FILTERS = ['All', 'My Courses', 'In Progress', 'Completed'] as const;
type ProgressFilter = typeof PROGRESS_FILTERS[number];

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-500',
  Intermediate: 'text-amber-500',
  Advanced:     'text-rose-500',
  'All Levels': 'text-slate-400',
};

function CategoryIcon({ category, size = 'sm' }: { category: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-6 h-6' : 'w-3.5 h-3.5';
  switch (category) {
    case 'Workshop':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    case 'Yoga Sequence':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'Dharma Talk':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
    case 'Music Playlist':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    case 'Research':
      return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
    default:
      return null;
  }
}

function SkeletonCourses() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-pulse">
          <div className="h-36 bg-slate-200" />
          <div className="p-5 flex flex-col gap-2.5">
            <div className="h-3.5 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-4/5 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AcademyPage() {
  const [courses,        setCourses]        = useState<Course[]>([]);
  const [progress,       setProgress]       = useState<UserCourseProgress[]>([]);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'All' | CourseCategory>('All');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('All');

  useEffect(() => {
    async function load() {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      if (error) console.error('[Academy] courses fetch error:', error.message);
      setCourses((coursesData as Course[]) ?? []);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: progressData } = await supabase
          .from('user_course_progress')
          .select('*')
          .eq('user_id', user.id);
        setProgress((progressData as UserCourseProgress[]) ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  const progressMap = useMemo(() => {
    const map: Record<string, UserCourseProgress> = {};
    progress.forEach(p => { map[p.course_id] = p; });
    return map;
  }, [progress]);

  const enrolledIds = useMemo(() => new Set(progress.map(p => p.course_id)), [progress]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (progressFilter === 'My Courses')  return enrolledIds.has(c.id);
      if (progressFilter === 'In Progress') { const p = progressMap[c.id]; return !!p && p.status === 'in_progress'; }
      if (progressFilter === 'Completed')   { const p = progressMap[c.id]; return !!p && p.status === 'completed'; }
      return true;
    });
  }, [courses, categoryFilter, progressFilter, enrolledIds, progressMap]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        pill="GOYA Academy"
        title="Course Library"
        subtitle="Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner."
      />

      {/* Filter bars */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category row */}
          <div className={`py-3 flex flex-wrap gap-2 items-center ${userId ? 'border-b border-slate-100' : ''}`}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  categoryFilter === cat
                    ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat !== 'All' && (
                  <span className={categoryFilter === cat ? 'text-white' : 'text-slate-400'}>
                    <CategoryIcon category={cat} size="sm" />
                  </span>
                )}
                {cat === 'All' ? 'All Courses' : cat}
              </button>
            ))}
            <span className="ml-auto text-sm text-slate-400">
              <span className="font-semibold text-slate-700">{filtered.length}</span> course{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Progress filter row — only when logged in */}
          {userId && (
            <div className="py-2.5 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-400 font-medium">My Progress:</span>
              {PROGRESS_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setProgressFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    progressFilter === f
                      ? 'bg-[#4E87A0] text-white border-[#4E87A0]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <SkeletonCourses />
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold mb-1">No courses found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map(course => {
              const userProgress = progressMap[course.id];
              const isCompleted  = userProgress?.status === 'completed';
              const isInProgress = userProgress?.status === 'in_progress';

              return (
                <Link
                  key={course.id}
                  href={`/academy/${course.id}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
                >
                  {/* Thumbnail */}
                  <div
                    className="h-36 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${course.gradient_from}, ${course.gradient_to})` }}
                  >
                    <div className="opacity-20 scale-[3] text-white">
                      <CategoryIcon category={course.category} size="lg" />
                    </div>
                    <div className="absolute inset-0 bg-black/10" />

                    {/* Access badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        course.access === 'free'
                          ? 'bg-emerald-400 text-white'
                          : 'bg-black/40 text-white backdrop-blur-sm'
                      }`}>
                        {course.access === 'free' ? 'Free' : 'Members Only'}
                      </span>
                    </div>

                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </div>
                    )}

                    {/* Category badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                        {course.category}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-semibold text-[#1B3A5C] text-sm leading-snug mb-1 line-clamp-2">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">{course.instructor}</p>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1 mb-4">
                      {course.short_description}
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                      {course.duration && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {course.duration}
                        </span>
                      )}
                      {course.level && (
                        <span className={`font-medium ${LEVEL_COLORS[course.level] ?? 'text-slate-400'}`}>
                          {course.level}
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {(isInProgress || isCompleted) && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Progress</span>
                          <span className="text-xs font-semibold text-[#4E87A0]">
                            {isCompleted ? '100%' : 'In Progress'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-[#4E87A0] h-1.5 rounded-full"
                            style={{ width: isCompleted ? '100%' : '50%' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
