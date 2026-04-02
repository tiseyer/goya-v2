import { notFound } from 'next/navigation';
import { getSupabaseService } from '@/lib/supabase/service';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { PUBLIC_PROFILE_COLUMNS } from '@/lib/members/constants';
import { deriveProfileVisibility } from '@/lib/members/profileVisibility';
import { fetchMemberEvents, fetchMemberCourses } from '@/lib/members/queries';
import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import { fetchSchoolFaculty } from '@/lib/dashboard/queries';
import ConnectionsSection from '@/app/components/ConnectionsSection';
import PageContainer from '@/app/components/ui/PageContainer';
import ProfileHero from './components/ProfileHero';
import { ROLE_LABEL } from './components/ProfileHero';
import ProfileSidebar from './components/ProfileSidebar';
import ProfileBio from './components/ProfileBio';
import ProfileContentPills from './components/ProfileContentPills';
import SchoolAffiliation from './components/SchoolAffiliation';
import FacultyGrid from './components/FacultyGrid';
import CommunitySection from './components/CommunitySection';

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
    member_type: string | null;
    teaching_styles: string[] | null;
    teaching_focus_arr: string[] | null;
    lineage: string[] | null;
    years_teaching: string | null;
    practice_styles: string[] | null;
    practice_level: string | null;
    wellness_focus: string[] | null;
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

  const role = profile.role ?? 'student';

  // ── School faculty for teacher profiles ───────────────────────────────────
  const schoolFaculty =
    role === 'teacher' && affiliatedSchools.length > 0
      ? await fetchSchoolFaculty(serviceClient, affiliatedSchools[0].id, 8)
      : [];

  // ── School-owned data for school profiles ─────────────────────────────────
  type SchoolData = {
    id: string;
    slug: string | null;
    practice_styles: string[] | null;
    programs_offered: string[] | null;
    lineage: string | null;
    course_delivery_format: string | null;
    established_year: number | null;
  } | null;

  let ownSchool: SchoolData = null;
  let ownSchoolFaculty: Awaited<ReturnType<typeof fetchSchoolFaculty>> = [];
  let communityCount = 0;
  let communityStudents: Array<{ id: string; full_name: string; avatar_url: string | null }> = [];

  if (role === 'school') {
    const { data: schoolRecord } = await serviceClient
      .from('schools')
      .select('id, slug, practice_styles, programs_offered, lineage, course_delivery_format, established_year')
      .eq('owner_id', profile.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (schoolRecord) {
      ownSchool = schoolRecord as SchoolData;
      ownSchoolFaculty = await fetchSchoolFaculty(serviceClient, schoolRecord.id, 8);

      // Community: profiles whose faculty_school_ids includes this school
      const { count, data: communityData } = await serviceClient
        .from('profiles')
        .select('id, full_name, avatar_url', { count: 'exact' })
        .contains('faculty_school_ids', [schoolRecord.id])
        .limit(5);

      communityCount = count ?? 0;
      communityStudents = (communityData ?? []) as Array<{ id: string; full_name: string; avatar_url: string | null }>;
    }
  }

  const profileCompletion = isOwnProfile
    ? getProfileCompletion(profileData as unknown as Record<string, unknown>, hasContent)
    : null;

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.full_name ||
    'Unknown Member';

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
            {/* 1. Bio */}
            <ProfileBio bio={profile.bio} />

            {/* 2. Role-specific content pills */}
            <ProfileContentPills
              role={role}
              teaching_styles={profile.teaching_styles}
              teaching_focus_arr={profile.teaching_focus_arr}
              lineage={profile.lineage}
              practice_format={profile.practice_format}
              years_teaching={profile.years_teaching}
              practice_styles={profile.practice_styles}
              practice_level={profile.practice_level}
              wellness_designations={profile.wellness_designations}
              wellness_focus={profile.wellness_focus}
              school_practice_styles={ownSchool?.practice_styles ?? null}
              school_programs_offered={ownSchool?.programs_offered ?? null}
              school_lineage={ownSchool?.lineage ?? null}
              school_course_delivery_format={ownSchool?.course_delivery_format ?? null}
              school_established_year={ownSchool?.established_year ?? null}
            />

            {/* 3. School Affiliation — teacher profiles with affiliated school */}
            {role === 'teacher' && affiliatedSchools.length > 0 && (
              <SchoolAffiliation
                school={affiliatedSchools[0]}
                faculty={schoolFaculty}
              />
            )}

            {/* 4. Faculty Grid — school profiles */}
            {role === 'school' && ownSchoolFaculty.length > 0 && (
              <FacultyGrid
                faculty={ownSchoolFaculty}
                schoolSlug={ownSchool?.slug ?? null}
                schoolId={ownSchool?.id ?? ''}
              />
            )}

            {/* 5. Community Section — school profiles */}
            {role === 'school' && communityCount > 0 && (
              <CommunitySection
                studentCount={communityCount}
                students={communityStudents}
              />
            )}

            {/* 6. Connections */}
            <ConnectionsSection profileMemberId={profile.id} />
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
