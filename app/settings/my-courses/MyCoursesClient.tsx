'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Course, CourseCategory, CourseLevel, CourseAccess } from '@/lib/types';
import {
  createMemberCourse,
  updateMemberCourse,
  submitCourseForReview,
  deleteMemberCourse,
} from './actions';

const CATEGORIES: CourseCategory[] = ['Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research'];
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

const INPUT = 'w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0] transition-colors';
const LABEL = 'block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-100 text-zinc-700',
  pending_review: 'bg-amber-50 text-amber-700',
  published: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
};

interface Props {
  initialCourses: Course[];
}

export default function MyCoursesClient({ initialCourses }: Props) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  function handleAddClick() {
    const dismissed = localStorage.getItem('goya-courses-info-dismissed');
    if (!dismissed) {
      setShowInfoModal(true);
    } else {
      setView('create');
      setEditingCourse(null);
    }
  }

  function handleInfoDismiss() {
    localStorage.setItem('goya-courses-info-dismissed', 'true');
    setShowInfoModal(false);
    setView('create');
    setEditingCourse(null);
  }

  function handleEdit(course: Course) {
    setEditingCourse(course);
    setView('edit');
  }

  function handleCancel() {
    setView('list');
    setEditingCourse(null);
    setErrorMsg('');
  }

  async function handleSubmitForReview(courseId: string) {
    setBusy(true);
    const result = await submitCourseForReview(courseId);
    if (result.success) {
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: 'pending_review' as const } : c));
    } else {
      setErrorMsg(result.error ?? 'Failed to submit');
    }
    setBusy(false);
  }

  async function handleDelete(courseId: string) {
    setBusy(true);
    const result = await deleteMemberCourse(courseId);
    if (result.success) {
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setConfirmDeleteId(null);
    } else {
      setErrorMsg(result.error ?? 'Failed to delete');
    }
    setBusy(false);
  }

  async function handleFormSubmit(formData: FormValues, status: 'draft' | 'pending_review') {
    setBusy(true);
    setErrorMsg('');

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        level: formData.level,
        access: formData.access,
        instructor: formData.instructor,
        duration: formData.duration,
        short_description: formData.short_description,
        description: formData.description,
        vimeo_url: formData.vimeo_url,
        thumbnail_url: formData.thumbnail_url,
        gradient_from: formData.gradient_from,
        gradient_to: formData.gradient_to,
        status,
      };

      if (view === 'edit' && editingCourse) {
        const result = await updateMemberCourse(editingCourse.id, payload);
        if (!result.success) throw new Error(result.error ?? 'Update failed');
      } else {
        const result = await createMemberCourse(payload);
        if (!result.success) throw new Error(result.error ?? 'Create failed');
      }

      router.refresh();
      setView('list');
      setEditingCourse(null);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setBusy(false);
    }
  }

  // ── Info Modal ──────────────────────────────────────────────────────────────
  if (showInfoModal) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-[#1B3A5C] mb-3">Submit Courses to GOYA</h3>
            <p className="text-sm text-slate-600 mb-2">
              As a GOYA member, you can submit courses to our Academy.
              Workshops, dharma talks, yoga sequences, and research content are welcome.
            </p>
            <p className="text-sm text-slate-600 mb-6">
              All courses are reviewed before going live.
            </p>
            <button
              onClick={handleInfoDismiss}
              className="w-full px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
            >
              Got it, create my course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Create / Edit Form ──────────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">
          {view === 'edit' ? 'Edit Course' : 'Create New Course'}
        </h1>
        {errorMsg && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">
            {errorMsg}
          </div>
        )}
        <MemberCourseForm
          course={editingCourse ?? undefined}
          busy={busy}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (courses.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h2 className="text-lg font-semibold text-[#1B3A5C] mb-1">
            You haven&apos;t created any courses yet.
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Share your knowledge with the global GOYA community.
          </p>
          <button
            onClick={handleAddClick}
            className="px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
          >
            + Add New Course
          </button>
        </div>
      </div>
    );
  }

  // ── Courses List ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2 font-bold">x</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#1B3A5C]">My Courses</h1>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
        >
          + Add New Course
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm divide-y divide-[#F3F4F6]">
        {courses.map(course => (
          <div key={course.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#1B3A5C] truncate">{course.title}</h3>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[course.status] ?? 'bg-zinc-100 text-zinc-700'}`}>
                    {STATUS_LABEL[course.status] ?? course.status}
                  </span>
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {course.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {course.level && `${course.level} · `}
                  {course.duration ?? 'No duration set'}
                  {course.instructor && ` · ${course.instructor}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Draft: Edit, Delete, Submit for Review */}
                {course.status === 'draft' && (
                  <>
                    <button onClick={() => handleEdit(course)} className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleSubmitForReview(course.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60"
                    >
                      Submit for Review
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(course.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Pending Review: Delete only */}
                {course.status === 'pending_review' && (
                  <button
                    onClick={() => setConfirmDeleteId(course.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                {/* Published: View, Delete */}
                {course.status === 'published' && (
                  <>
                    <Link
                      href={`/academy/${course.id}`}
                      className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setConfirmDeleteId(course.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Rejected: Edit, Delete, Resubmit */}
                {course.status === 'rejected' && (
                  <>
                    <button onClick={() => handleEdit(course)} className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(course.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Rejection reason */}
            {course.status === 'rejected' && course.rejection_reason && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-700">
                  <span className="font-semibold">Rejection reason:</span> {course.rejection_reason}
                </p>
              </div>
            )}

            {/* Delete confirmation */}
            {confirmDeleteId === course.id && (
              <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700 flex-1">Are you sure you want to delete this course?</p>
                <button
                  onClick={() => handleDelete(course.id)}
                  disabled={busy}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {busy ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3 py-1 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Member Course Form ────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  category: string;
  level: string | null;
  access: string;
  instructor: string;
  duration: string;
  short_description: string;
  description: string;
  vimeo_url: string;
  thumbnail_url: string;
  gradient_from: string;
  gradient_to: string;
}

function MemberCourseForm({
  course,
  busy,
  onSubmit,
  onCancel,
}: {
  course?: Course;
  busy: boolean;
  onSubmit: (data: FormValues, status: 'draft' | 'pending_review') => void;
  onCancel: () => void;
}) {
  const isEdit = !!course;
  const isResubmit = course?.status === 'rejected';

  const [title, setTitle] = useState(course?.title ?? '');
  const [category, setCategory] = useState<CourseCategory>(course?.category ?? 'Workshop');
  const [level, setLevel] = useState<CourseLevel>(course?.level ?? 'All Levels');
  const [access, setAccess] = useState<CourseAccess>(course?.access ?? 'members_only');
  const [instructor, setInstructor] = useState(course?.instructor ?? '');
  const [duration, setDuration] = useState(course?.duration ?? '');
  const [shortDesc, setShortDesc] = useState(course?.short_description ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [vimeoUrl, setVimeoUrl] = useState(course?.vimeo_url ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(course?.thumbnail_url ?? '');
  const [gradientFrom, setGradientFrom] = useState(course?.gradient_from ?? '#0f766e');
  const [gradientTo, setGradientTo] = useState(course?.gradient_to ?? '#134e4a');

  function buildFormValues(): FormValues {
    return {
      title: title.trim(),
      category,
      level,
      access,
      instructor: instructor.trim(),
      duration: duration.trim(),
      short_description: shortDesc.trim(),
      description: description.trim(),
      vimeo_url: vimeoUrl.trim(),
      thumbnail_url: thumbnailUrl.trim(),
      gradient_from: gradientFrom,
      gradient_to: gradientTo,
    };
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
      <div className="space-y-6 max-w-3xl">

        {/* Title */}
        <div>
          <label className={LABEL}>Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={INPUT} placeholder="Course title" required />
        </div>

        {/* Category / Level / Access */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value as CourseCategory)} className={SELECT}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Level</label>
            <select value={level} onChange={e => setLevel(e.target.value as CourseLevel)} className={SELECT}>
              {LEVELS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Access *</label>
            <select value={access} onChange={e => setAccess(e.target.value as CourseAccess)} className={SELECT}>
              <option value="members_only">Members Only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* Instructor / Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Instructor</label>
            <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={INPUT} placeholder="Instructor name" />
          </div>
          <div>
            <label className={LABEL}>Duration</label>
            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className={INPUT} placeholder="e.g. 4h 30m" />
          </div>
        </div>

        {/* Short Description */}
        <div>
          <label className={LABEL}>Short Description <span className="normal-case text-[#9CA3AF] font-normal">(shown on card, ~150 chars)</span></label>
          <textarea
            value={shortDesc} onChange={e => setShortDesc(e.target.value)}
            rows={3} maxLength={200} className={`${INPUT} resize-y`}
            placeholder="Brief summary shown on the course card..."
          />
          <p className="text-xs text-[#9CA3AF] mt-1">{shortDesc.length}/200 characters</p>
        </div>

        {/* Full Description */}
        <div>
          <label className={LABEL}>Full Description</label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            rows={6} className={`${INPUT} resize-y`}
            placeholder="Full course description..."
          />
        </div>

        {/* Vimeo URL */}
        <div>
          <label className={LABEL}>Vimeo URL</label>
          <input
            type="url" value={vimeoUrl} onChange={e => setVimeoUrl(e.target.value)}
            className={INPUT} placeholder="https://vimeo.com/123456789"
          />
          <p className="text-xs text-[#9CA3AF] mt-1.5">
            Paste the full Vimeo video URL. The video must be publicly accessible or unlisted.
          </p>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className={LABEL}>Thumbnail URL <span className="normal-case text-[#9CA3AF] font-normal">(optional, used if no Vimeo)</span></label>
          <input
            type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
            className={INPUT} placeholder="https://example.com/thumbnail.jpg"
          />
        </div>

        {/* Card Gradient */}
        <div>
          <label className={LABEL}>Card Gradient</label>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6B7280]">From</label>
              <input
                type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-[#6B7280]">{gradientFrom}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#6B7280]">To</label>
              <input
                type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-[#6B7280]">{gradientTo}</span>
            </div>
          </div>
          {/* Live preview */}
          <div
            className="mt-3 h-14 rounded-xl border border-[#E5E7EB]"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => onSubmit(buildFormValues(), 'draft')}
            className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={busy || !title.trim()}
            onClick={() => onSubmit(buildFormValues(), 'pending_review')}
            className="px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving...' : isResubmit ? 'Resubmit for Review' : 'Submit for Review'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
