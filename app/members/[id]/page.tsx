import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseService } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/members/constants';
import { deriveProfileVisibility } from '@/lib/members/profileVisibility';
import { fetchMemberEvents, fetchMemberCourses } from '@/lib/members/queries';
import ConnectButton from '@/app/components/ConnectButton';
import ConnectionsSection from '@/app/components/ConnectionsSection';
import PageContainer from '@/app/components/ui/PageContainer';

export const dynamic = 'force-dynamic';

type SchoolInfo = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  logo_url: string | null;
};

const ROLE_HERO: Record<string, { badge: string }> = {
  teacher: { badge: 'bg-teal-500/20 text-teal-300 border border-teal-500/30' },
  student: { badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  school: { badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30' },
  wellness_practitioner: { badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
};

const ROLE_LABEL: Record<string, string> = {
  teacher: 'Certified Teacher',
  student: 'Student Practitioner',
  school: 'School',
  wellness_practitioner: 'Wellness Practitioner',
};

/** Extract affiliated school fetch so it can run in Promise.all */
async function fetchAffiliatedSchools(
  serviceClient: ReturnType<typeof getSupabaseService>,
  profile: { principal_trainer_school_id: string | null; faculty_school_ids: string[] | null },
): Promise<SchoolInfo[]> {
  if (profile.principal_trainer_school_id) {
    const { data } = await serviceClient
      .from('schools')
      .select('id, name, slug, status, logo_url')
      .eq('id', profile.principal_trainer_school_id)
      .eq('status', 'approved')
      .maybeSingle();
    return data ? [data as SchoolInfo] : [];
  } else if (
    Array.isArray(profile.faculty_school_ids) &&
    (profile.faculty_school_ids as string[]).length > 0
  ) {
    const { data } = await serviceClient
      .from('schools')
      .select('id, name, slug, status, logo_url')
      .in('id', profile.faculty_school_ids as string[])
      .eq('status', 'approved');
    return (data as SchoolInfo[]) ?? [];
  }
  return [];
}

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Own-profile detection: use auth.getUser() (not getSession — security best practice)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const viewerId = user?.id ?? null;

  // Use service role client for profile reads — bypasses RLS so JWT expiry
  // doesn't cause a false 404. Middleware already enforces authentication.
  const serviceClient = getSupabaseService();

  const { data: profileData } = await serviceClient
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', id)
    .single();

  if (!profileData) notFound();

  const profile = profileData as unknown as {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    city: string | null;
    country: string | null;
    role: string | null;
    instagram: string | null;
    youtube: string | null;
    website: string | null;
    facebook: string | null;
    created_at: string;
    principal_trainer_school_id: string | null;
    faculty_school_ids: string[] | null;
    practice_format: 'online' | 'in_person' | 'hybrid' | null;
    location_lat: number | null;
    location_lng: number | null;
  };

  const isOwnProfile = viewerId === profile.id;

  // Derive privacy visibility server-side — consumed by Phases 48-50
  const visibility = deriveProfileVisibility({
    role: (profile.role ?? 'student') as 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin',
    practice_format: profile.practice_format,
    location_lat: profile.location_lat,
    location_lng: profile.location_lng,
  });

  // Fetch affiliated schools, events, and courses in parallel
  const [affiliatedSchools, memberEvents, memberCourses] = await Promise.all([
    fetchAffiliatedSchools(serviceClient, profile),
    fetchMemberEvents(serviceClient, profile.id),
    fetchMemberCourses(serviceClient, profile.id),
  ]);

  // Suppress unused variable warnings until Phases 48-50 consume these
  void memberEvents;
  void memberCourses;
  void visibility;

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.full_name ||
    'Unknown Member';

  const firstName = profile.first_name ?? displayName.split(' ')[0] ?? '';
  const role = profile.role ?? 'student';
  const heroStyle = ROLE_HERO[role] ?? ROLE_HERO['student'];
  const roleLabel = ROLE_LABEL[role] ?? role;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-primary relative overflow-hidden flex items-center h-[240px] sm:h-[260px] md:h-[280px]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-light opacity-[0.05] rounded-full blur-3xl translate-x-1/2 -translate-y-1/4" />
        </div>

        <PageContainer className="relative">
          {/* Back link */}
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-4 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-[#4E87A0]/20 flex items-center justify-center overflow-hidden ring-4 ring-white/10 shadow-2xl">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {displayName[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="text-left pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-3 justify-start">
                <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${heroStyle.badge}`}>
                  {roleLabel}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                {displayName}
              </h1>

              {(profile.city || profile.country) && (
                <div className="flex items-center justify-start gap-1.5 text-slate-400 text-sm mt-1">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Content */}
      <PageContainer className="-mt-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
                  About
                </h2>
                <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">{profile.bio}</p>
              </div>
            )}

            {/* Connections */}
            <ConnectionsSection profileMemberId={profile.id} />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Social links */}
            {(profile.website || profile.instagram || profile.youtube) && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Connect</h2>
                <div className="space-y-2.5">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <span className="truncate">Website</span>
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={profile.instagram.startsWith('http') ? profile.instagram : `https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                      <span className="truncate">{profile.instagram}</span>
                    </a>
                  )}
                  {profile.youtube && (
                    <a
                      href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                        </svg>
                      </div>
                      <span className="truncate">{profile.youtube}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Visit School card(s) — only for Principal Trainers / Faculty of approved schools */}
            {affiliatedSchools.map(school => (
              <div key={school.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#4E87A0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  School
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#4E87A0]/10 flex items-center justify-center overflow-hidden shrink-0">
                    {school.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={school.logo_url} alt={school.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-[#4E87A0]">{school.name[0]?.toUpperCase() ?? '?'}</span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{school.name}</p>
                </div>
                {school.slug ? (
                  <Link
                    href={`/schools/${school.slug}`}
                    className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-[#4E87A0] text-white rounded-xl hover:bg-[#3d6f87] transition-colors"
                  >
                    Visit School
                  </Link>
                ) : (
                  <Link
                    href={`/schools/${school.id}`}
                    className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-[#4E87A0] text-white rounded-xl hover:bg-[#3d6f87] transition-colors"
                  >
                    Visit School
                  </Link>
                )}
              </div>
            ))}

            {/* Member card */}
            <div className="bg-[#1B3A5C] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E87A0] opacity-[0.08] rounded-full blur-2xl translate-x-8 -translate-y-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">GOYA Member</span>
                  <span className="w-2 h-2 bg-[#4E87A0] rounded-full animate-pulse" />
                </div>
                {memberSince && (
                  <p className="text-white font-bold text-lg mb-4">Since {memberSince}</p>
                )}
                <div className="pt-4 border-t border-white/10">
                  <ConnectButton
                    memberId={profile.id}
                    memberName={displayName}
                    memberPhoto={profile.avatar_url ?? ''}
                    firstName={firstName}
                    viewerRole={null}
                    profileRole={profile.role ?? 'student'}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
