import { notFound } from 'next/navigation';
import Link from 'next/link';
import { events } from '@/lib/events-data';

export async function generateStaticParams() {
  return events.map(e => ({ id: e.id }));
}

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = events.find(e => e.id === id);
  if (!event) notFound();

  const isPast = new Date(event.date) < new Date();
  const dateFormatted = new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a2744] to-[#0f172a] pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Back to Events
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-[#2dd4bf]/20 text-[#2dd4bf] text-xs font-bold rounded-full uppercase tracking-wide">{event.category}</span>
            {event.isOnline && <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full">Online</span>}
            {isPast && <span className="px-3 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold rounded-full">Past Event</span>}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{event.title}</h1>
          <p className="text-slate-300">{dateFormatted}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* LEFT: Details */}
          <div className="space-y-6">

            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1a2744] mb-3">About This Event</h2>
              <p className="text-slate-600 leading-relaxed">{event.description || 'Full details coming soon.'}</p>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1a2744] mb-3">Date & Time</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2dd4bf]/10 rounded-xl flex items-center justify-center text-[#2dd4bf] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{dateFormatted}</p>
                  <p className="text-slate-500 text-sm">{event.time} – {event.endTime}</p>
                  {event.endDate && <p className="text-slate-500 text-sm">to {new Date(event.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                  {event.timezone && <p className="text-slate-400 text-xs mt-0.5">{event.timezone}</p>}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-[#1a2744] mb-3">Location</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#2dd4bf]/10 rounded-xl flex items-center justify-center text-[#2dd4bf] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  {event.isOnline ? (
                    <>
                      <p className="font-semibold text-slate-800">Online Event</p>
                      <p className="text-slate-500 text-sm">{event.venue || 'Online via Zoom'}</p>
                      <p className="text-slate-400 text-xs mt-0.5">Link provided after registration</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-slate-800">{event.location}</p>
                      {event.venue && <p className="text-slate-500 text-sm">{event.venue}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Organizer */}
            {event.organizer && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#1a2744] mb-3">Organizer</h2>
                <div className="flex items-center gap-3">
                  {event.organizerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.organizerAvatar} alt={event.organizer} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#1a2744] flex items-center justify-center text-white font-bold">{event.organizer[0]}</div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{event.organizer}</p>
                    {event.organizerBio && <p className="text-slate-500 text-sm">{event.organizerBio}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Booking card (sticky) */}
          <div>
            <div className="sticky top-24 bg-white rounded-2xl border border-slate-100 shadow-lg p-6 space-y-4">
              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-[#1a2744]">
                  {event.price === 'Free' ? 'Free' : `$${event.price}`}
                </div>
                {event.spotsRemaining !== undefined && (
                  <div className={`text-xs font-semibold mt-1 ${event.spotsRemaining < 10 ? 'text-red-500' : 'text-slate-500'}`}>
                    {event.spotsRemaining} spots remaining
                  </div>
                )}
              </div>

              {/* Date reminder */}
              <div className="flex items-center gap-2 py-3 border-t border-b border-slate-100 text-sm text-slate-600">
                <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              {/* CTA */}
              {event.externalUrl && !isPast && (
                <a href={event.externalUrl} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center py-3.5 bg-[#2dd4bf] text-[#1a2744] font-bold rounded-xl hover:bg-[#14b8a6] transition-colors">
                  Visit Event Page
                </a>
              )}

              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                  Add to Calendar
                </button>
                <button className="py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors">
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
