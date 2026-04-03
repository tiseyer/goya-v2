'use client';

import Link from 'next/link';
import { ArrowLeft, MapPin, Pencil } from 'lucide-react';
import ConnectButton from '@/app/components/ConnectButton';
import MessageButton from '@/app/components/MessageButton';
import PageContainer from '@/app/components/ui/PageContainer';

// ─── Constants ─────────────────────────────────────────────────────────────────

export const ROLE_HERO: Record<string, { badge: string }> = {
  teacher: { badge: 'bg-teal-100 text-teal-700 border border-teal-200' },
  student: { badge: 'bg-blue-100 text-blue-700 border border-blue-200' },
  school: { badge: 'bg-purple-100 text-purple-700 border border-purple-200' },
  wellness_practitioner: { badge: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
};

export const ROLE_LABEL: Record<string, string> = {
  teacher: 'Certified Teacher',
  student: 'Student Practitioner',
  school: 'School',
  wellness_practitioner: 'Wellness Practitioner',
};

const FORMAT_PILL: Record<string, { label: string; className: string }> = {
  online:    { label: 'Online',    className: 'bg-[#10B981]/10 text-[#10B981]' },
  in_person: { label: 'In-Person', className: 'bg-[#3B82F6]/10 text-[#3B82F6]' },
  hybrid:    { label: 'Hybrid',    className: 'bg-[#8B5CF6]/10 text-[#8B5CF6]' },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ProfileHeroProps {
  profile: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    introduction: string | null;
    city: string | null;
    country: string | null;
    role: string;
    cover_image_url: string | null;
    practice_format: 'online' | 'in_person' | 'hybrid' | null;
    languages: string[] | null;
    created_at: string;
  };
  displayName: string;
  roleLabel: string;
  isOwnProfile: boolean;
  profileCompletion: {
    score: number;
    missing: Array<{ key: string; label: string; href: string }>;
  } | null;
  viewerRole: string | null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ProfileHero({
  profile,
  displayName,
  roleLabel,
  isOwnProfile,
  profileCompletion,
  viewerRole,
}: ProfileHeroProps) {
  const role = profile.role ?? 'student';
  const heroStyle = ROLE_HERO[role] ?? ROLE_HERO['student'];
  const firstName = profile.first_name ?? displayName.split(' ')[0] ?? '';

  const location = [profile.city, profile.country].filter(Boolean).join(', ');
  const hasLanguages = Array.isArray(profile.languages) && profile.languages.length > 0;
  const formatPill = profile.practice_format ? FORMAT_PILL[profile.practice_format] : null;
  const introText = profile.introduction
    ? profile.introduction.length > 250
      ? profile.introduction.slice(0, 250) + '...'
      : profile.introduction
    : null;

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div
        className={`relative overflow-hidden h-[200px] sm:h-[240px] ${!profile.cover_image_url ? 'bg-[#6E88B0]' : ''}`}
      >
        {profile.cover_image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.cover_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        )}

        {/* Back to Directory link */}
        <PageContainer className="relative h-full flex flex-col justify-start pt-4">
          <Link
            href="/members"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors group w-fit"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Directory
          </Link>
        </PageContainer>
      </div>

      {/* ── Avatar + Info ───────────────────────────────────────────────────── */}
      <PageContainer>
        {/* Avatar — overlaps hero via negative margin */}
        <div className="-mt-16 mb-4">
          <div className="w-[120px] h-[120px] rounded-full ring-4 ring-white overflow-hidden bg-slate-200 shadow-lg flex items-center justify-center">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-white bg-[#6E88B0] w-full h-full flex items-center justify-center">
                {displayName[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
        </div>

        {/* Name + role badge */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${heroStyle.badge}`}>
            {roleLabel}
          </span>
        </div>

        {/* Introduction */}
        {introText && (
          <p className="text-muted-foreground italic text-sm mb-3 max-w-2xl">{introText}</p>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{location}</span>
          </div>
        )}

        {/* Language pills + format pill */}
        {(hasLanguages || formatPill) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {hasLanguages && profile.languages!.map((lang) => (
              <span
                key={lang}
                className="rounded-full bg-[#6E88B0]/10 text-[#6E88B0] px-3 py-1 text-sm"
              >
                {lang}
              </span>
            ))}
            {formatPill && (
              <span className={`rounded-full px-3 py-1 text-sm ${formatPill.className}`}>
                {formatPill.label}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isOwnProfile && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <ConnectButton
              memberId={profile.id}
              memberName={displayName}
              memberPhoto={profile.avatar_url ?? ''}
              firstName={firstName}
              viewerRole={viewerRole}
              profileRole={role}
              isOwnProfile={isOwnProfile}
            />
            <MessageButton memberId={profile.id} memberName={displayName} />
          </div>
        )}

        {/* Edit Profile button — own profile only */}
        {isOwnProfile && (
          <div className="mb-4">
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Link>
          </div>
        )}

        {/* Completion nudge banner — own profile, score < 100 */}
        {isOwnProfile && profileCompletion && profileCompletion.score < 100 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
              <span className="text-sm font-bold text-amber-700">{profileCompletion.score}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-amber-100 rounded-full h-1.5 mb-3">
              <div
                className="bg-amber-500 h-1.5 rounded-full transition-all"
                style={{ width: `${profileCompletion.score}%` }}
              />
            </div>
            {profileCompletion.missing.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="text-xs text-amber-700">Missing:</span>
                {profileCompletion.missing.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    className="text-amber-700 underline text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
