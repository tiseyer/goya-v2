'use client';

import { useState } from 'react';
import type { Lesson, LessonType, LessonFormData } from '@/lib/courses/lessons';
import { createLesson, updateLesson } from '@/app/admin/courses/lesson-actions';

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0] transition-colors';
const LABEL  = 'block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide';

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface LessonFormProps {
  courseId: string;
  lesson?: Lesson;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
}

export default function LessonForm({ courseId, lesson, onSave, onCancel }: LessonFormProps) {
  const isEdit = !!lesson;

  const [title,            setTitle]           = useState(lesson?.title             ?? '');
  const [type,             setType]            = useState<LessonType>(lesson?.type as LessonType ?? 'video');
  const [videoPlatform,    setVideoPlatform]   = useState<'vimeo' | 'youtube'>(lesson?.video_platform as 'vimeo' | 'youtube' ?? 'vimeo');
  const [videoUrl,         setVideoUrl]        = useState(lesson?.video_url         ?? '');
  const [audioUrl,         setAudioUrl]        = useState(lesson?.audio_url         ?? '');
  const [featuredImageUrl, setFeaturedImageUrl] = useState(lesson?.featured_image_url ?? '');
  const [shortDescription, setShortDescription] = useState(lesson?.short_description ?? '');
  const [description,      setDescription]     = useState(lesson?.description       ?? '');
  const [durationMinutes,  setDurationMinutes]  = useState(lesson?.duration_minutes  ?? 30);
  const [saving,           setSaving]          = useState(false);
  const [errorMsg,         setErrorMsg]        = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Title is required.');
      return;
    }

    setSaving(true);

    const formData: LessonFormData = {
      title: title.trim(),
      type,
      video_platform: type === 'video' ? videoPlatform : null,
      video_url:      type === 'video' ? (videoUrl.trim() || null) : null,
      audio_url:      type === 'audio' ? (audioUrl.trim() || null) : null,
      featured_image_url: type !== 'video' ? (featuredImageUrl.trim() || null) : null,
      short_description: shortDescription.trim() || null,
      description:       description.trim() || null,
      duration_minutes:  durationMinutes,
    };

    try {
      let result: { data: Lesson | null; error: string | null };

      if (isEdit) {
        result = await updateLesson(lesson.id, courseId, formData);
      } else {
        result = await createLesson(courseId, formData);
      }

      if (result.error || !result.data) {
        setErrorMsg(result.error ?? 'Failed to save lesson.');
        setSaving(false);
        return;
      }

      onSave(result.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-[#E5E7EB] pt-6 mt-4 space-y-6">
      <div>
        <h3 className="text-base font-semibold text-[#1B3A5C]">
          {isEdit ? 'Edit Lesson' : 'Add Lesson'}
        </h3>
        <p className="text-sm text-[#6B7280] mt-0.5">
          {isEdit ? `Editing: ${lesson.title}` : 'Fill in the details below'}
        </p>
      </div>

      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Title */}
        <div>
          <label className={LABEL}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={INPUT}
            placeholder="Lesson title"
          />
        </div>

        {/* Type selector — 3 visual cards */}
        <div>
          <label className={LABEL}>Lesson Type</label>
          <div className="flex gap-3">
            {([
              { value: 'video', emoji: '\uD83C\uDFAC', label: 'Video' },
              { value: 'audio', emoji: '\uD83C\uDFB5', label: 'Audio' },
              { value: 'text',  emoji: '\uD83D\uDCDD', label: 'Text'  },
            ] as const).map(({ value, emoji, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                  type === value
                    ? 'border-[#4E87A0] bg-[#4E87A0]/5 shadow-sm'
                    : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                <span className="text-2xl block mb-1">{emoji}</span>
                <span className="text-sm font-semibold text-[#374151]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* VIDEO-specific fields */}
        {type === 'video' && (
          <div className="space-y-4">
            {/* Platform toggle */}
            <div>
              <label className={LABEL}>Platform</label>
              <div className="flex rounded-lg overflow-hidden border border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setVideoPlatform('vimeo')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    videoPlatform === 'vimeo'
                      ? 'bg-[#4E87A0] text-white'
                      : 'bg-white text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  Vimeo
                </button>
                <button
                  type="button"
                  onClick={() => setVideoPlatform('youtube')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    videoPlatform === 'youtube'
                      ? 'bg-[#4E87A0] text-white'
                      : 'bg-white text-[#374151] hover:bg-gray-50'
                  }`}
                >
                  YouTube
                </button>
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className={LABEL}>Video URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className={INPUT}
                placeholder={videoPlatform === 'vimeo' ? 'https://vimeo.com/...' : 'https://youtube.com/...'}
              />
            </div>
          </div>
        )}

        {/* AUDIO-specific fields */}
        {type === 'audio' && (
          <div className="space-y-4">
            <div>
              <label className={LABEL}>Audio URL</label>
              <input
                type="url"
                value={audioUrl}
                onChange={e => setAudioUrl(e.target.value)}
                className={INPUT}
                placeholder="https://example.com/audio.mp3"
              />
            </div>
            <div>
              <label className={LABEL}>
                Featured Image URL <span className="normal-case font-normal text-[#9CA3AF]">(optional)</span>
              </label>
              <input
                type="url"
                value={featuredImageUrl}
                onChange={e => setFeaturedImageUrl(e.target.value)}
                className={INPUT}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}

        {/* TEXT-specific fields */}
        {type === 'text' && (
          <div>
            <label className={LABEL}>
              Featured Image URL <span className="normal-case font-normal text-[#9CA3AF]">(optional)</span>
            </label>
            <input
              type="url"
              value={featuredImageUrl}
              onChange={e => setFeaturedImageUrl(e.target.value)}
              className={INPUT}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {/* Short description — all types */}
        <div>
          <label className={LABEL}>
            Short Description <span className="normal-case font-normal text-[#9CA3AF]">(shown on card, ~150 chars)</span>
          </label>
          <textarea
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
            rows={3}
            maxLength={200}
            className={`${INPUT} resize-y min-h-[72px]`}
            placeholder="Brief summary…"
          />
          <p className="text-xs text-[#9CA3AF] mt-1">{shortDescription.length}/200 characters</p>
        </div>

        {/* Full description — all types (larger for text) */}
        <div>
          <label className={LABEL}>Full Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={type === 'text' ? 8 : 6}
            className={`${INPUT} resize-y min-h-[80px]`}
            placeholder="Full lesson description…"
          />
        </div>

        {/* Duration slider — all types */}
        <div>
          <label className={LABEL}>
            Duration <span className="normal-case font-normal text-[#9CA3AF]">{formatDuration(durationMinutes)}</span>
          </label>
          <input
            type="range"
            min={1}
            max={180}
            step={1}
            value={durationMinutes}
            onChange={e => setDurationMinutes(Number(e.target.value))}
            className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4E87A0] [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5"
          />
          <div className="flex justify-between text-xs text-[#9CA3AF] mt-1">
            <span>1m</span>
            <span>3h</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-60 shadow-sm"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Lesson'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-[#6B7280] text-sm font-medium hover:text-[#374151] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
