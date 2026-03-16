'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { courses, allCourseCategories, type CourseCategory } from '@/lib/academy-data';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Workshop: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  'Yoga Sequence': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  'Dharma Talk': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  'Music Playlist': (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  Research: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

export default function AcademyPage() {
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const filtered = useMemo(() => {
    if (activeFilter === 'In Progress') return courses.filter(c => c.status === 'in_progress');
    if (activeFilter === 'Completed') return courses.filter(c => c.status === 'completed');
    if (activeFilter !== 'All') return courses.filter(c => c.category === activeFilter);
    return courses;
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-[#1a2744] pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -right-20 top-0 w-96 h-96 bg-[#2dd4bf] opacity-[0.04] rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 rounded-full px-3 py-1 text-[#2dd4bf] text-xs font-medium mb-5">
            GOYA Academy
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Course Library</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2 items-center">
          {allCourseCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                activeFilter === cat
                  ? 'bg-[#1a2744] text-white border-[#1a2744]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat !== 'All' && cat !== 'In Progress' && cat !== 'Completed' && (
                <span className={activeFilter === cat ? 'text-white' : 'text-slate-400'}>
                  {CATEGORY_ICONS[cat]}
                </span>
              )}
              {cat === 'All' ? 'All Courses' : cat}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-400">
            <span className="font-semibold text-slate-700">{filtered.length}</span> courses
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map(course => (
            <Link
              key={course.id}
              href={`/academy/${course.id}`}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col"
            >
              {/* Thumbnail */}
              <div className={`bg-gradient-to-br ${course.gradient} h-36 flex items-center justify-center relative overflow-hidden`}>
                <div className={`${course.iconColor} opacity-30 scale-[3]`}>
                  {CATEGORY_ICONS[course.category]}
                </div>
                <div className="absolute inset-0 bg-black/10" />
                {/* Access badge */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    course.access === 'Free'
                      ? 'bg-emerald-400 text-white'
                      : 'bg-[#1a2744]/80 text-[#2dd4bf] backdrop-blur-sm'
                  }`}>
                    {course.access}
                  </span>
                </div>
                {course.status === 'completed' && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Completed
                  </div>
                )}
                {/* Category */}
                <div className="absolute bottom-3 left-3">
                  <span className="text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/20">
                    {course.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-semibold text-[#1a2744] text-sm leading-snug mb-1 group-hover:text-[#1a2744] line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-500 mb-3">{course.instructor}</p>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 flex-1 mb-4">
                  {course.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.duration}
                  </span>
                  <span>{course.lessons} lessons</span>
                  <span className={`font-medium ${
                    course.level === 'Beginner' ? 'text-emerald-500' :
                    course.level === 'Intermediate' ? 'text-amber-500' :
                    course.level === 'Advanced' ? 'text-rose-500' : 'text-slate-400'
                  }`}>{course.level}</span>
                </div>
                {course.status === 'in_progress' && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Progress</span>
                      <span className="text-xs font-semibold text-[#2dd4bf]">{course.userProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-[#2dd4bf] h-1.5 rounded-full" style={{ width: `${course.userProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
