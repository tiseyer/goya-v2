'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Course, UserCourseProgress } from '@/lib/types';
import PageHero from '@/app/components/PageHero';

type CategoryRow = { id: string; name: string; slug: string; color: string };

type CourseWithCategory = Course & {
  _categoryColor: string | null;
  course_categories?: { id: string; name: string; slug: string; color: string } | null;
};

const PROGRESS_FILTERS = ['All', 'My Courses', 'In Progress', 'Completed'] as const;
type ProgressFilter = typeof PROGRESS_FILTERS[number];

const LEVEL_COLORS: Record<string, string> = {
  Beginner:     'text-emerald-500',
  Intermediate: 'text-amber-500',
  Advanced:     'text-rose-500',
  'All Levels': 'text-slate-400',
};

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AcademyPage() {
  const [courses,        setCourses]        = useState<CourseWithCategory[]>([]);
  const [categories,     setCategories]     = useState<CategoryRow[]>([]);
  const [progress,       setProgress]       = useState<UserCourseProgress[]>([]);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'All'>('All');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('All');

  useEffect(() => {
    async function load() {
      const { data: coursesData, error } = await supabase
        .from('courses')
        .select('*, course_categories(id, name, slug, color)')
        .eq('status', 'published')
        .order('created_at', { ascending: true });

      if (error) console.error('[Academy] courses fetch error:', error.message);

      const mapped = ((coursesData ?? []) as (Course & { course_categories?: CategoryRow | null })[]).map((c) => ({
        ...c,
        category: c.course_categories?.name ?? (c as Course).category ?? null,
        _categoryColor: c.course_categories?.color ?? null,
      })) as CourseWithCategory[];
      setCourses(mapped);

      const { data: catData } = await supabase
        .from('course_categories')
        .select('id, name, slug, color')
        .order('sort_order', { ascending: true });
      setCategories((catData as CategoryRow[]) ?? []);

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
      if (selectedCategoryId !== 'All' && c.category_id !== selectedCategoryId) return false;
      if (progressFilter === 'My Courses')  return enrolledIds.has(c.id);
      if (progressFilter === 'In Progress') { const p = progressMap[c.id]; return !!p && p.status === 'in_progress'; }
      if (progressFilter === 'Completed')   { const p = progressMap[c.id]; return !!p && p.status === 'completed'; }
      return true;
    });
  }, [courses, selectedCategoryId, progressFilter, enrolledIds, progressMap]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHero
        variant="dark"
        pill="GOYA Academy"
        title="Course Library"
        subtitle="Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner."
      />

      {/* Filter bars */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category row */}
          <div className={`py-3 flex flex-wrap gap-2 items-center ${userId ? 'border-b border-slate-100' : ''}`}>
            <button
              onClick={() => setSelectedCategoryId('All')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedCategoryId === 'All'
                  ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Courses
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#1B3A5C] text-white border-[#1B3A5C]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {cat.color && selectedCategoryId !== cat.id && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                )}
                {cat.name}
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
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#4E87A0] border-t-transparent rounded-full animate-spin" />
          </div>
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

                    {/* Category badge with color dot */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      {course._categoryColor && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: course._categoryColor }} />
                      )}
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
                      {formatDuration(course.duration_minutes) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(course.duration_minutes)}
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
