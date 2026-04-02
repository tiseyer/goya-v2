import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseService } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/members/constants';
import { deriveProfileVisibility } from '@/lib/members/profileVisibility';
import { fetchMemberEvents, fetchMemberCourses } from '@/lib/members/queries';
import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import ConnectButton from '@/app/components/ConnectButton';
import ConnectionsSection from '@/app/components/ConnectionsSection';
import PageContainer from '@/app/components/ui/PageContainer';
import ProfileHero from './components/ProfileHero';
import { ROLE_LABEL } from './components/ProfileHero';

export const dynamic = 'force-dynamic';

type SchoolInfo = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  logo_url: string | null;
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
    introduction: string | null;
    city: string | null;
    country: string | null;
    role: string | null;
    instagram: string | null;
    youtube: string | null;
    website: string | null;
    facebook: string | null;
    tiktok: string | null;
    cover_image_url: string | null;
    languages: string[] | null;
    created_at: string;
    principal_trainer_school_id: string | null;
    faculty_school_ids: string[] | null;
    practice_format: 'online' | 'in_person' | 'hybrid' | null;
    location_lat: number | null;
    location_lng: number | null;
  };

  const isOwnProfile = viewerId === profile.id;

  // Derive privacy visibility server-side — consumed by Phase 50 map
  const visibility = deriveProfileVisibility({
    role: (profile.role ?? 'student') as 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin',
    practice_format: profile.practice_format,
    location_lat: profile.location_lat,
    location_lng: profile.location_lng,
  });
  // Keep for Phase 50 map consumption
  void visibility;

  // Fetch affiliated schools, events, and courses in parallel
  const [affiliatedSchools, memberEvents, memberCourses] = await Promise.all([
    fetchAffiliatedSchools(serviceClient, profile),
    fetchMemberEvents(serviceClient, profile.id),
    fetchMemberCourses(serviceClient, profile.id),
  ]);

  const hasContent = memberEvents.length > 0 || memberCourses.length > 0;

  const profileCompletion = isOwnProfile
    ? getProfileCompletion(profileData as unknown as Record<string, unknown>, hasContent)
    : null;

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.full_name ||
    'Unknown Member';

  const role = profile.role ?? 'student';
  const roleLabel = ROLE_LABEL[role] ?? role;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <ProfileHero
        profile={{
          id: profile.id,
          full_name: profile.full_name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: profile.avatar_url,
          introduction: profile.introduction,
          city: profile.city,
          country: profile.country,
          role: role,
          cover_image_url: profile.cover_image_url,
          practice_format: profile.practice_format,
          languages: profile.languages,
          created_at: profile.created_at,
        }}
        displayName={displayName}
        roleLabel={roleLabel}
        isOwnProfile={isOwnProfile}
        profileCompletion={profileCompletion}
        viewerRole={null}
      />

      {/* Two-column content layout */}
      <PageContainer className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Main column — left */}
          <div className="space-y-6">
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

          {/* Sidebar column — right */}
          <div className="space-y-6">
            {/* Social links */}
            {(profile.website || profile.instagram || profile.youtube || profile.tiktok || profile.facebook) && (
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
                  {profile.tiktok && (
                    <a
                      href={profile.tiktok.startsWith('http') ? profile.tiktok : `https://tiktok.com/@${profile.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.14 8.14 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z" />
                        </svg>
                      </div>
                      <span className="truncate">{profile.tiktok}</span>
                    </a>
                  )}
                  {profile.facebook && (
                    <a
                      href={profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-[#4E87A0] transition-colors group p-2 rounded-lg hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-[#4E87A0]/10 transition-colors shrink-0">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <span className="truncate">{profile.facebook}</span>
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
                    firstName={profile.first_name ?? displayName.split(' ')[0] ?? ''}
                    viewerRole={null}
                    profileRole={role}
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
