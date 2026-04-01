'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Event, EventCategory, EventCategoryRow } from '@/lib/types';
import PageHero from '@/app/components/PageHero';
import { CATEGORY_BADGE, CATEGORY_DOT, FORMAT_BADGE } from '@/app/components/ui/Badge';
import LocationFilter, { haversine } from './LocationFilter';

const ALL_CATEGORIES: Array<'All' | EventCategory> = [
  'All', 'Workshop', 'Teacher Training', 'Dharma Talk', 'Conference',
  'Yoga Sequence', 'Music Playlist', 'Research',
];

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4h18M6 8h12M9 12h6M11 16h2" />
    </svg>
  );
}
function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SkeletonEvents() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex animate-pulse">
          <div className="bg-slate-200 w-[72px] shrink-0" style={{ minHeight: 100 }} />
          <div className="flex-1 p-5 flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-slate-200 rounded-full" />
              <div className="h-5 w-14 bg-slate-200 rounded-full" />
            </div>
            <div className="h-4 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface MiniCalendarProps {
  calYear: number;
  calMonth: number;
  selectedDate: string | null;
  eventDates: Set<string>;
  today: Date;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (iso: string | null) => void;
  onClose?: () => void;
}

function MiniCalendar({ calYear, calMonth, selectedDate, eventDates, today, onPrev, onNext, onSelectDate, onClose }: MiniCalendarProps) {
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay    = getFirstDayOfWeek(calYear, calMonth);
  const todayISO    = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          aria-label="Previous month"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-primary-dark">{MONTHS[calMonth]} {calYear}</span>
        <button
          onClick={onNext}
          aria-label="Next month"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase tracking-wide">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = toISO(calYear, calMonth, day);
          const hasEvent   = eventDates.has(iso);
          const isSelected = selectedDate === iso;
          const isToday    = iso === todayISO;
          return (
            <button
              key={day}
              onClick={() => {
                if (!hasEvent) return;
                const next = isSelected ? null : iso;
                onSelectDate(next);
                if (next && onClose) onClose();
              }}
              aria-label={`${day} ${MONTHS[calMonth]}${hasEvent ? ', has events' : ''}`}
              className={[
                'relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-primary-dark text-white'
                  : isToday
                  ? 'ring-1 ring-primary-light text-primary-dark font-bold'
                  : hasEvent
                  ? 'hover:bg-slate-100 text-slate-700 cursor-pointer'
                  : 'text-slate-300 cursor-default',
              ].join(' ')}
            >
              {day}
              {hasEvent && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary-light" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <button
          onClick={() => { onSelectDate(null); if (onClose) onClose(); }}
          className="mt-4 w-full text-xs text-primary-light hover:text-primary-dark font-semibold text-center transition-colors cursor-pointer"
        >
          Clear date filter
        </button>
      )}
    </div>
  );
}

interface LocationState {
  name: string;
  lat: number;
  lng: number;
}

export default function EventsPage() {
  const today = new Date();
  const [calYear,           setCalYear]           = useState(today.getFullYear());
  const [calMonth,          setCalMonth]          = useState(today.getMonth());
  const [selectedDate,      setSelectedDate]      = useState<string | null>(null);
  const [categoryFilter,    setCategoryFilter]    = useState<string>('All');
  const [typeFilter,        setTypeFilter]        = useState<'all' | 'goya' | 'member'>('all');
  const [formatFilter,      setFormatFilter]      = useState<string>('all');
  const [filterLocation,    setFilterLocation]    = useState<LocationState | null>(null);
  const [filterRadius,      setFilterRadius]      = useState(50);
  const [events,            setEvents]            = useState<Event[]>([]);
  const [dbCategories,      setDbCategories]      = useState<EventCategoryRow[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [dateSheetOpen,     setDateSheetOpen]     = useState(false);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  // Fetch events
  useEffect(() => {
    supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('[Events] fetch error:', error.message);
        setEvents((data as Event[]) ?? []);
        setLoading(false);
      });
  }, []);

  // Fetch DB categories — fallback to hardcoded if empty/error
  useEffect(() => {
    supabase
      .from('event_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error('[EventCategories] fetch error:', error.message);
          return;
        }
        if (data && data.length > 0) {
          setDbCategories(data as EventCategoryRow[]);
        }
      });
  }, []);

  // Build category list from DB with fallback to hardcoded
  const categoryList = useMemo(() => {
    if (dbCategories.length === 0) {
      return ALL_CATEGORIES.map(c => ({ name: c as string, color: '' }));
    }
    return [
      { name: 'All', color: '' },
      ...dbCategories.map(c => ({ name: c.name, color: c.color })),
    ];
  }, [dbCategories]);

  const eventDates = useMemo(() => new Set(events.map(e => e.date)), [events]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
    setSelectedDate(null);
  };

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (selectedDate && e.date !== selectedDate) return false;
      if (typeFilter !== 'all' && e.event_type !== typeFilter) return false;
      if (formatFilter !== 'all' && e.format !== formatFilter) return false;
      // Distance filter: only when In Person + location set
      if (formatFilter === 'In Person' && filterLocation) {
        if (e.location_lat == null || e.location_lng == null) return false;
        const dist = haversine(filterLocation.lat, filterLocation.lng, e.location_lat, e.location_lng);
        if (dist > filterRadius) return false;
      }
      return true;
    });
  }, [events, categoryFilter, selectedDate, typeFilter, formatFilter, filterLocation, filterRadius]);

  const activeFilters =
    (selectedDate ? 1 : 0) +
    (categoryFilter !== 'All' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (formatFilter !== 'all' ? 1 : 0) +
    (filterLocation ? 1 : 0);

  function clearAllFilters() {
    setSelectedDate(null);
    setCategoryFilter('All');
    setTypeFilter('all');
    setFormatFilter('all');
    setFilterLocation(null);
    setFilterRadius(50);
  }

  // Get DB category entry for inline badge styling
  function getCatDbEntry(catName: string): EventCategoryRow | undefined {
    return dbCategories.find(c => c.name === catName);
  }

  function getCatBadgeStyle(catName: string): React.CSSProperties | null {
    const entry = getCatDbEntry(catName);
    if (!entry) return null;
    const hex = entry.color;
    if (!hex) return null;
    return {
      backgroundColor: `${hex}15`,
      color: hex,
      borderColor: `${hex}40`,
    };
  }

  function getCatDotColor(catName: string): string | null {
    const entry = getCatDbEntry(catName);
    return entry ? entry.color : null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <PageHero
        pill="Events"
        title="Events"
        subtitle="Workshops, teacher trainings, dharma talks, and conferences from the global GOYA community."
      />

      {/* ── Mobile filter bar ──────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-2.5 space-y-2">
        {/* Type filter row */}
        <div className="flex rounded-full border border-slate-200 overflow-hidden">
          {([['all', 'All'], ['goya', 'GOYA'], ['member', 'Member']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={[
                'flex-1 text-center text-xs font-semibold py-1.5 transition-all cursor-pointer',
                typeFilter === key
                  ? 'bg-primary-dark text-white'
                  : 'text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Format filter row */}
        <div className="flex rounded-full border border-slate-200 overflow-hidden">
          {([['all', 'All'], ['Online', 'Online'], ['In Person', 'In Person']] as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFormatFilter(key)}
              className={[
                'flex-1 text-center text-xs font-semibold py-1.5 transition-all cursor-pointer',
                formatFilter === key
                  ? 'bg-primary-dark text-white'
                  : 'text-slate-500 hover:bg-slate-50',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Location filter — shown when In Person selected */}
        {formatFilter === 'In Person' && (
          <div className="px-1 pb-1">
            <LocationFilter
              onLocationChange={setFilterLocation}
              onRadiusChange={setFilterRadius}
              radius={filterRadius}
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => { setDateSheetOpen(true); setCategorySheetOpen(false); }}
            aria-label="Filter by date"
            className={[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer',
              selectedDate
                ? 'border-primary-light bg-primary-light/8 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            ].join(' ')}
          >
            <CalendarIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : `${MONTHS[calMonth].slice(0, 3)} ${calYear}`}
            </span>
          </button>
          <button
            onClick={() => { setCategorySheetOpen(true); setDateSheetOpen(false); }}
            aria-label="Filter by category"
            className={[
              'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200 cursor-pointer',
              categoryFilter !== 'All'
                ? 'border-primary-light bg-primary-light/8 text-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            ].join(' ')}
          >
            <FilterIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {categoryFilter === 'All' ? 'All Events' : categoryFilter}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[268px_1fr] gap-8">

          {/* ── Sidebar ─────────────────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-4">

            {/* Mini calendar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <MiniCalendar
                calYear={calYear}
                calMonth={calMonth}
                selectedDate={selectedDate}
                eventDates={eventDates}
                today={today}
                onPrev={prevMonth}
                onNext={nextMonth}
                onSelectDate={setSelectedDate}
              />
            </div>

            {/* Event type filter */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Event Type</p>
              <div className="flex flex-col gap-0.5">
                {([['all', 'All Events'], ['goya', 'GOYA Events'], ['member', 'Member Events']] as const).map(([key, label]) => {
                  const isActive = typeFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTypeFilter(key)}
                      className={[
                        'flex items-center gap-2.5 text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'bg-primary-dark text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-primary-dark',
                      ].join(' ')}
                    >
                      {key !== 'all' && (
                        <span className={[
                          'w-2 h-2 rounded-full shrink-0 transition-colors',
                          isActive ? 'bg-white/60' : key === 'goya' ? 'bg-blue-400' : 'bg-indigo-400',
                        ].join(' ')} />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format filter */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Format</p>
              <div className="flex flex-col gap-0.5">
                {([['all', 'All Events'], ['Online', 'Online'], ['In Person', 'In Person']] as [string, string][]).map(([key, label]) => {
                  const isActive = formatFilter === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setFormatFilter(key)}
                      className={[
                        'flex items-center gap-2.5 text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'bg-primary-dark text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-primary-dark',
                      ].join(' ')}
                    >
                      {key !== 'all' && (
                        <span className={[
                          'w-2 h-2 rounded-full shrink-0 transition-colors',
                          isActive ? 'bg-white/60' : key === 'Online' ? 'bg-slate-400' : 'bg-primary',
                        ].join(' ')} />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Location filter — only shown when In Person selected */}
              {formatFilter === 'In Person' && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <LocationFilter
                    onLocationChange={setFilterLocation}
                    onRadiusChange={setFilterRadius}
                    radius={filterRadius}
                  />
                </div>
              )}
            </div>

            {/* Category filter */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Category</p>
              <div className="flex flex-col gap-0.5">
                {categoryList.map(({ name: cat, color }) => {
                  const isActive = categoryFilter === cat;
                  const dotColor = cat !== 'All' ? getCatDotColor(cat) : null;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={[
                        'flex items-center gap-2.5 text-left px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                        isActive
                          ? 'bg-primary-dark text-white'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-primary-dark',
                      ].join(' ')}
                    >
                      {cat !== 'All' && (
                        dotColor ? (
                          <span
                            className="w-2 h-2 rounded-full shrink-0 transition-colors"
                            style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.6)' : dotColor }}
                          />
                        ) : (
                          <span className={[
                            'w-2 h-2 rounded-full shrink-0 transition-colors',
                            isActive ? 'bg-white/60' : (CATEGORY_DOT[cat] ?? 'bg-slate-400'),
                          ].join(' ')} />
                        )
                      )}
                      {cat === 'All' ? 'All Events' : cat}
                    </button>
                  );
                })}
              </div>
            </div>

          </aside>

          {/* ── Event list ──────────────────────────────────────────────────── */}
          <div>
            {/* Header row */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                  {selectedDate ? formatDate(selectedDate) : 'All upcoming events'}
                </p>
                <p className="text-primary-dark font-bold text-xl leading-tight">
                  {filtered.length}{' '}
                  <span className="font-normal text-slate-400 text-base">
                    event{filtered.length !== 1 ? 's' : ''}
                  </span>
                </p>
              </div>
              {activeFilters > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary-light hover:text-primary-dark px-3 py-1.5 rounded-full border border-primary-light/30 hover:border-primary-dark/40 transition-all duration-200 cursor-pointer"
                >
                  Clear {activeFilters > 1 ? `${activeFilters} filters` : 'filter'}
                </button>
              )}
            </div>

            {loading ? (
              <SkeletonEvents />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 text-center px-6">
                <div className="w-14 h-14 bg-primary-light/8 rounded-2xl flex items-center justify-center mb-5">
                  <CalendarIcon className="w-7 h-7 text-primary-light" />
                </div>
                <p className="text-primary-dark font-bold text-lg mb-1">No events found</p>
                <p className="text-slate-400 text-sm max-w-xs">
                  {selectedDate
                    ? 'No events on this date. Try another day.'
                    : categoryFilter !== 'All'
                    ? `No ${categoryFilter} events scheduled. Check back soon.`
                    : formatFilter === 'In Person' && filterLocation
                    ? `No in-person events within ${filterRadius} km of ${filterLocation.name}.`
                    : 'No upcoming events yet. Check back soon.'}
                </p>
                {activeFilters > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-5 text-sm font-semibold text-primary-light hover:text-primary-dark transition-colors cursor-pointer"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(event => {
                  const catStyle = getCatBadgeStyle(event.category);
                  const catBadgeClass = CATEGORY_BADGE[event.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';
                  const [year, month, dayStr] = event.date.split('-');
                  const dayNum = dayStr;
                  const monthAbbr = MONTHS[parseInt(month) - 1].slice(0, 3);

                  return (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col sm:flex-row cursor-pointer"
                    >
                      {/* Date block */}
                      <div className="bg-primary-dark text-white flex flex-row sm:flex-col items-center justify-center gap-3 sm:gap-1 px-5 py-4 sm:py-6 sm:w-[72px] shrink-0 sm:text-center">
                        <span className="text-3xl font-black leading-none tabular-nums">{dayNum}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-200">{monthAbbr}</span>
                        <span className="sm:hidden text-[10px] font-semibold text-primary-200 uppercase tracking-wide">{year}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center min-w-0">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {catStyle ? (
                              <span
                                className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                                style={catStyle}
                              >
                                {event.category}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadgeClass}`}>
                                {event.category}
                              </span>
                            )}
                            <span className={`inline-flex items-center text-xs px-2.5 py-0.5 rounded-full border font-medium ${FORMAT_BADGE[event.format] ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {event.format}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-primary-dark text-[15px] leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
                            {event.title}
                          </h3>

                          {/* Description */}
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2.5">{event.description}</p>

                          {/* Meta row */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-primary-light/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {fmtTime(event.time_start)}
                              {event.time_end ? ` – ${fmtTime(event.time_end)}` : ''}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-primary-light/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="truncate max-w-[140px]">{event.location}</span>
                              </span>
                            )}
                            {event.instructor && (
                              <span className="truncate">with {event.instructor}</span>
                            )}
                            {event.spots_remaining !== null && event.spots_remaining !== undefined && (
                              <span className={[
                                'font-semibold',
                                event.spots_remaining < 10 ? 'text-amber-500' : 'text-slate-400',
                              ].join(' ')}>
                                {event.spots_remaining} spots left
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="shrink-0 self-start sm:self-center text-right">
                          {event.is_free ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                              Free
                            </span>
                          ) : (
                            <span className="text-primary-dark font-black text-xl tabular-nums">
                              ${event.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Date bottom sheet (mobile) ─────────────────────────────────────── */}
      {dateSheetOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDateSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 animate-[slideUp_0.2s_ease-out]">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-primary-dark">Filter by Date</span>
              <button
                onClick={() => setDateSheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors cursor-pointer px-2 py-1"
              >
                Done
              </button>
            </div>
            <MiniCalendar
              calYear={calYear}
              calMonth={calMonth}
              selectedDate={selectedDate}
              eventDates={eventDates}
              today={today}
              onPrev={prevMonth}
              onNext={nextMonth}
              onSelectDate={setSelectedDate}
              onClose={() => setDateSheetOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Category bottom sheet (mobile) ───────────────────────────────── */}
      {categorySheetOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCategorySheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-2xl p-5 animate-[slideUp_0.2s_ease-out]">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-primary-dark">Filter by Category</span>
              <button
                onClick={() => setCategorySheetOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors cursor-pointer px-2 py-1"
              >
                Done
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              {categoryList.map(({ name: cat }) => {
                const isActive = categoryFilter === cat;
                const dotColor = cat !== 'All' ? getCatDotColor(cat) : null;
                return (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setCategorySheetOpen(false); }}
                    className={[
                      'flex items-center gap-3 text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                      isActive
                        ? 'bg-primary-dark text-white'
                        : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {cat !== 'All' && (
                      dotColor ? (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.6)' : dotColor }}
                        />
                      ) : (
                        <span className={[
                          'w-2 h-2 rounded-full shrink-0',
                          isActive ? 'bg-white/60' : (CATEGORY_DOT[cat] ?? 'bg-slate-400'),
                        ].join(' ')} />
                      )
                    )}
                    {cat === 'All' ? 'All Events' : cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
