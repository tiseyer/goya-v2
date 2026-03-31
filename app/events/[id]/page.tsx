import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Event } from '@/lib/types';
import { CATEGORY_BADGE } from '@/app/components/ui/Badge';

export const dynamic = 'force-dynamic';

function fmtTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

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
  const dateShort = new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const catBadge = CATEGORY_BADGE[ev.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {ev.featured_image_url ? (
        /* Image hero */
        <div className="relative pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ev.featured_image_url}
            alt={ev.title}
            className="w-full max-h-80 object-cover"
            width={1200}
            height={320}
          />
          {/* Gradient overlay — stronger at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 lg:px-8 pb-8">
            <div className="max-w-7xl mx-auto">
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-white/75 hover:text-white text-sm mb-5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Events
              </Link>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge}`}>{ev.category}</span>
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/20">{ev.format}</span>
                {isPast && (
                  <span className="px-2.5 py-0.5 bg-white/10 backdrop-blur-sm text-white/70 text-xs font-semibold rounded-full border border-white/15">
                    Past Event
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">{ev.title}</h1>
            </div>
          </div>
        </div>
      ) : (
        /* Gradient hero (no image) */
        <div className="bg-primary-dark relative overflow-hidden pt-24 pb-12 px-4 sm:px-6 lg:px-8">
          {/* Subtle background texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
          />
          {/* Soft glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="max-w-7xl mx-auto relative">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm mb-6 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge}`}>{ev.category}</span>
              <span className="px-2.5 py-0.5 bg-white/12 text-white/90 text-xs font-semibold rounded-full border border-white/15">{ev.format}</span>
              {isPast && (
                <span className="px-2.5 py-0.5 bg-white/8 text-white/55 text-xs font-semibold rounded-full border border-white/10">
                  Past Event
                </span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3">{ev.title}</h1>
            <p className="text-primary-200 text-sm font-medium">{dateFormatted}</p>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_308px] gap-8">

          {/* LEFT: Details */}
          <div className="space-y-4">

            {/* About */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-primary-dark mb-3">About This Event</h2>
              <p className="text-slate-700 leading-relaxed text-sm">
                {ev.description || 'Full details coming soon.'}
              </p>
            </div>

            {/* Event details: Date, Location, Instructor combined */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100">

              {/* Date & Time */}
              <div className="flex items-start gap-4 p-6">
                <div className="w-9 h-9 bg-primary-light/10 rounded-xl flex items-center justify-center text-primary-light shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date &amp; Time</p>
                  <p className="font-semibold text-primary-dark text-sm">{dateFormatted}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{fmtTime(ev.time_start)} – {fmtTime(ev.time_end)}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4 p-6">
                <div className="w-9 h-9 bg-primary-light/10 rounded-xl flex items-center justify-center text-primary-light shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                  {ev.format === 'Online' ? (
                    <>
                      <p className="font-semibold text-primary-dark text-sm">Online Event</p>
                      <p className="text-slate-500 text-xs mt-0.5">{ev.location || 'Online via Zoom'}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Link provided after registration</p>
                    </>
                  ) : (
                    <p className="font-semibold text-primary-dark text-sm">{ev.location || '—'}</p>
                  )}
                </div>
              </div>

              {/* Instructor */}
              {ev.instructor && (
                <div className="flex items-center gap-4 p-6">
                  <div className="w-9 h-9 rounded-full bg-primary-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ev.instructor[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Instructor</p>
                    <p className="font-semibold text-primary-dark text-sm">{ev.instructor}</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Booking card */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 space-y-5">

              {/* Price */}
              <div>
                {ev.is_free ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-emerald-600">Free</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-semibold text-slate-400 -mb-1">$</span>
                    <span className="text-4xl font-black text-primary-dark tabular-nums">{ev.price}</span>
                  </div>
                )}
                {ev.spots_remaining !== null && ev.spots_remaining !== undefined && (
                  <div className={[
                    'flex items-center gap-1.5 mt-2 text-xs font-semibold',
                    ev.spots_remaining < 10 ? 'text-amber-500' : 'text-slate-400',
                  ].join(' ')}>
                    {ev.spots_remaining < 10 && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {ev.spots_remaining} spots remaining
                  </div>
                )}
              </div>

              {/* Date summary */}
              <div className="flex items-center gap-2.5 py-3.5 border-t border-b border-slate-100 text-sm text-slate-700">
                <svg className="w-4 h-4 text-primary-light shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-slate-700">{dateShort}</span>
                {ev.time_start && (
                  <span className="text-slate-400 text-xs">· {fmtTime(ev.time_start)}</span>
                )}
              </div>

              {/* CTA */}
              {!isPast ? (
                <button className="block w-full text-center py-3.5 px-6 bg-primary-light hover:bg-primary active:bg-primary-dark text-white font-bold rounded-xl transition-colors duration-200 shadow-sm hover:shadow-md cursor-pointer">
                  Register Now
                </button>
              ) : (
                <div className="text-center text-sm text-slate-400 py-2 font-medium">
                  This event has passed.
                </div>
              )}

              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 cursor-pointer">
                  Add to Calendar
                </button>
                <button className="py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 cursor-pointer">
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
