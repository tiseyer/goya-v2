'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/lib/types';

const CATEGORIES = ['Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research'] as const;
const FORMATS    = ['Online', 'In Person', 'Hybrid'] as const;
const STATUSES   = ['published', 'draft', 'cancelled'] as const;

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#374151] bg-white focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0] transition-colors';
const LABEL  = 'block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

interface Props {
  event?: Event;
}

export default function EventForm({ event }: Props) {
  const router  = useRouter();
  const isEdit  = !!event;

  const [title,     setTitle]     = useState(event?.title     ?? '');
  const [category,  setCategory]  = useState(event?.category  ?? 'Workshop');
  const [format,    setFormat]    = useState(event?.format    ?? 'Online');
  const [status,    setStatus]    = useState(event?.status    ?? 'published');
  const [date,      setDate]      = useState(event?.date      ?? '');
  const [timeStart, setTimeStart] = useState(event?.time_start?.slice(0,5) ?? '');
  const [timeEnd,   setTimeEnd]   = useState(event?.time_end?.slice(0,5)   ?? '');
  const [instructor,setInstructor]= useState(event?.instructor ?? '');
  const [location,  setLocation]  = useState(event?.location  ?? '');
  const [description,setDesc]     = useState(event?.description ?? '');
  const [price,     setPrice]     = useState(String(event?.price ?? '0'));
  const [isFree,    setIsFree]    = useState(event?.is_free   ?? false);
  const [spotsTotal,setSpotsTotal]= useState(String(event?.spots_total ?? ''));
  const [spotsRem,  setSpotsRem]  = useState(String(event?.spots_remaining ?? ''));

  // Image state
  const [currentImageUrl, setCurrentImageUrl] = useState(event?.featured_image_url ?? null);
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]    = useState<string | null>(null);
  const [removeImage,     setRemoveImage]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving,  setSaving]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setRemoveImage(true);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');

    try {
      let imageUrl: string | null = currentImageUrl;

      // Remove image if requested
      if (removeImage && currentImageUrl) {
        const parts = currentImageUrl.split('/event-images/');
        if (parts[1]) {
          await supabase.storage.from('event-images').remove([parts[1]]);
        }
        imageUrl = null;
      }

      // Upload new image if selected
      if (imageFile) {
        const ext  = imageFile.name.split('.').pop() ?? 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('event-images')
          .upload(path, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
        const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const payload = {
        title:              title.trim(),
        category,
        format,
        status,
        date,
        time_start:         timeStart,
        time_end:           timeEnd,
        instructor:         instructor.trim() || null,
        location:           location.trim()   || null,
        description:        description.trim() || null,
        price:              isFree ? 0 : parseFloat(price) || 0,
        is_free:            isFree,
        spots_total:        spotsTotal ? parseInt(spotsTotal, 10) : null,
        spots_remaining:    spotsRem   ? parseInt(spotsRem, 10)   : null,
        featured_image_url: imageUrl,
      };

      if (isEdit) {
        const { error } = await supabase.from('events').update(payload).eq('id', event.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw new Error(error.message);
      }

      router.push('/admin/events');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setSaving(false);
    }
  }

  const displayImage = imagePreview ?? (removeImage ? null : currentImageUrl);

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
          className={INPUT} placeholder="Event title" required
        />
      </div>

      {/* Category / Format / Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value as typeof category)} className={SELECT}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Format *</label>
          <select value={format} onChange={e => setFormat(e.target.value as typeof format)} className={SELECT}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Status *</label>
          <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className={SELECT}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>

      {/* Date / Start / End */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT} required />
        </div>
        <div>
          <label className={LABEL}>Start Time *</label>
          <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className={INPUT} required />
        </div>
        <div>
          <label className={LABEL}>End Time *</label>
          <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className={INPUT} required />
        </div>
      </div>

      {/* Instructor / Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Instructor</label>
          <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={INPUT} placeholder="Instructor name" />
        </div>
        <div>
          <label className={LABEL}>Location</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={INPUT} placeholder="e.g. Online via Zoom or City, Country" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={LABEL}>Description</label>
        <textarea
          value={description} onChange={e => setDesc(e.target.value)}
          rows={5} className={`${INPUT} resize-y`}
          placeholder="Describe the event…"
        />
      </div>

      {/* Price */}
      <div className="space-y-2">
        <label className={LABEL}>Price</label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)}
              className="w-4 h-4 rounded accent-[#4E87A0]"
            />
            <span className="text-sm text-[#374151]">This event is free</span>
          </label>
        </div>
        {!isFree && (
          <div className="relative max-w-[180px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">$</span>
            <input
              type="number" min="0" step="0.01" value={price}
              onChange={e => setPrice(e.target.value)}
              className={`${INPUT} pl-7`} placeholder="0.00"
            />
          </div>
        )}
      </div>

      {/* Spots */}
      <div className="grid grid-cols-2 gap-4 max-w-xs">
        <div>
          <label className={LABEL}>Total Spots</label>
          <input
            type="number" min="0" value={spotsTotal}
            onChange={e => setSpotsTotal(e.target.value)}
            className={INPUT} placeholder="—"
          />
        </div>
        <div>
          <label className={LABEL}>Spots Remaining</label>
          <input
            type="number" min="0" value={spotsRem}
            onChange={e => setSpotsRem(e.target.value)}
            className={INPUT} placeholder="—"
          />
        </div>
      </div>

      {/* Featured Image */}
      <div>
        <label className={LABEL}>Featured Image</label>

        {displayImage ? (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={displayImage} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-[#E5E7EB]" />
            <button
              type="button" onClick={handleRemoveImage}
              className="mt-2 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-8 text-center cursor-pointer hover:border-[#4E87A0] hover:bg-[#4E87A0]/5 transition-colors"
          >
            <svg className="w-8 h-8 text-[#9CA3AF] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-[#6B7280]">Click to upload an image</p>
            <p className="text-xs text-[#9CA3AF] mt-1">JPEG, PNG, WebP — max 5 MB</p>
          </div>
        )}

        <input
          ref={fileRef} type="file" accept="image/*"
          onChange={handleFileChange} className="hidden"
        />

        {!displayImage && (
          <button
            type="button" onClick={() => fileRef.current?.click()}
            className="mt-2 text-xs text-[#4E87A0] hover:underline font-semibold"
          >
            Browse files
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-[#E5E7EB]">
        <button
          type="submit" disabled={saving}
          className="px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Event'}
        </button>
        <Link
          href="/admin/events"
          className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

    </form>
  );
}
