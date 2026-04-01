'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import type { Event, EventCategory, EventFormat } from '@/lib/types';
import {
  createMemberEvent,
  updateMemberEvent,
  submitEventForReview,
  deleteMemberEvent,
} from './actions';
import { registerMediaItemAction } from '@/app/actions/media';
import OrganizerPicker from '@/app/components/OrganizerPicker';

const GooglePlacesAutocomplete = dynamic(() => import('@/app/components/GooglePlacesAutocomplete'), { ssr: false });

const CATEGORIES: EventCategory[] = ['Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research'];
const FORMATS: EventFormat[] = ['Online', 'In Person', 'Hybrid'];

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
  initialEvents: Event[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  currentUserRole: string;
}

export default function MyEventsClient({ initialEvents, currentUserId, currentUserName, currentUserAvatar, currentUserRole }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  function handleAddClick() {
    const dismissed = localStorage.getItem('goya-events-info-dismissed');
    if (!dismissed) {
      setShowInfoModal(true);
    } else {
      setView('create');
      setEditingEvent(null);
    }
  }

  function handleInfoDismiss() {
    localStorage.setItem('goya-events-info-dismissed', 'true');
    setShowInfoModal(false);
    setView('create');
    setEditingEvent(null);
  }

  function handleEdit(event: Event) {
    setEditingEvent(event);
    setView('edit');
  }

  function handleCancel() {
    setView('list');
    setEditingEvent(null);
    setErrorMsg('');
  }

  async function handleSubmitForReview(eventId: string) {
    setBusy(true);
    const result = await submitEventForReview(eventId);
    if (result.success) {
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'pending_review' as const } : e));
    } else {
      setErrorMsg(result.error ?? 'Failed to submit');
    }
    setBusy(false);
  }

  async function handleDelete(eventId: string) {
    setBusy(true);
    const result = await deleteMemberEvent(eventId);
    if (result.success) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
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
      // Handle image upload client-side
      let imageUrl = formData.featured_image_url;
      if (formData._imageFile) {
        const file = formData._imageFile;
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('event-images')
          .upload(path, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
        const { data: urlData } = supabase.storage.from('event-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
        // Fire-and-forget — non-critical, do not block UX on failure
        const { data: { user } } = await supabase.auth.getUser();
        registerMediaItemAction({
          bucket: 'event-images',
          fileName: file.name,
          filePath: path,
          fileUrl: imageUrl,
          fileType: file.type,
          fileSize: file.size,
          uploadedBy: user?.id ?? '',
        }).catch(console.error);
      }

      const payload = {
        title: formData.title,
        category: formData.category,
        format: formData.format,
        date: formData.date,
        end_date: formData.end_date,
        all_day: formData.all_day,
        time_start: formData.all_day ? null : formData.time_start,
        time_end: formData.all_day ? null : formData.time_end,
        instructor: formData.instructor,
        location: formData.location,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        online_platform_name: formData.online_platform_name,
        online_platform_url: formData.online_platform_url,
        description: formData.description,
        price: formData.is_free ? 0 : (formData.price ?? 0),
        is_free: formData.is_free,
        registration_required: formData.registration_required,
        spots_total: formData.spots_total,
        spots_remaining: formData.spots_remaining,
        website_url: formData.website_url,
        featured_image_url: imageUrl,
        organizer_ids: formData.organizer_ids,
        status,
      };

      if (view === 'edit' && editingEvent) {
        const result = await updateMemberEvent(editingEvent.id, payload);
        if (!result.success) throw new Error(result.error ?? 'Update failed');
      } else {
        const result = await createMemberEvent(payload);
        if (!result.success) throw new Error(result.error ?? 'Create failed');
      }

      router.refresh();
      // Optimistic: reload events from server
      setView('list');
      setEditingEvent(null);
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
            <h3 className="text-lg font-bold text-[#1B3A5C] mb-3">Submit Events to GOYA</h3>
            <p className="text-sm text-slate-600 mb-2">
              As a GOYA member, you can submit events to our community calendar.
              Workshops, teacher trainings, and community gatherings are welcome.
            </p>
            <p className="text-sm text-slate-600 mb-6">
              All events are reviewed before going live.
            </p>
            <button
              onClick={handleInfoDismiss}
              className="w-full px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
            >
              Got it, create my event
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
          {view === 'edit' ? 'Edit Event' : 'Create New Event'}
        </h1>
        {errorMsg && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">
            {errorMsg}
          </div>
        )}
        <MemberEventForm
          event={editingEvent ?? undefined}
          busy={busy}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserAvatar={currentUserAvatar}
          currentUserRole={currentUserRole}
        />
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (events.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-[#1B3A5C] mb-1">
            You haven&apos;t created any events yet.
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            Host a workshop, training, or class — and reach the global GOYA community.
          </p>
          <button
            onClick={handleAddClick}
            className="px-6 py-2.5 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
          >
            + Add New Event
          </button>
        </div>
      </div>
    );
  }

  // ── Events List ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {errorMsg && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-2 font-bold">x</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#1B3A5C]">My Events</h1>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors"
        >
          + Add New Event
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm divide-y divide-[#F3F4F6]">
        {events.map(event => (
          <div key={event.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#1B3A5C] truncate">{event.title}</h3>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[event.status] ?? 'bg-zinc-100 text-zinc-700'}`}>
                    {STATUS_LABEL[event.status] ?? event.status}
                  </span>
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {event.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {event.date ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}
                  {event.time_start && ` at ${event.time_start.slice(0, 5)}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Draft: Edit, Delete, Submit for Review */}
                {event.status === 'draft' && (
                  <>
                    <button onClick={() => handleEdit(event)} className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleSubmitForReview(event.id)}
                      disabled={busy}
                      className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-60"
                    >
                      Submit for Review
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(event.id)}
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
                {event.status === 'pending_review' && (
                  <button
                    onClick={() => setConfirmDeleteId(event.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                {/* Published: View, Delete */}
                {event.status === 'published' && (
                  <>
                    <Link
                      href={`/events/${event.id}`}
                      className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setConfirmDeleteId(event.id)}
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
                {event.status === 'rejected' && (
                  <>
                    <button onClick={() => handleEdit(event)} className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(event.id)}
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
            {event.status === 'rejected' && event.rejection_reason && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-xs text-red-700">
                  <span className="font-semibold">Rejection reason:</span> {event.rejection_reason}
                </p>
              </div>
            )}

            {/* Delete confirmation */}
            {confirmDeleteId === event.id && (
              <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700 flex-1">Are you sure you want to delete this event?</p>
                <button
                  onClick={() => handleDelete(event.id)}
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


// ── Helpers ───────────────────────────────────────────────────────────────────

function AnimatedField({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div className={`grid transition-all duration-200 ease-in-out ${show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

// ── Member Event Form ─────────────────────────────────────────────────────────

interface FormValues {
  title: string;
  category: string;
  format: string;
  date: string;
  end_date: string | null;
  all_day: boolean;
  time_start: string;
  time_end: string;
  instructor: string;
  location: string;
  location_lat: number | null;
  location_lng: number | null;
  online_platform_name: string | null;
  online_platform_url: string | null;
  description: string;
  price: number;
  is_free: boolean;
  registration_required: boolean;
  spots_total: number | null;
  spots_remaining: number | null;
  website_url: string | null;
  featured_image_url: string | null;
  organizer_ids?: string[];
  _imageFile?: File;
  _removeImage?: boolean;
}

function MemberEventForm({
  event,
  busy,
  onSubmit,
  onCancel,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  currentUserRole,
}: {
  event?: Event;
  busy: boolean;
  onSubmit: (data: FormValues, status: 'draft' | 'pending_review') => void;
  onCancel: () => void;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  currentUserRole: string;
}) {
  const isEdit = !!event;
  const isResubmit = event?.status === 'rejected';

  const [title, setTitle] = useState(event?.title ?? '');
  const [category, setCategory] = useState<EventCategory>(event?.category ?? 'Workshop');
  const [format, setFormat] = useState<EventFormat>(event?.format ?? 'Online');
  const [date, setDate] = useState(event?.date ?? '');
  const [endDate, setEndDate] = useState(event?.end_date ?? '');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [timeStart, setTimeStart] = useState(event?.time_start?.slice(0, 5) ?? '');
  const [timeEnd, setTimeEnd] = useState(event?.time_end?.slice(0, 5) ?? '');
  const [instructor, setInstructor] = useState(event?.instructor ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [locationLat, setLocationLat] = useState<number | null>(event?.location_lat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(event?.location_lng ?? null);
  const [onlinePlatformName, setOnlinePlatformName] = useState(event?.online_platform_name ?? '');
  const [onlinePlatformUrl, setOnlinePlatformUrl] = useState(event?.online_platform_url ?? '');
  const [description, setDesc] = useState(event?.description ?? '');
  const [price, setPrice] = useState(String(event?.price ?? '0'));
  const [isFree, setIsFree] = useState(event?.is_free ?? false);
  const [spotsTotal, setSpotsTotal] = useState(String(event?.spots_total ?? ''));
  const [spotsRem, setSpotsRem] = useState(String(event?.spots_remaining ?? ''));
  const [registrationRequired, setRegistrationRequired] = useState(event?.registration_required ?? false);
  const [websiteUrl, setWebsiteUrl] = useState(event?.website_url ?? '');

  // Organizer state — exclude current user from the managed list
  const [organizerIds, setOrganizerIds] = useState<string[]>(
    () => ((event as Event & { organizer_ids?: string[] | null })?.organizer_ids ?? []).filter(id => id !== currentUserId)
  );

  const [currentImageUrl, setCurrentImageUrl] = useState(event?.featured_image_url ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handlePlaceSelect = useCallback((place: { name: string; lat: number; lng: number }) => {
    setLocation(place.name);
    setLocationLat(place.lat);
    setLocationLng(place.lng);
  }, []);

  function buildFormValues(): FormValues {
    return {
      title: title.trim(),
      category,
      format,
      date,
      end_date: endDate || null,
      all_day: allDay,
      time_start: timeStart,
      time_end: timeEnd,
      instructor: instructor.trim(),
      location: location.trim(),
      location_lat: format !== 'Online' ? locationLat : null,
      location_lng: format !== 'Online' ? locationLng : null,
      online_platform_name: format === 'Online' || format === 'Hybrid' ? onlinePlatformName.trim() || null : null,
      online_platform_url: format === 'Online' || format === 'Hybrid' ? onlinePlatformUrl.trim() || null : null,
      description: description.trim(),
      price: isFree ? 0 : parseFloat(price) || 0,
      is_free: isFree,
      registration_required: registrationRequired,
      spots_total: spotsTotal ? parseInt(spotsTotal, 10) : null,
      spots_remaining: spotsRem ? parseInt(spotsRem, 10) : null,
      website_url: websiteUrl.trim() || null,
      featured_image_url: removeImage ? null : (imageFile ? null : currentImageUrl),
      organizer_ids: [currentUserId, ...organizerIds].filter(Boolean),
      _imageFile: imageFile ?? undefined,
      _removeImage: removeImage,
    };
  }

  const displayImage = imagePreview ?? (removeImage ? null : currentImageUrl);

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
      <div className="space-y-6 max-w-3xl">

        {/* Title */}
        <div>
          <label className={LABEL}>Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={INPUT} placeholder="Event title" required />
        </div>

        {/* Category / Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Category *</label>
            <select value={category} onChange={e => setCategory(e.target.value as EventCategory)} className={SELECT}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Format *</label>
            <select value={format} onChange={e => setFormat(e.target.value as EventFormat)} className={SELECT}>
              {FORMATS.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Date / Start / End */}
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
              className="w-4 h-4 rounded accent-[#4E87A0]"
            />
            <span className="text-sm text-[#374151]">All day event</span>
          </label>

          {/* Time fields — hidden when all-day */}
          {!allDay && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Start Time *</label>
                <input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} className={INPUT} required />
              </div>
              <div>
                <label className={LABEL}>End Time *</label>
                <input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} className={INPUT} required />
              </div>
            </div>
          )}
        </div>

        {/* Instructor */}
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
              <p className="text-xs text-[#9CA3AF] mt-1">
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

        {/* Description */}
        <div>
          <label className={LABEL}>Description</label>
          <textarea
            value={description} onChange={e => setDesc(e.target.value)}
            rows={5} className={`${INPUT} resize-y`}
            placeholder="Describe the event..."
          />
        </div>

        {/* Registration Required toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox" checked={registrationRequired} onChange={e => setRegistrationRequired(e.target.checked)}
            className="w-4 h-4 rounded accent-[#4E87A0]"
          />
          <span className="text-sm text-[#374151]">Registration required</span>
        </label>

        {/* Price / Spots — only shown when registration is required */}
        {registrationRequired && (
          <div className="space-y-4">
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
        )}

        {/* Organizers */}
        <div>
          <label className={LABEL}>Organizers</label>
          <p className="text-xs text-[#6B7280] mb-2">Add up to 5 co-organizers for this event.</p>
          <OrganizerPicker
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserAvatar={currentUserAvatar}
            currentUserRole={currentUserRole}
            value={organizerIds}
            onChange={setOrganizerIds}
          />
        </div>

        {/* Event Website — always visible */}
        <div>
          <label className={LABEL}>Event Website</label>
          <input
            type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
            className={INPUT} placeholder="https://example.com"
          />
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
              <p className="text-xs text-[#9CA3AF] mt-1">JPEG, PNG, WebP -- max 5 MB</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
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
        <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            disabled={busy || !title.trim() || !date || (!allDay && (!timeStart || !timeEnd))}
            onClick={() => onSubmit(buildFormValues(), 'draft')}
            className="px-6 py-2.5 border border-[#E5E7EB] text-[#374151] text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            disabled={busy || !title.trim() || !date || (!allDay && (!timeStart || !timeEnd))}
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
