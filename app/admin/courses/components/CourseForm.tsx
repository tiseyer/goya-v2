'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/types';
import type { CourseCategory as CourseCategoryRow } from '@/lib/courses/categories';
import { logAdminCourseAction } from '@/app/admin/courses/actions';
import OrganizerPicker from '@/app/components/OrganizerPicker';
import InstructorPicker from '@/app/components/InstructorPicker';
import AttendeePicker from './AttendeePicker';

const LEVELS   = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const;
const STATUSES = ['published', 'draft'] as const;

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-goya-border text-sm text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors';
const LABEL  = 'block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

interface Props {
  course?: Course;
  categories: CourseCategoryRow[];
  userRole?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string | null;
}

function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-goya-border shadow-soft p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-primary-dark">{title}</h3>
        {description && <p className="text-xs text-foreground-secondary mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function CourseForm({ course, categories, userRole, currentUserId, currentUserName, currentUserAvatar }: Props) {
  const router = useRouter();
  const isEdit = !!course;

  const [title,          setTitle]         = useState(course?.title            ?? '');
  const [categoryId,     setCategoryId]    = useState(course?.category_id      ?? '');
  const [level,          setLevel]         = useState(course?.level            ?? 'All Levels');
  const [access,         setAccess]        = useState(course?.access           ?? 'members_only');
  const [status,         setStatus]        = useState(course?.status           ?? 'published');
  const [durationMinutes, setDurationMinutes] = useState(course?.duration_minutes ?? 60);
  const [shortDesc,      setShortDesc]     = useState(course?.short_description ?? '');
  const [description,    setDescription]  = useState(course?.description      ?? '');
  const [thumbnailUrl,   setThumbnailUrl]  = useState(course?.thumbnail_url    ?? '');
  const [gradientFrom,   setGradientFrom]  = useState(course?.gradient_from    ?? '#0f766e');
  const [gradientTo,     setGradientTo]    = useState(course?.gradient_to      ?? '#134e4a');

  // Instructor state — profile-based join table
  const [instructorIds,  setInstructorIds]  = useState<string[]>([]);
  const [showInstructors, setShowInstructors] = useState(course?.show_instructors ?? true);

  // Organizer state — stored IDs exclude the current user (added in payload)
  const [organizerIds,   setOrganizerIds]   = useState<string[]>(
    () => (course?.organizer_ids ?? []).filter(id => id !== currentUserId)
  );
  const [showOrganizers, setShowOrganizers] = useState(course?.show_organizers ?? true);
  const [showAttendees,  setShowAttendees]  = useState(course?.show_attendees  ?? false);

  const [saving,   setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load existing instructor IDs from join table on edit
  useEffect(() => {
    if (!course?.id) return;
    supabase.from('course_instructors').select('profile_id').eq('course_id', course.id)
      .then(({ data }) => { if (data) setInstructorIds(data.map(r => r.profile_id)); });
  }, [course?.id]);

  const selectedCategory = categories.find(c => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Record<string, unknown> = {
        title:             title.trim(),
        category_id:       categoryId || null,
        level:             level || null,
        access,
        status,
        duration_minutes:  durationMinutes,
        short_description: shortDesc.trim()    || null,
        description:       description.trim()  || null,
        thumbnail_url:     thumbnailUrl.trim() || null,
        gradient_from:     gradientFrom,
        gradient_to:       gradientTo,
        show_organizers:   showOrganizers,
        show_instructors:  showInstructors,
        show_attendees:    showAttendees,
        organizer_ids: currentUserId
          ? [currentUserId, ...organizerIds].filter(Boolean)
          : organizerIds,
      };

      if (isEdit) {
        // Build changes object for audit log
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, newVal] of Object.entries(payload)) {
          const oldVal = course[key as keyof Course];
          if (oldVal !== newVal) {
            changes[key] = { old: oldVal, new: newVal };
          }
        }

        const { error } = await supabase.from('courses').update(payload).eq('id', course.id);
        if (error) throw new Error(error.message);

        // Sync course_instructors join table
        await supabase.from('course_instructors').delete().eq('course_id', course.id);
        if (instructorIds.length > 0) {
          await supabase.from('course_instructors').insert(
            instructorIds.map(pid => ({ course_id: course.id, profile_id: pid }))
          );
        }

        if (Object.keys(changes).length > 0) {
          await logAdminCourseAction(course.id, 'edited', changes);
        }

        setSuccessMsg('Course saved successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        // Auto-set course_type for admin-created courses
        payload.course_type = 'goya';

        const { data: inserted, error } = await supabase
          .from('courses')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        if (inserted) {
          // Sync course_instructors join table for new course
          if (instructorIds.length > 0) {
            await supabase.from('course_instructors').insert(
              instructorIds.map(pid => ({ course_id: inserted.id, profile_id: pid }))
            );
          }
          await logAdminCourseAction(inserted.id, 'created', payload);
          router.push(`/admin/courses/${inserted.id}/edit?tab=lessons`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
          {successMsg}
        </div>
      )}

      {/* ── Basic Info ─────────────────────────────────────────────────── */}
      <FormSection title="Basic Info" description="Core course details">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className={LABEL}>Title *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              className={INPUT} placeholder="Course title" required
            />
          </div>

          {/* Category + Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Category</label>
              <div className="relative">
                {selectedCategory && (
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full flex-shrink-0 z-10 pointer-events-none"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className={`${SELECT} ${selectedCategory ? 'pl-8' : ''}`}
                >
                  <option value="">Select a category…</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={LABEL}>Level</label>
              <select value={level} onChange={e => setLevel(e.target.value as typeof level)} className={SELECT}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Access */}
          <div>
            <label className={LABEL}>Access *</label>
            <select value={access} onChange={e => setAccess(e.target.value as typeof access)} className={SELECT}>
              <option value="members_only">Members Only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>
      </FormSection>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <FormSection title="Content" description="Descriptions and visual appearance">
        <div className="space-y-4">
          {/* Short Description */}
          <div>
            <label className={LABEL}>
              Short Description{' '}
              <span className="normal-case text-foreground-secondary font-normal">(shown on card, ~150 chars)</span>
            </label>
            <textarea
              value={shortDesc} onChange={e => setShortDesc(e.target.value)}
              rows={3} maxLength={200} className={`${INPUT} resize-y min-h-[80px]`}
              placeholder="Brief summary shown on the course card…"
            />
            <p className="text-xs text-foreground-secondary mt-1">{shortDesc.length}/200 characters</p>
          </div>

          {/* Full Description */}
          <div>
            <label className={LABEL}>
              Full Description{' '}
              <span className="normal-case text-foreground-secondary font-normal">(shown on course detail page)</span>
            </label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              rows={6} className={`${INPUT} resize-y min-h-[80px]`}
              placeholder="Full course description…"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className={LABEL}>Thumbnail URL <span className="normal-case text-foreground-secondary font-normal">(optional)</span></label>
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
                <label className="text-xs text-foreground-secondary">From</label>
                <input
                  type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-goya-border cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-foreground-secondary">{gradientFrom}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-foreground-secondary">To</label>
                <input
                  type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-goya-border cursor-pointer p-0.5 bg-white"
                />
                <span className="text-xs font-mono text-foreground-secondary">{gradientTo}</span>
              </div>
            </div>
            {/* Live preview */}
            <div
              className="mt-3 h-14 rounded-xl border border-goya-border"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
            />
          </div>
        </div>
      </FormSection>

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <FormSection title="Settings" description="Publishing and duration">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Status *</label>
              <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className={SELECT}>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>
                Duration{' '}
                <span className="normal-case text-foreground-secondary font-normal">{formatDuration(durationMinutes)}</span>
              </label>
              <input
                type="range"
                min={5} max={600} step={5}
                value={durationMinutes}
                onChange={e => setDurationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"
              />
              <div className="flex justify-between text-xs text-foreground-secondary mt-1">
                <span>5m</span>
                <span>10h</span>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Instructors ─────────────────────────────────────────────────── */}
      <FormSection title="Instructors" description="Add up to 5 instructors for this course. These are the people visible in the content.">
        <InstructorPicker
          value={instructorIds}
          onChange={setInstructorIds}
          currentUserRole={userRole ?? 'admin'}
          currentUserId={currentUserId ?? ''}
        />
        <p className="text-xs text-foreground-tertiary mt-2">Only teachers, wellness practitioners, and school owners can be added.</p>
        <label className="flex items-center gap-2 cursor-pointer mt-3">
          <input
            type="checkbox"
            checked={!showInstructors}
            onChange={e => setShowInstructors(!e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-xs text-foreground-secondary">Don&apos;t show instructors on course page</span>
        </label>
      </FormSection>

      {/* ── Organizers ──────────────────────────────────────────────────── */}
      {currentUserId && currentUserName && (
        <FormSection title="Organizers" description="Add up to 5 co-organizers for this course. These are the people who can edit it.">
          <OrganizerPicker
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserRole={userRole ?? 'admin'}
            value={organizerIds}
            onChange={setOrganizerIds}
          />
          <p className="text-xs text-foreground-tertiary mt-2">Only teachers, wellness practitioners, and school owners can be added.</p>
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={!showOrganizers}
              onChange={e => setShowOrganizers(!e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-foreground-secondary">Don&apos;t show organizers on course page</span>
          </label>
        </FormSection>
      )}

      {/* ── Attendees (edit mode only) ─────────────────────────────────── */}
      {isEdit && course?.id && (
        <FormSection title="Attendees" description="Members who are enrolled in this course.">
          <AttendeePicker
            courseId={course.id}
            unlimitedSpots={true}
            spotsTotal={null}
            currentUserRole={userRole ?? 'admin'}
            currentUserId={currentUserId ?? ''}
          />
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              type="checkbox"
              checked={showAttendees}
              onChange={e => setShowAttendees(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-xs text-foreground-secondary">Show attendees on course page</span>
          </label>
        </FormSection>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={saving}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
        </button>
        <Link
          href="/admin/courses"
          className="px-6 py-2.5 border border-goya-border text-foreground-secondary text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
        {isEdit && course?.id && (
          <a
            href={`/academy/${course.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-goya-border text-foreground-secondary text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors ml-auto"
          >
            View Course
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

    </form>
  );
}
