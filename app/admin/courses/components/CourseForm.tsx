'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/types';
import type { CourseCategory as CourseCategoryRow } from '@/lib/courses/categories';
import { logAdminCourseAction } from '@/app/admin/courses/actions';

const LEVELS   = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const;
const STATUSES = ['published', 'draft'] as const;

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0] transition-colors';
const LABEL  = 'block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

interface Props {
  course?: Course;
  categories: CourseCategoryRow[];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function CourseForm({ course, categories }: Props) {
  const router = useRouter();
  const isEdit = !!course;

  const [title,          setTitle]         = useState(course?.title            ?? '');
  const [categoryId,     setCategoryId]    = useState(course?.category_id      ?? '');
  const [level,          setLevel]         = useState(course?.level            ?? 'All Levels');
  const [access,         setAccess]        = useState(course?.access           ?? 'members_only');
  const [status,         setStatus]        = useState(course?.status           ?? 'published');
  const [instructor,     setInstructor]    = useState(course?.instructor       ?? '');
  const [durationMinutes, setDurationMinutes] = useState(course?.duration_minutes ?? 60);
  const [shortDesc,      setShortDesc]     = useState(course?.short_description ?? '');
  const [description,    setDescription]  = useState(course?.description      ?? '');
  const [thumbnailUrl,   setThumbnailUrl]  = useState(course?.thumbnail_url    ?? '');
  const [gradientFrom,   setGradientFrom]  = useState(course?.gradient_from    ?? '#0f766e');
  const [gradientTo,     setGradientTo]    = useState(course?.gradient_to      ?? '#134e4a');

  const [saving,   setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCategory = categories.find(c => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload: Record<string, unknown> = {
        title:             title.trim(),
        category_id:       categoryId || null,
        level:             level || null,
        access,
        status,
        instructor:        instructor.trim() || null,
        duration_minutes:  durationMinutes,
        short_description: shortDesc.trim()   || null,
        description:       description.trim() || null,
        thumbnail_url:     thumbnailUrl.trim() || null,
        gradient_from:     gradientFrom,
        gradient_to:       gradientTo,
      };

      if (isEdit) {
        // Build changes object for audit log (compare old vs new)
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        for (const [key, newVal] of Object.entries(payload)) {
          const oldVal = course[key as keyof Course];
          if (oldVal !== newVal) {
            changes[key] = { old: oldVal, new: newVal };
          }
        }

        const { error } = await supabase.from('courses').update(payload).eq('id', course.id);
        if (error) throw new Error(error.message);

        if (Object.keys(changes).length > 0) {
          await logAdminCourseAction(course.id, 'edited', changes);
        }

        router.push('/admin/courses');
        router.refresh();
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
          await logAdminCourseAction(inserted.id, 'created', payload);
          router.push(`/admin/courses/${inserted.id}/edit?tab=lessons`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <div className="border border-border rounded-xl p-4 sm:p-6 space-y-4 bg-card transition-all duration-200">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Basic Info</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Core course details</p>
        </div>

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

        {/* Access + Instructor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Access *</label>
            <select value={access} onChange={e => setAccess(e.target.value as typeof access)} className={SELECT}>
              <option value="members_only">Members Only</option>
              <option value="free">Free</option>
            </select>
          </div>
          <div>
            <label className={LABEL}>Instructor</label>
            <input
              type="text" value={instructor} onChange={e => setInstructor(e.target.value)}
              className={INPUT} placeholder="Instructor name"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Content */}
      <div className="border border-border rounded-xl p-4 sm:p-6 space-y-4 bg-card transition-all duration-200">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Content</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Descriptions and visual appearance</p>
        </div>

        {/* Short Description */}
        <div>
          <label className={LABEL}>
            Short Description{' '}
            <span className="normal-case text-muted-foreground font-normal">(shown on card, ~150 chars)</span>
          </label>
          <textarea
            value={shortDesc} onChange={e => setShortDesc(e.target.value)}
            rows={3} maxLength={200} className={`${INPUT} resize-y min-h-[80px]`}
            placeholder="Brief summary shown on the course card…"
          />
          <p className="text-xs text-muted-foreground mt-1">{shortDesc.length}/200 characters</p>
        </div>

        {/* Full Description */}
        <div>
          <label className={LABEL}>
            Full Description{' '}
            <span className="normal-case text-muted-foreground font-normal">(shown on course detail page)</span>
          </label>
          <textarea
            value={description} onChange={e => setDescription(e.target.value)}
            rows={6} className={`${INPUT} resize-y min-h-[80px]`}
            placeholder="Full course description…"
          />
        </div>

        {/* Thumbnail URL */}
        <div>
          <label className={LABEL}>Thumbnail URL <span className="normal-case text-muted-foreground font-normal">(optional)</span></label>
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
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="color" value={gradientFrom} onChange={e => setGradientFrom(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-muted-foreground">{gradientFrom}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="color" value={gradientTo} onChange={e => setGradientTo(e.target.value)}
                className="w-10 h-10 rounded-lg border border-[#E5E7EB] cursor-pointer p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-muted-foreground">{gradientTo}</span>
            </div>
          </div>
          {/* Live preview */}
          <div
            className="mt-3 h-14 rounded-xl border border-[#E5E7EB]"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
          />
        </div>
      </div>

      {/* Section 3: Settings */}
      <div className="border border-border rounded-xl p-4 sm:p-6 space-y-4 bg-card transition-all duration-200">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Publishing and duration</p>
        </div>

        {/* Status + Duration */}
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
              <span className="normal-case text-muted-foreground font-normal">{formatDuration(durationMinutes)}</span>
            </label>
            <input
              type="range"
              min={5} max={600} step={5}
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#4E87A0] [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>5m</span>
              <span>10h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4">
        <button
          type="submit" disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-60 shadow-sm"
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
        </button>
        <Link
          href="/admin/courses"
          className="px-6 py-2.5 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
      </div>

    </form>
  );
}
