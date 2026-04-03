'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import type { Event, EventStatus } from '@/lib/types';
import { logAdminEventAction } from '@/app/admin/events/actions';
import { registerMediaItemAction } from '@/app/actions/media';
import OrganizerPicker from '@/app/components/OrganizerPicker';

const GooglePlacesAutocomplete = dynamic(() => import('@/app/components/GooglePlacesAutocomplete'), { ssr: false });

const CATEGORIES = ['Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research'] as const;
const FORMATS    = ['Online', 'In Person', 'Hybrid'] as const;

const INPUT  = 'w-full px-3 py-2.5 rounded-lg border border-goya-border text-sm text-foreground bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors';
const LABEL  = 'block text-xs font-semibold text-foreground mb-1.5 uppercase tracking-wide';
const SELECT = `${INPUT} cursor-pointer`;

/* ── Inline helper components ─────────────────────────────────────────────── */

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

function AnimatedField({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-all duration-200 ease-in-out ${show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */

interface Props {
  event?: Event;
  userRole?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string | null;
}

export default function EventForm({ event, userRole, currentUserId, currentUserName, currentUserAvatar }: Props) {
  const router  = useRouter();
  const isEdit  = !!event;

  const [title,     setTitle]     = useState(event?.title     ?? '');
  const [category,  setCategory]  = useState(event?.category  ?? 'Workshop');
  const [format,    setFormat]    = useState(event?.format    ?? 'Online');
  const [status,    setStatus]    = useState<EventStatus>(event?.status    ?? 'published');
  const [date,      setDate]      = useState(event?.date      ?? '');
  const [endDate,   setEndDate]   = useState(event?.end_date  ?? '');
  const [allDay,    setAllDay]    = useState(event?.all_day   ?? false);
  const [timeStart, setTimeStart] = useState(event?.time_start?.slice(0,5) ?? '');
  const [timeEnd,   setTimeEnd]   = useState(event?.time_end?.slice(0,5)   ?? '');
  const [instructor,setInstructor]= useState(event?.instructor ?? '');
  const [location,  setLocation]  = useState(event?.location  ?? '');
  const [locationLat, setLocationLat] = useState<number | null>(event?.location_lat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(event?.location_lng ?? null);
  const [onlinePlatformName, setOnlinePlatformName] = useState(event?.online_platform_name ?? '');
  const [onlinePlatformUrl, setOnlinePlatformUrl] = useState(event?.online_platform_url ?? '');
  const [description,setDesc]     = useState(event?.description ?? '');
  const [price,     setPrice]     = useState(String(event?.price ?? '0'));
  const [isFree,    setIsFree]    = useState(event?.is_free   ?? false);
  const [spotsTotal,setSpotsTotal]= useState(String(event?.spots_total ?? ''));
  const [spotsRem,  setSpotsRem]  = useState(String(event?.spots_remaining ?? ''));
  const [registrationRequired, setRegistrationRequired] = useState(event?.registration_required ?? false);
  const [websiteUrl, setWebsiteUrl] = useState(event?.website_url ?? '');

  // Organizer state — stored IDs exclude the current user (added in payload)
  const [organizerIds, setOrganizerIds] = useState<string[]>(
    () => (event?.organizer_ids ?? []).filter(id => id !== currentUserId)
  );

  // Image state
  const [currentImageUrl, setCurrentImageUrl] = useState(event?.featured_image_url ?? null);
  const [imageFile,       setImageFile]       = useState<File | null>(null);
  const [imagePreview,    setImagePreview]    = useState<string | null>(null);
  const [removeImage,     setRemoveImage]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving,  setSaving]  = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /* ── Role-aware status options ─────────────────────────────────────────── */
  const statusOptions = useMemo(() => {
    if (userRole === 'admin' || userRole === 'moderator' || !userRole) {
      return [
        { value: 'published', label: 'Published' },
        { value: 'draft', label: 'Draft' },
        { value: 'cancelled', label: 'Cancelled' },
      ];
    }
    // Member creating
    if (!event) {
      return [
        { value: 'draft', label: 'Draft' },
        { value: 'pending_review', label: 'Pending Review' },
      ];
    }
    // Member editing — show current status + available transitions
    const current = event.status;
    if (current === 'draft') return [
      { value: 'draft', label: 'Draft' },
      { value: 'pending_review', label: 'Pending Review' },
    ];
    if (current === 'rejected') return [
      { value: 'draft', label: 'Draft' },
      { value: 'pending_review', label: 'Resubmit for Review' },
    ];
    // pending_review or published — read-only
    return [{ value: current, label: current === 'pending_review' ? 'Pending Review' : current.charAt(0).toUpperCase() + current.slice(1) }];
  }, [userRole, event]);

  /* ── Image handlers ────────────────────────────────────────────────────── */

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

  /* ── Place selection handler ────────────────────────────────────────────── */
  const handlePlaceSelect = useCallback((place: { name: string; lat: number; lng: number }) => {
    setLocation(place.name);
    setLocationLat(place.lat);
    setLocationLng(place.lng);
  }, []);

  /* ── Submit handler ──────────────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

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
        // Fire-and-forget — non-critical, do not block UX on failure
        const { data: { user } } = await supabase.auth.getUser();
        registerMediaItemAction({
          bucket: 'event-images',
          fileName: imageFile.name,
          filePath: path,
          fileUrl: imageUrl,
          fileType: imageFile.type,
          fileSize: imageFile.size,
          uploadedBy: user?.id ?? '',
        }).catch(console.error);
      }

      const payload = {
        title:              title.trim(),
        category,
        format,
        status,
        date,
        end_date:           endDate || null,
        all_day:            allDay,
        time_start:         allDay ? null : timeStart,
        time_end:           allDay ? null : timeEnd,
        instructor:         instructor.trim() || null,
        location:           location.trim()   || null,
        location_lat:       format !== 'Online' ? locationLat : null,
        location_lng:       format !== 'Online' ? locationLng : null,
        online_platform_name: format === 'Online' || format === 'Hybrid' ? onlinePlatformName.trim() || null : null,
        online_platform_url:  format === 'Online' || format === 'Hybrid' ? onlinePlatformUrl.trim() || null : null,
        description:        description.trim() || null,
        price:              isFree ? 0 : parseFloat(price) || 0,
        is_free:            isFree,
        registration_required: registrationRequired,
        spots_total:        spotsTotal ? parseInt(spotsTotal, 10) : null,
        spots_remaining:    spotsRem   ? parseInt(spotsRem, 10)   : null,
        website_url:        websiteUrl.trim() || null,
        featured_image_url: imageUrl,
        organizer_ids: currentUserId
          ? [currentUserId, ...organizerIds].filter(Boolean)
          : organizerIds,
      };

      if (isEdit) {
        const { error } = await supabase.from('events').update(payload).eq('id', event.id);
        if (error) throw new Error(error.message);
        await logAdminEventAction(event.id, 'edited', { title: payload.title, status: payload.status });
        setSuccessMsg('Event saved successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        const { data: inserted, error } = await supabase.from('events').insert(payload).select('id').single();
        if (error) throw new Error(error.message);
        if (inserted) {
          await logAdminEventAction(inserted.id, 'created', { title: payload.title, status: payload.status });
        }
        router.push('/admin/events');
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  const displayImage = imagePreview ?? (removeImage ? null : currentImageUrl);

  /* ── Render ────────────────────────────────────────────────────────────── */

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

      {/* ── Basic Info ──────────────────────────────────────────────────── */}
      <FormSection title="Basic Info" description="Event name, type, and visibility status.">
        <div className="space-y-4">
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
              <select
                value={status}
                onChange={e => setStatus(e.target.value as EventStatus)}
                className={SELECT}
                disabled={statusOptions.length === 1}
              >
                {statusOptions.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </FormSection>

      {/* ── Schedule ────────────────────────────────────────────────────── */}
      <FormSection title="Schedule" description="Date and time of the event.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Start Date *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label className={LABEL}>End Date</label>
              <input
                type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className={INPUT} placeholder="Optional"
                min={date || undefined}
              />
            </div>
          </div>

          {/* All Day toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={allDay} onChange={e => setAllDay(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">All day event</span>
          </label>

          {/* Time fields — hidden when all-day */}
          <AnimatedField show={!allDay}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className={LABEL}>Start Time {!allDay && '*'}</label>
                <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className={INPUT} required={!allDay} />
              </div>
              <div>
                <label className={LABEL}>End Time {!allDay && '*'}</label>
                <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className={INPUT} required={!allDay} />
              </div>
            </div>
          </AnimatedField>
        </div>
      </FormSection>

      {/* ── Location ────────────────────────────────────────────────────── */}
      <FormSection title="Location" description="Where the event takes place and who leads it.">
        <div className="space-y-4">
          {/* Instructor — always visible */}
          <div>
            <label className={LABEL}>Instructor</label>
            <input type="text" value={instructor} onChange={e => setInstructor(e.target.value)} className={INPUT} placeholder="Instructor name" />
          </div>

          {/* In Person / Hybrid: Google Places autocomplete (LOC-03) */}
          <AnimatedField show={format !== 'Online'}>
            <div className="pt-1">
              <label className={LABEL}>Location</label>
              <GooglePlacesAutocomplete
                value={location}
                onChange={setLocation}
                onPlaceSelect={handlePlaceSelect}
                className={INPUT}
                placeholder="Search for a venue or address..."
              />
              {locationLat !== null && locationLng !== null && (
                <p className="text-xs text-foreground-tertiary mt-1">
                  Coordinates: {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
                </p>
              )}
            </div>
          </AnimatedField>

          {/* Online / Hybrid: platform name + URL (LOC-02) */}
          <AnimatedField show={format === 'Online' || format === 'Hybrid'}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className={LABEL}>Online Platform</label>
                <input
                  type="text"
                  value={onlinePlatformName}
                  onChange={e => setOnlinePlatformName(e.target.value)}
                  className={INPUT}
                  placeholder="e.g. Zoom, Google Meet"
                />
              </div>
              <div>
                <label className={LABEL}>Platform URL</label>
                <input
                  type="url"
                  value={onlinePlatformUrl}
                  onChange={e => setOnlinePlatformUrl(e.target.value)}
                  className={INPUT}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>
          </AnimatedField>
        </div>
      </FormSection>

      {/* ── Registration ────────────────────────────────────────────────── */}
      <FormSection title="Registration" description="Pricing and capacity settings.">
        <div className="space-y-4">
          {/* Registration Required toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox" checked={registrationRequired} onChange={e => setRegistrationRequired(e.target.checked)}
              className="w-4 h-4 rounded accent-primary"
            />
            <span className="text-sm text-foreground">Registration required</span>
          </label>

          {/* Price / Spots — only shown when registration is required */}
          <AnimatedField show={registrationRequired}>
            <div className="space-y-4 pt-1">
              {/* Price */}
              <div className="space-y-2">
                <label className={LABEL}>Price</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox" checked={isFree} onChange={e => setIsFree(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-foreground">This event is free</span>
                  </label>
                </div>
                <AnimatedField show={!isFree}>
                  <div className="relative max-w-[180px] pt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary text-sm">$</span>
                    <input
                      type="number" min="0" step="0.01" value={price}
                      onChange={e => setPrice(e.target.value)}
                      className={`${INPUT} pl-7`} placeholder="0.00"
                    />
                  </div>
                </AnimatedField>
              </div>

              {/* Spots */}
              <div className="grid grid-cols-2 gap-4 max-w-xs">
                <div>
                  <label className={LABEL}>Total Spots</label>
                  <input
                    type="number" min="0" value={spotsTotal}
                    onChange={e => setSpotsTotal(e.target.value)}
                    className={INPUT} placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className={LABEL}>Spots Remaining</label>
                  <input
                    type="number" min="0" value={spotsRem}
                    onChange={e => setSpotsRem(e.target.value)}
                    className={INPUT} placeholder="--"
                  />
                </div>
              </div>
            </div>
          </AnimatedField>

          {/* Event Website — always visible */}
          <div>
            <label className={LABEL}>Event Website</label>
            <input
              type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
              className={INPUT} placeholder="https://example.com"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Details ─────────────────────────────────────────────────────── */}
      <FormSection title="Details" description="Description and featured imagery.">
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className={LABEL}>Description</label>
            <textarea
              value={description} onChange={e => setDesc(e.target.value)}
              rows={5} className={`${INPUT} resize-y`}
              placeholder="Describe the event..."
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className={LABEL}>Featured Image</label>

            {displayImage ? (
              <div className="mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayImage} alt="Preview" className="w-full max-h-48 object-cover rounded-lg border border-goya-border" />
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
                className="border-2 border-dashed border-goya-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors"
              >
                <svg className="w-8 h-8 text-foreground-tertiary mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-foreground-secondary">Click to upload an image</p>
                <p className="text-xs text-foreground-tertiary mt-1">JPEG, PNG, WebP -- max 5 MB</p>
              </div>
            )}

            <input
              ref={fileRef} type="file" accept="image/*"
              onChange={handleFileChange} className="hidden"
            />

            {!displayImage && (
              <button
                type="button" onClick={() => fileRef.current?.click()}
                className="mt-2 text-xs text-primary hover:underline font-semibold"
              >
                Browse files
              </button>
            )}
          </div>
        </div>
      </FormSection>

      {/* ── Organizers ──────────────────────────────────────────────────── */}
      {currentUserId && currentUserName && (
        <FormSection title="Organizers" description="Add up to 5 co-organizers for this event.">
          <OrganizerPicker
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserRole={userRole ?? 'admin'}
            value={organizerIds}
            onChange={setOrganizerIds}
          />
        </FormSection>
      )}

      {/* ── Actions ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={saving}
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
        </button>
        <Link
          href="/admin/events"
          className="px-6 py-2.5 border border-goya-border text-foreground-secondary text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </Link>
      </div>

    </form>
  );
}
