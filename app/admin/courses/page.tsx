import Link from 'next/link';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Course } from '@/lib/types';
import AdminCourseActions from './AdminCourseActions';
import AdminCoursesFilters from './AdminCoursesFilters';

const CATEGORY_BADGE: Record<string, string> = {
  Workshop:         'bg-blue-50 text-blue-700',
  'Yoga Sequence':  'bg-blue-50 text-blue-700',
  'Dharma Talk':    'bg-blue-50 text-blue-700',
  'Music Playlist': 'bg-blue-50 text-blue-700',
  Research:         'bg-blue-50 text-blue-700',
};

const ACCESS_BADGE: Record<string, string> = {
  free:         'bg-emerald-50 text-emerald-700',
  members_only: 'bg-blue-50 text-blue-700',
};

const STATUS_BADGE: Record<string, string> = {
  published:      'bg-emerald-50 text-emerald-700',
  draft:          'bg-amber-50 text-amber-700',
  pending_review: 'bg-amber-50 text-amber-700',
  rejected:       'bg-red-50 text-red-700',
  cancelled:      'bg-red-50 text-red-700',
  deleted:        'bg-red-50 text-red-700 line-through',
};

const TYPE_BADGE: Record<string, string> = {
  goya:   'bg-blue-50 text-blue-700',
  member: 'bg-indigo-50 text-indigo-700',
};

const LEVEL_BADGE: Record<string, string> = {
  Beginner:     'text-emerald-600',
  Intermediate: 'text-amber-600',
  Advanced:     'text-rose-600',
  'All Levels': 'text-slate-500',
};

const PAGE_SIZE = 25;

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp         = await searchParams;
  const search     = sp.search     ?? '';
  const category   = sp.category   ?? '';
  const access     = sp.access     ?? '';
  const status     = sp.status     ?? '';   // '' means "active" (exclude deleted)
  const courseType  = sp.type       ?? '';   // '' = all, 'goya', 'member'
  const sort       = sp.sort       ?? 'created_at_desc';
  const page       = Math.max(1, parseInt(sp.page ?? '1', 10));

  // ── Current user's role ───────────────────────────────────────────────────
  const supabase   = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();
  const userRole = (profileRow?.role as string) ?? 'moderator';
  const isAdmin  = userRole === 'admin';

  // ── Guard: moderators cannot view deleted courses ─────────────────────────
  const effectiveStatus = (status === 'deleted' && !isAdmin) ? '' : status;

  // ── Query ─────────────────────────────────────────────────────────────────
  let query = supabase.from('courses').select('*, profiles!created_by(full_name, email)', { count: 'exact' });

  if (effectiveStatus) {
    query = query.eq('status', effectiveStatus);
  } else {
    query = query.neq('status', 'deleted');
  }

  if (search)     query = query.ilike('title', `%${search}%`);
  if (category)   query = query.eq('category', category);
  if (access)     query = query.eq('access', access);
  if (courseType)  query = query.eq('course_type', courseType);

  if (sort === 'title_asc')        query = query.order('title', { ascending: true });
  else if (sort === 'title_desc')  query = query.order('title', { ascending: false });
  else                             query = query.order('created_at', { ascending: false });

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  type CourseWithProfile = Course & { profiles: { full_name: string; email: string } | null };
  const courses    = (data as CourseWithProfile[]) ?? [];
  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const viewingDeleted = effectiveStatus === 'deleted';

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Courses</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{total} {viewingDeleted ? 'deleted' : 'active'} course{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 mb-6">
        <Suspense>
          <AdminCoursesFilters userRole={userRole} />
        </Suspense>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          Error loading courses: {error.message}
        </div>
      )}

      {/* Table */}
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${viewingDeleted ? 'border-red-200' : 'border-[#E5E7EB]'}`}>
        {courses.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-[#374151] font-medium">
              {viewingDeleted ? 'No deleted courses' : 'No courses found'}
            </p>
            <p className="text-[#9CA3AF] text-sm mt-1">
              {viewingDeleted ? 'Nothing has been soft-deleted yet.' : 'Try adjusting your filters or add a new course.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-[#E5E7EB] ${viewingDeleted ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Instructor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {courses.map(course => {
                  const isDeleted = course.status === 'deleted';
                  return (
                    <tr key={course.id} className={`transition-colors ${isDeleted ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}>
                      {/* Course title + badges */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className={`font-medium truncate ${isDeleted ? 'text-[#9CA3AF] line-through' : 'text-[#1B3A5C]'}`}>
                          {course.title}
                        </p>
                        {course.course_type === 'member' && course.profiles && (
                          <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                            Submitted by {course.profiles.full_name || course.profiles.email}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_BADGE[course.category] ?? 'bg-slate-100 text-slate-600'}`}>
                            {course.category}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ACCESS_BADGE[course.access] ?? 'bg-slate-100 text-slate-600'}`}>
                            {course.access === 'free' ? 'Free' : 'Members Only'}
                          </span>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${TYPE_BADGE[course.course_type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {course.course_type === 'member' ? 'Member' : 'GOYA'}
                        </span>
                      </td>
                      {/* Instructor */}
                      <td className="px-4 py-3 text-[#374151] hidden md:table-cell">{course.instructor ?? '—'}</td>
                      {/* Level */}
                      <td className={`px-4 py-3 font-medium hidden lg:table-cell ${course.level ? LEVEL_BADGE[course.level] : 'text-slate-400'}`}>
                        {course.level ?? '—'}
                      </td>
                      {/* Duration */}
                      <td className="px-4 py-3 text-[#374151] hidden lg:table-cell">{course.duration ?? '—'}</td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[course.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {course.status === 'pending_review' ? 'Pending Review' : course.status}
                        </span>
                        {isDeleted && course.deleted_at && (
                          <p className="text-[9px] text-[#9CA3AF] mt-0.5">
                            {new Date(course.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <AdminCourseActions
                          courseId={course.id}
                          isDeleted={isDeleted}
                          userRole={userRole}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-[#6B7280]">
            Showing {from + 1}–{Math.min(from + PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/courses?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                className="px-3 py-1.5 border border-[#E5E7EB] text-sm rounded-lg hover:bg-slate-50 text-[#374151]"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/courses?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                className="px-3 py-1.5 border border-[#E5E7EB] text-sm rounded-lg hover:bg-slate-50 text-[#374151]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
