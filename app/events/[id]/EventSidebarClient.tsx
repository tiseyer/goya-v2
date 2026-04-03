'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SidebarEvent {
  id: string;
  title: string;
  date: string;
  end_date: string | null;
  time_start: string;
  time_end: string;
  all_day: boolean;
  is_free: boolean;
  price: number;
  format: string;
  location: string | null;
  online_platform_name: string | null;
  external_registration: boolean;
  event_website: string | null;
  unlimited_spots: boolean;
  spots_total: number | null;
  short_description: string | null;
  description: string | null;
}

interface Props {
  event: SidebarEvent;
  isPast: boolean;
  isAttending: boolean;
  isAuthenticated: boolean;
  currentUserId: string | null;
  attendeeCount: number;
  locationString: string;
  dateFormatted: string;
  timeFormatted: string;
}

/* ── Calendar helpers ────────────────────────────────────────────────── */

function toICalDate(date: string, time: string | null): string {
  if (!time) return date.replace(/-/g, '');
  const [h, m] = time.split(':');
  return `${date.replace(/-/g, '')}T${h}${m}00`;
}

function toGoogleCalDate(date: string, time: string | null): string {
  if (!time) return date.replace(/-/g, '');
  const [h, m] = time.split(':');
  return `${date.replace(/-/g, '')}T${h}${m}00`;
}

function generateICS(ev: SidebarEvent, location: string): string {
  const desc = ev.short_description || (ev.description?.slice(0, 500) ?? '');
  const endDate = ev.end_date || ev.date;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GOYA//Events//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${ev.title}`,
    `DTSTART:${toICalDate(ev.date, ev.all_day ? null : ev.time_start)}`,
    `DTEND:${toICalDate(endDate, ev.all_day ? null : ev.time_end)}`,
    `DESCRIPTION:${desc.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(ev: SidebarEvent, location: string) {
  const ics = generateICS(ev, location);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openGoogleCalendar(ev: SidebarEvent, location: string) {
  const desc = ev.short_description || (ev.description?.slice(0, 500) ?? '');
  const endDate = ev.end_date || ev.date;
  const start = toGoogleCalDate(ev.date, ev.all_day ? null : ev.time_start);
  const end = toGoogleCalDate(endDate, ev.all_day ? null : ev.time_end);
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
  window.open(url, '_blank');
}

function openOutlookWeb(ev: SidebarEvent, location: string) {
  const desc = ev.short_description || (ev.description?.slice(0, 500) ?? '');
  const startDt = ev.all_day ? ev.date : `${ev.date}T${ev.time_start}`;
  const endDate = ev.end_date || ev.date;
  const endDt = ev.all_day ? endDate : `${endDate}T${ev.time_end}`;
  const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(ev.title)}&startdt=${encodeURIComponent(startDt)}&enddt=${encodeURIComponent(endDt)}&body=${encodeURIComponent(desc)}&location=${encodeURIComponent(location)}`;
  window.open(url, '_blank');
}

/* ── Component ───────────────────────────────────────────────────────── */

export default function EventSidebarClient({
  event,
  isPast,
  isAttending: initialIsAttending,
  isAuthenticated,
  currentUserId,
  attendeeCount: initialCount,
  locationString,
  dateFormatted,
  timeFormatted,
}: Props) {
  const [attending, setAttending] = useState(initialIsAttending);
  const [count, setCount] = useState(initialCount);
  const [joining, setJoining] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendarMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleJoin() {
    if (!isAuthenticated || !currentUserId) return;
    setJoining(true);
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: event.id, profile_id: currentUserId });
    if (!error) {
      setAttending(true);
      setCount(c => c + 1);
    }
    setJoining(false);
  }

  async function handleLeave() {
    if (!currentUserId) return;
    setJoining(true);
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', event.id)
      .eq('profile_id', currentUserId);
    if (!error) {
      setAttending(false);
      setCount(c => Math.max(0, c - 1));
      setShowLeaveConfirm(false);
    }
    setJoining(false);
  }

  // Parse location for expand/directions
  const hasFullAddress = event.format !== 'Online' && event.location && event.location.includes(',');
  const locationParts = event.location?.split(',').map(s => s.trim()) ?? [];
  const locationShort = locationParts.length >= 2
    ? `${locationParts[locationParts.length - 2]}, ${locationParts[locationParts.length - 1]}`
    : event.location ?? '';
  const directionsUrl = event.location
    ? `https://maps.google.com/?q=${encodeURIComponent(event.location)}`
    : '#';

  return (
    <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-5">
      {/* Price */}
      <div>
        {event.is_free ? (
          <span className="inline-block px-3 py-1 bg-[#6E88B0] text-white text-sm font-bold rounded-full">
            Free
          </span>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-semibold text-slate-400 -mb-1">$</span>
            <span className="text-4xl font-black text-primary-dark tabular-nums">{event.price}</span>
          </div>
        )}
        {!event.unlimited_spots && event.spots_total !== null && (
          <p className={`text-xs font-semibold mt-2 ${
            event.spots_total - count < 10 ? 'text-amber-500' : 'text-slate-400'
          }`}>
            {Math.max(0, event.spots_total - count)} spots remaining
          </p>
        )}
      </div>

      {/* Date & Time */}
      <div className="py-3 border-t border-slate-100">
        <p className="text-sm font-medium text-slate-700">
          {dateFormatted} · {timeFormatted}
        </p>
      </div>

      {/* Location */}
      <div className="py-3 border-t border-slate-100">
        {event.format === 'Online' ? (
          <p className="text-sm text-slate-700">
            Online{event.online_platform_name ? ` via ${event.online_platform_name}` : ''}
          </p>
        ) : hasFullAddress ? (
          <div>
            <button
              type="button"
              onClick={() => setLocationExpanded(!locationExpanded)}
              className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-primary transition-colors"
            >
              {locationShort}
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${locationExpanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {locationExpanded && (
              <div className="mt-2 text-xs text-slate-500 space-y-1.5">
                <p>{event.location}</p>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  Get Directions
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-700">{event.location || '—'}</p>
        )}
      </div>

      {/* Action area */}
      {isPast ? (
        <div>
          <p className="text-sm text-slate-400 font-medium mb-3">This event has passed.</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="w-full py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Add to Calendar
              </button>
              {showCalendarMenu && <CalendarDropdown event={event} location={locationString} onClose={() => setShowCalendarMenu(false)} />}
            </div>
            <ShareButton title={event.title} />
          </div>
        </div>
      ) : attending ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-semibold text-emerald-600">You&apos;re going!</span>
          </div>
          {!showLeaveConfirm ? (
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(true)}
              className="text-xs text-slate-400 hover:text-red-500 font-medium transition-colors"
            >
              Leave event
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Are you sure?</span>
              <button
                type="button"
                onClick={handleLeave}
                disabled={joining}
                className="text-red-500 font-semibold hover:text-red-700 transition-colors"
              >
                {joining ? 'Leaving...' : 'Yes, leave'}
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <p className="text-xs text-slate-400 mt-3">You will be notified when this event is about to start.</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="w-full py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Add to Calendar
              </button>
              {showCalendarMenu && <CalendarDropdown event={event} location={locationString} onClose={() => setShowCalendarMenu(false)} />}
            </div>
            <ShareButton title={event.title} />
          </div>
        </div>
      ) : (
        <div>
          {event.external_registration && event.event_website ? (
            <a
              href={event.event_website}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 px-6 bg-[#6E88B0] hover:bg-[#2a4d6e] text-white font-bold rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              Register Externally
            </a>
          ) : event.is_free ? (
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !isAuthenticated}
              className="block w-full text-center py-3.5 px-6 bg-[#6E88B0] hover:bg-[#2a4d6e] text-white font-bold rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-60 cursor-pointer"
            >
              {joining ? 'Joining...' : 'Join for Free'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                // Payment coming soon toast
                const toast = document.createElement('div');
                toast.className = 'fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium z-50 animate-pulse';
                toast.textContent = 'Payment coming soon';
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              }}
              className="block w-full text-center py-3.5 px-6 bg-[#6E88B0] hover:bg-[#2a4d6e] text-white font-bold rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
              Get Access — ${event.price}
            </button>
          )}
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                className="w-full py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Add to Calendar
              </button>
              {showCalendarMenu && <CalendarDropdown event={event} location={locationString} onClose={() => setShowCalendarMenu(false)} />}
            </div>
            <ShareButton title={event.title} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Calendar dropdown ─────────────────────────────────────────────────── */

function CalendarDropdown({
  event,
  location,
  onClose,
}: {
  event: SidebarEvent;
  location: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => { openGoogleCalendar(event, location); onClose(); }}
        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Google Calendar
      </button>
      <button
        type="button"
        onClick={() => { downloadICS(event, location); onClose(); }}
        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
      >
        Apple / Outlook (.ics)
      </button>
      <button
        type="button"
        onClick={() => { openOutlookWeb(event, location); onClose(); }}
        className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
      >
        Outlook Web
      </button>
    </div>
  );
}

/* ── Share button ──────────────────────────────────────────────────────── */

function ShareButton({ title }: { title: string }) {
  function handleShare() {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="p-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
      aria-label="Share event"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    </button>
  );
}
