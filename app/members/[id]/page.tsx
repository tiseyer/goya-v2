import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseService } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/members/constants';
import { deriveProfileVisibility } from '@/lib/members/profileVisibility';
import { fetchMemberEvents, fetchMemberCourses } from '@/lib/members/queries';
import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import ConnectionsSection from '@/app/components/ConnectionsSection';
import PageContainer from '@/app/components/ui/PageContainer';
import ProfileHero from './components/ProfileHero';
import { ROLE_LABEL } from './components/ProfileHero';
import ProfileSidebar from './components/ProfileSidebar';

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
    wellness_designations: string[] | null;
    other_org_names: string[] | null;
  };

  const isOwnProfile = viewerId === profile.id;

  // Fetch viewer's role for ConnectButton role-pair logic
  let viewerRole: string | null = null;
  if (viewerId && viewerId !== id) {
    const { data: viewerProfile } = await serviceClient
      .from('profiles')
      .select('member_type')
      .eq('id', viewerId)
      .maybeSingle();
    viewerRole = viewerProfile?.member_type ?? null;
  }

  // Derive privacy visibility server-side — consumed by Phase 50 map
  const visibility = deriveProfileVisibility({
    role: (profile.role ?? 'student') as 'student' | 'teacher' | 'wellness_practitioner' | 'moderator' | 'admin',
    practice_format: profile.practice_format,
    location_lat: profile.location_lat,
    location_lng: profile.location_lng,
  });
  // Keep for Phase 50 map consumption
  void visibility;

  // Connections count query for sidebar stats
  const connectionsCountPromise = serviceClient
    .from('connections')
    .select('id', { count: 'exact', head: true })
    .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
    .eq('status', 'accepted');

  // Fetch affiliated schools, events, courses, and connections count in parallel
  const [affiliatedSchools, memberEvents, memberCourses, { count: connectionsCount }] = await Promise.all([
    fetchAffiliatedSchools(serviceClient, profile),
    fetchMemberEvents(serviceClient, profile.id),
    fetchMemberCourses(serviceClient, profile.id),
    connectionsCountPromise,
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
        viewerRole={viewerRole}
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

            {/* Visit School card(s) — only for Principal Trainers / Faculty of approved schools */}
            {affiliatedSchools.length > 0 && affiliatedSchools.map(school => (
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
          </div>

          {/* Sidebar column — right */}
          <div>
            <ProfileSidebar
              profile={{
                ...profile,
                role: role,
              }}
              displayName={displayName}
              isOwnProfile={isOwnProfile}
              viewerRole={viewerRole}
              connectionsCount={connectionsCount ?? 0}
              eventsCount={memberEvents.length}
            />
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
