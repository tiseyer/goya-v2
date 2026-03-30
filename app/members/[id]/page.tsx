import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseService } from '@/lib/supabase/service';
import ConnectButton from '@/app/components/ConnectButton';
import ConnectionsSection from '@/app/components/ConnectionsSection';
import { members as staticMembers } from '@/lib/members-data';

export const dynamic = 'force-dynamic';

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

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Use service role client for profile reads — bypasses RLS so JWT expiry
  // doesn't cause a false 404. Middleware already enforces authentication.
  const serviceClient = getSupabaseService();

  const { data: profileData } = await serviceClient
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url, bio, introduction, city, country, member_type, role, verification_status, instagram, youtube, website, facebook, tiktok, practice_format, teacher_status, practice_level, practice_styles, teaching_styles, years_teaching, languages, mrn, created_at')
    .eq('id', id)
    .single();

  const STATIC_ROLE_MAP: Record<string, string> = {
    Teacher: 'teacher',
    Student: 'student',
    School: 'school',
    'Wellness Practitioner': 'wellness_practitioner',
  };

  const staticMember = !profileData ? staticMembers.find(m => m.id === id) : null;
  if (!profileData && !staticMember) notFound();

  const profile = profileData ?? (() => {
    const m = staticMember!;
    const nameParts = m.name.split(' ');
    return {
      id: m.id,
      full_name: m.name,
      first_name: nameParts[0] ?? null,
      last_name: nameParts.slice(1).join(' ') || null,
      avatar_url: m.photo ?? null,
      bio: m.bio ?? null,
      introduction: m.introduction ?? null,
      city: m.city ?? null,
      country: m.country ?? null,
      member_type: STATIC_ROLE_MAP[m.role] ?? 'student',
      role: STATIC_ROLE_MAP[m.role] ?? 'student',
      verification_status: m.is_verified ? 'verified' : null,
      instagram: m.social.instagram ?? null,
      youtube: m.social.youtube ?? null,
      website: m.social.website ?? null,
      facebook: null as string | null,
      tiktok: null as string | null,
      practice_format: null as string | null,
      teacher_status: null as string | null,
      practice_level: null as string | null,
      practice_styles: null as string[] | null,
      teaching_styles: m.teachingStyles as string[] | null,
      years_teaching: null as number | null,
      languages: null as string[] | null,
      mrn: null as string | null,
      created_at: m.memberSince ? `${m.memberSince}-01-01` : null,
    };
  })();

  const displayName =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.full_name ||
    'Unknown Member';

  const firstName = profile.first_name ?? displayName.split(' ')[0] ?? '';
  const role = profile.member_type ?? profile.role ?? 'student';
  const heroStyle = ROLE_HERO[role] ?? ROLE_HERO['student'];
  const roleLabel = ROLE_LABEL[role] ?? role;
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#1B3A5C] via-[#1B3A5C] to-[#1e3a5f] pt-20 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4E87A0] opacity-[0.05] rounded-full blur-3xl translate-x-1/2 -translate-y-1/4" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          {/* Back link */}
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-10 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Directory
          </Link>

          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
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
            <div className="text-center sm:text-left pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-3 justify-center sm:justify-start">
                <span className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full ${heroStyle.badge}`}>
                  {roleLabel}
                </span>
                {profile.verification_status === 'verified' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs font-semibold border border-blue-400/30">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 leading-tight">
                {displayName}
              </h1>

              {profile.introduction && (
                <p className="text-slate-300 text-sm mt-1 italic">{profile.introduction}</p>
              )}

              {(profile.city || profile.country) && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-slate-400 text-sm mt-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
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

            {/* Teaching / Practice styles */}
            {((profile.teaching_styles?.length ?? 0) > 0 || (profile.practice_styles?.length ?? 0) > 0) && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
                  {role === 'teacher' ? 'Teaching Styles' : 'Practice Styles'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(role === 'teacher' ? profile.teaching_styles : profile.practice_styles)?.map((style: string) => (
                    <span
                      key={style}
                      className="bg-[#4E87A0]/10 text-[#3A7190] border border-[#4E87A0]/20 text-sm font-medium px-4 py-1.5 rounded-full"
                    >
                      {style}
                    </span>
                  ))}
                </div>
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
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
