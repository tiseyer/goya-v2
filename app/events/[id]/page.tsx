import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Event } from '@/lib/types';

export const dynamic = 'force-dynamic';

function fmtTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Workshop:           'bg-teal-50 text-teal-700 border-teal-200',
  'Teacher Training': 'bg-purple-50 text-purple-700 border-purple-200',
  'Dharma Talk':      'bg-blue-50 text-blue-700 border-blue-200',
  Conference:         'bg-amber-50 text-amber-700 border-amber-200',
  'Yoga Sequence':    'bg-green-50 text-green-700 border-green-200',
  'Music Playlist':   'bg-pink-50 text-pink-700 border-pink-200',
  Research:           'bg-slate-100 text-slate-600 border-slate-200',
};

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (!event) notFound();

  const ev = event as Event;
  const isPast = new Date(ev.date) < new Date();
  const dateFormatted = new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const catBadge = CATEGORY_COLORS[ev.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero: featured image OR dark navy gradient */}
      {ev.featured_image_url ? (
        <div className="relative pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ev.featured_image_url}
            alt={ev.title}
            className="w-full max-h-72 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8 max-w-5xl mx-auto">
            <Link href="/events" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge}`}>{ev.category}</span>
              <span className="px-2.5 py-0.5 bg-white/20 text-white text-xs font-semibold rounded-full">{ev.format}</span>
              {isPast && <span className="px-2.5 py-0.5 bg-white/20 text-white/80 text-xs font-semibold rounded-full">Past Event</span>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">{ev.title}</h1>
          </div>
        </div>
      ) : (
        <div className="bg-[#1B3A5C] pt-24 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Link href="/events" className="inline-flex items-center gap-1.5 text-[#A8C5D8] hover:text-white text-sm mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge}`}>{ev.category}</span>
              <span className="px-2.5 py-0.5 bg-white/15 text-white/90 text-xs font-semibold rounded-full">{ev.format}</span>
              {isPast && <span className="px-2.5 py-0.5 bg-white/10 text-white/60 text-xs font-semibold rounded-full">Past Event</span>}
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">{ev.title}</h1>
            <p className="text-[#A8C5D8]">{dateFormatted}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* LEFT: Details */}
          <div className="space-y-5">

            {/* About */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-3">About This Event</h2>
              <p className="text-[#374151] leading-relaxed">{ev.description || 'Full details coming soon.'}</p>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-3">Date &amp; Time</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#4E87A0]/10 rounded-xl flex items-center justify-center text-[#4E87A0] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#1B3A5C]">{dateFormatted}</p>
                  <p className="text-[#6B7280] text-sm">{fmtTime(ev.time_start)} – {fmtTime(ev.time_end)}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1B3A5C] mb-3">Location</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#4E87A0]/10 rounded-xl flex items-center justify-center text-[#4E87A0] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  {ev.format === 'Online' ? (
                    <>
                      <p className="font-semibold text-[#1B3A5C]">Online Event</p>
                      <p className="text-[#6B7280] text-sm">{ev.location || 'Online via Zoom'}</p>
                      <p className="text-[#9CA3AF] text-xs mt-0.5">Link provided after registration</p>
                    </>
                  ) : (
                    <p className="font-semibold text-[#1B3A5C]">{ev.location || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor */}
            {ev.instructor && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#1B3A5C] mb-3">Instructor</h2>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white font-bold shrink-0">
                    {ev.instructor[0]}
                  </div>
                  <p className="font-semibold text-[#374151]">{ev.instructor}</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Booking card */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-[#E5E7EB] shadow-lg p-6 space-y-4">
              <div>
                <div className="text-3xl font-bold text-[#1B3A5C]">
                  {ev.is_free ? 'Free' : `$${ev.price}`}
                </div>
                {ev.spots_remaining !== null && ev.spots_remaining !== undefined && (
                  <div className={`text-xs font-semibold mt-1 ${ev.spots_remaining < 10 ? 'text-red-500' : 'text-[#6B7280]'}`}>
                    {ev.spots_remaining} spots remaining
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 py-3 border-t border-b border-[#E5E7EB] text-sm text-[#374151]">
                <svg className="w-4 h-4 text-[#9CA3AF] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              {!isPast ? (
                <button className="block w-full text-center py-3.5 bg-[#4E87A0] text-white font-bold rounded-xl hover:bg-[#3A7190] transition-colors">
                  Register Now
                </button>
              ) : (
                <div className="text-center text-sm text-[#9CA3AF] py-2">This event has passed.</div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 border border-[#E5E7EB] text-[#374151] text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Add to Calendar
                </button>
                <button className="py-2.5 border border-[#E5E7EB] text-[#374151] text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Share
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
