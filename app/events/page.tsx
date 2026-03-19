'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { events, allCategories, type EventCategory } from '@/lib/events-data';

const CATEGORY_STYLES: Record<string, { badge: string; bg: string }> = {
  Workshop:         { badge: 'bg-teal-50 text-teal-700 border-teal-200',    bg: 'bg-teal-400' },
  'Teacher Training': { badge: 'bg-purple-50 text-purple-700 border-purple-200', bg: 'bg-purple-400' },
  'Dharma Talk':    { badge: 'bg-blue-50 text-blue-700 border-blue-200',    bg: 'bg-blue-400' },
  Conference:       { badge: 'bg-amber-50 text-amber-700 border-amber-200', bg: 'bg-amber-400' },
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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

export default function EventsPage() {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'All' | EventCategory>('All');

  const eventDates = useMemo(() => new Set(events.map(e => e.date)), []);

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);

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
      const [y, m] = e.date.split('-').map(Number);
      if (!selectedDate && (y !== calYear || m - 1 !== calMonth)) return false;
      return true;
    });
  }, [categoryFilter, selectedDate, calYear, calMonth]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#F7F8FA] pt-20 pb-8 px-4 sm:px-6 lg:px-8 border-b border-[#E5E7EB]">
        <div className="relative max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-[#1B3A5C] mb-4">Events</h1>
          <p className="text-[#6B7280] text-lg max-w-2xl">
            Workshops, teacher trainings, dharma talks, and conferences from the global GOYA community.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar: calendar + filters */}
          <aside className="space-y-6">
            {/* Mini calendar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-semibold text-[#1B3A5C]">
                  {MONTHS[calMonth]} {calYear}
                </span>
                <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
                ))}
              </div>
              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const iso = toISO(calYear, calMonth, day);
                  const hasEvent = eventDates.has(iso);
                  const isSelected = selectedDate === iso;
                  const isToday = iso === toISO(today.getFullYear(), today.getMonth(), today.getDate());
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : iso)}
                      className={`relative flex flex-col items-center justify-center h-8 w-full rounded-lg text-xs font-medium transition-colors
                        ${isSelected ? 'bg-[#1B3A5C] text-white' : isToday ? 'bg-[#4E87A0]/15 text-[#3A7190]' : hasEvent ? 'hover:bg-slate-100 text-slate-700' : 'text-slate-400 cursor-default'}`}
                    >
                      {day}
                      {hasEvent && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#4E87A0]" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="mt-3 w-full text-xs text-[#4E87A0] hover:text-[#3A7190] font-semibold text-center transition-colors"
                >
                  Clear date filter
                </button>
              )}
            </div>

            {/* Category filters */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Category</h3>
              <div className="flex flex-col gap-1.5">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#1B3A5C] text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'All' ? 'All Events' : cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Event list */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">
                {selectedDate
                  ? `Events on ${formatDate(selectedDate)}`
                  : `${MONTHS[calMonth]} ${calYear}`}
                {' — '}
                <span className="font-semibold text-slate-800">{filtered.length}</span> event{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-slate-100">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-slate-700 font-semibold mb-1">No events this month</p>
                <p className="text-slate-400 text-sm">Try navigating to another month.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map(event => {
                  const style = CATEGORY_STYLES[event.category];
                  return (
                    <div
                      key={event.id}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row"
                    >
                      {/* Date block */}
                      <div className="bg-[#1B3A5C] text-white flex flex-row sm:flex-col items-center justify-center sm:justify-start gap-3 sm:gap-0 px-5 py-4 sm:py-6 sm:w-20 shrink-0 sm:text-center">
                        <div className="text-2xl font-bold leading-none">{event.date.split('-')[2]}</div>
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#4E87A0]">
                          {MONTHS[parseInt(event.date.split('-')[1]) - 1].slice(0, 3)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                              {event.category}
                            </span>
                            {event.isOnline && (
                              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">Online</span>
                            )}
                          </div>
                          <h3 className="font-semibold text-[#1B3A5C] text-base mb-1">{event.title}</h3>
                          <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-2">{event.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {event.time} – {event.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {event.location}
                            </span>
                            <span>with {event.instructor}</span>
                            {event.spots !== null && (
                              <span className="text-amber-500 font-medium">{event.spots} spots left</span>
                            )}
                          </div>
                        </div>

                        {/* Price + CTA */}
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 shrink-0">
                          <div className="text-right">
                            {event.price === 'Free' ? (
                              <span className="text-emerald-600 font-bold text-sm">Free</span>
                            ) : (
                              <span className="text-[#1B3A5C] font-bold text-lg">${event.price}</span>
                            )}
                          </div>
                          <Link href={`/events/${event.id}`} className="bg-[#4E87A0] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#3A7190] transition-colors whitespace-nowrap">
                            Learn More →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
