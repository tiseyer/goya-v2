import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Event } from '@/lib/types';
import { CATEGORY_BADGE } from '@/app/components/ui/Badge';
import PageContainer from '@/app/components/ui/PageContainer';
import EventViewTracker from './EventViewTracker';
import EventSidebarClient from './EventSidebarClient';
import EventAttendeesSection from './EventAttendeesSection';

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

  // Fetch auth user and determine manage permission
  const { data: { user: authUser } } = await supabase.auth.getUser();
  let canManage = false;
  let isAttending = false;
  let authUserRole: string | null = null;

  if (authUser) {
    if (ev.organizer_ids?.includes(authUser.id)) canManage = true;
    if (!canManage) {
      const { data: authProfile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single();
      authUserRole = authProfile?.role ?? null;
      if (authUserRole === 'admin' || authUserRole === 'moderator') canManage = true;
    }
    // Check if user is attending
    const { data: attendeeRow } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', ev.id)
      .eq('profile_id', authUser.id)
      .maybeSingle();
    isAttending = !!attendeeRow;
  }

  // Fetch organizer profiles
  let organizers: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  if (ev.organizer_ids && ev.organizer_ids.length > 0) {
    const { data: orgProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', ev.organizer_ids);
    organizers = orgProfiles ?? [];
  }

  // Fetch instructor profiles from join table
  let instructors: { id: string; full_name: string | null; avatar_url: string | null; username: string | null }[] = [];
  const { data: instructorRows } = await supabase
    .from('event_instructors')
    .select('profile_id')
    .eq('event_id', ev.id);
  if (instructorRows && instructorRows.length > 0) {
    const { data: instrProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, username')
      .in('id', instructorRows.map(r => r.profile_id));
    instructors = instrProfiles ?? [];
  }

  // Get attendee count
  const { count: attendeeCount } = await supabase
    .from('event_attendees')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', ev.id);

  // Fetch attendee profiles if show_attendees is true
  let attendeeProfiles: { id: string; full_name: string | null; avatar_url: string | null }[] = [];
  if (ev.show_attendees === true) {
    const { data: attendeeRows } = await supabase
      .from('event_attendees')
      .select('profiles!event_attendees_profile_id_fkey(id, full_name, avatar_url)')
      .eq('event_id', ev.id)
      .limit(100);
    if (attendeeRows) {
      attendeeProfiles = attendeeRows.map((row: Record<string, unknown>) => {
        const p = row.profiles as { id: string; full_name: string | null; avatar_url: string | null } | null;
        return { id: p?.id ?? '', full_name: p?.full_name ?? 'Unknown', avatar_url: p?.avatar_url ?? null };
      });
    }
  }

  const isPast = new Date(ev.date) < new Date();
  const dateFormatted = new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const catBadge = CATEGORY_BADGE[ev.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';

  // Build location string for calendar links
  let locationString = '';
  if (ev.format === 'Online') {
    locationString = ev.online_platform_name ? `Online via ${ev.online_platform_name}` : 'Online';
  } else if (ev.location) {
    locationString = ev.location;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <EventViewTracker eventId={ev.id} eventName={ev.title} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {ev.featured_image_url ? (
        <div className="relative pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ev.featured_image_url}
            alt={ev.title}
            className="w-full max-h-80 object-cover"
            width={1200}
            height={320}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 pb-8">
            <PageContainer>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-white/75 hover:text-white text-sm mb-4 transition-colors"
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
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">{ev.title}</h1>
              <p className="text-white/70 text-sm font-medium mt-2">{dateFormatted}</p>
            </PageContainer>
          </div>
        </div>
      ) : (
        <div className="bg-primary relative overflow-hidden flex items-center h-[240px] sm:h-[260px] md:h-[280px]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <PageContainer className="relative">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm mb-4 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Events
            </Link>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catBadge}`}>{ev.category}</span>
              <span className="px-2.5 py-0.5 bg-white/12 text-white/90 text-xs font-semibold rounded-full border border-white/15">{ev.format}</span>
              {isPast && (
                <span className="px-2.5 py-0.5 bg-white/8 text-white/55 text-xs font-semibold rounded-full border border-white/10">
                  Past Event
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">{ev.title}</h1>
            <p className="text-primary-200 text-sm font-medium">{dateFormatted}</p>
          </PageContainer>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <PageContainer className="py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

          {/* LEFT: Content */}
          <div className="space-y-6">
            {/* Featured image in content area (if not in hero — show here for mobile/consistency) */}

            {/* About */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-primary-dark mb-3">About This Event</h2>
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">
                {ev.description || 'Full details coming soon.'}
              </p>
            </div>

            {/* Attendees section */}
            {ev.show_attendees === true && attendeeProfiles.length > 0 && (
              <EventAttendeesSection attendees={attendeeProfiles} />
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div>
            {/* Edit / Delete — visible to organizers and admin/moderator */}
            {canManage && (
              <div className="flex gap-2 mb-4">
                <Link
                  href={`/admin/events/${ev.id}/edit`}
                  className="flex-1 text-center py-2.5 px-4 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Edit Event
                </Link>
                <button className="py-2.5 px-4 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}

            {/* Main sidebar card with client interactivity */}
            <EventSidebarClient
              event={{
                id: ev.id,
                title: ev.title,
                date: ev.date,
                end_date: ev.end_date,
                time_start: ev.time_start,
                time_end: ev.time_end,
                all_day: ev.all_day,
                is_free: ev.is_free,
                price: ev.price,
                format: ev.format,
                location: ev.location,
                online_platform_name: ev.online_platform_name,
                external_registration: ev.external_registration,
                event_website: ev.event_website,
                unlimited_spots: ev.unlimited_spots,
                spots_total: ev.spots_total,
                short_description: ev.short_description,
                description: ev.description,
              }}
              isPast={isPast}
              isAttending={isAttending}
              isAuthenticated={!!authUser}
              currentUserId={authUser?.id ?? null}
              attendeeCount={attendeeCount ?? 0}
              locationString={locationString}
              dateFormatted={dateFormatted}
              timeFormatted={ev.all_day ? 'All day' : `${fmtTime(ev.time_start)} – ${fmtTime(ev.time_end)}`}
            />

            {/* Instructor widget */}
            {instructors.length > 0 && ev.show_instructors !== false && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {instructors.length === 1 ? 'Instructor' : 'Instructors'}
                </h3>
                <div className="space-y-3">
                  {instructors.map((inst) => (
                    <Link key={inst.id} href={`/members/${inst.username ?? inst.id}`} className="flex items-center gap-3 group">
                      {inst.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={inst.avatar_url} alt={inst.full_name ?? 'Instructor'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {(inst.full_name ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <p className="text-sm font-medium text-primary-dark group-hover:text-primary transition-colors">
                        {inst.full_name ?? 'Unknown'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Instructor fallback — text-based (pre-migration events) */}
            {instructors.length === 0 && ev.instructor && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Instructor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-dark flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {ev.instructor[0].toUpperCase()}
                  </div>
                  <p className="font-semibold text-primary-dark text-sm">{ev.instructor}</p>
                </div>
              </div>
            )}

            {/* Organizers widget */}
            {organizers.length > 0 && ev.show_organizers !== false && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mt-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Organizers</h3>
                <div className="space-y-3">
                  {organizers.map((org) => (
                    <Link
                      key={org.id}
                      href={`/members/${org.username ?? org.id}`}
                      className="flex items-center gap-3 group"
                    >
                      {org.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={org.avatar_url} alt={org.full_name ?? 'Organizer'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {(org.full_name ?? '?')[0].toUpperCase()}
                        </div>
                      )}
                      <p className="text-sm font-medium text-primary-dark group-hover:text-primary transition-colors">
                        {org.full_name ?? 'Unknown'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </PageContainer>
    </div>
  );
}
