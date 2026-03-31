'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Course } from '@/lib/types';
import { logAdminCourseAction } from '@/app/admin/courses/actions';

const CATEGORIES = ['Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research'] as const;
const LEVELS     = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'] as const;
const STATUSES   = ['published', 'draft'] as const;

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0] transition-colors';
const LABEL  = 'block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

interface Props {
  course?: Course;
}

export default function CourseForm({ course }: Props) {
  const router = useRouter();
  const isEdit = !!course;

  const [title,            setTitle]           = useState(course?.title            ?? '');
  const [category,         setCategory]        = useState(course?.category         ?? 'Workshop');
  const [level,            setLevel]           = useState(course?.level            ?? 'All Levels');
  const [access,           setAccess]          = useState(course?.access           ?? 'members_only');
  const [status,           setStatus]          = useState(course?.status           ?? 'published');
  const [instructor,       setInstructor]      = useState(course?.instructor       ?? '');
  const [duration,         setDuration]        = useState(course?.duration         ?? '');
  const [shortDesc,        setShortDesc]       = useState(course?.short_description ?? '');
  const [description,      setDescription]    = useState(course?.description      ?? '');
  const [vimeoUrl,         setVimeoUrl]        = useState(course?.vimeo_url        ?? '');
  const [thumbnailUrl,     setThumbnailUrl]    = useState(course?.thumbnail_url    ?? '');
  const [gradientFrom,     setGradientFrom]    = useState(course?.gradient_from    ?? '#0f766e');
  const [gradientTo,       setGradientTo]      = useState(course?.gradient_to      ?? '#134e4a');

  const [saving,   setSaving]   = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        title:             title.trim(),
        category,
        level:             level || null,
        access,
        status,
        instructor:        instructor.trim()  || null,
        duration:          duration.trim()    || null,
        short_description: shortDesc.trim()   || null,
        description:       description.trim() || null,
        vimeo_url:         vimeoUrl.trim()    || null,
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
      } else {
        const { data: inserted, error } = await supabase.from('courses').insert(payload).select('id').single();
        if (error) throw new Error(error.message);
        if (inserted) {
          await logAdminCourseAction(inserted.id, 'created', payload);
        }
      }

      router.push('/admin/courses');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
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

      {/* Title */}
      <div>
        <label className={LABEL}>Title *</label>
        <input
          type="text" value={title} onChange={e => setTitle(e.target.value)}
          className={INPUT} placeholder="Course title" required
        />
      </div>

      {/* Category / Level / Access / Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value as typeof category)} className={SELECT}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Level</label>
          <select value={level} onChange={e => setLevel(e.target.value as typeof level)} className={SELECT}>
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Access *</label>
          <select value={access} onChange={e => setAccess(e.target.value as typeof access)} className={SELECT}>
            <option value="members_only">Members Only</option>
            <option value="free">Free</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Status *</label>
          <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className={SELECT}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
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
          placeholder="Brief summary shown on the course card…"
        />
        <p className="text-xs text-[#9CA3AF] mt-1">{shortDesc.length}/200 characters</p>
      </div>

      {/* Full Description */}
      <div>
        <label className={LABEL}>Full Description <span className="normal-case text-[#9CA3AF] font-normal">(shown on course detail page)</span></label>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          rows={6} className={`${INPUT} resize-y`}
          placeholder="Full course description…"
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
      <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
        <button
          type="submit" disabled={saving}
          className="px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Course'}
        </button>
        <Link
          href="/admin/courses"
          className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

    </form>
  );
}
