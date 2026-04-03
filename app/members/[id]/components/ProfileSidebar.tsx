'use client';

import { Globe, Video, Users, Calendar, Eye } from 'lucide-react';
import ConnectButton from '@/app/components/ConnectButton';
import MessageButton from '@/app/components/MessageButton';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProfileSidebarProps {
  profile: {
    id: string;
    full_name: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    youtube: string | null;
    created_at: string;
    wellness_designations: string[] | null;
    other_org_names: string[] | null;
  };
  displayName: string;
  isOwnProfile: boolean;
  viewerRole: string | null;
  connectionsCount: number;
  eventsCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function buildSocialUrl(type: 'website' | 'instagram' | 'tiktok' | 'facebook' | 'youtube', value: string): string {
  if (value.startsWith('http')) return value;
  switch (type) {
    case 'instagram': return `https://instagram.com/${value.replace('@', '')}`;
    case 'tiktok':    return `https://tiktok.com/@${value.replace('@', '')}`;
    case 'facebook':  return `https://facebook.com/${value}`;
    case 'youtube':   return `https://youtube.com/${value}`;
    default:          return value;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function ProfileSidebar({
  profile,
  displayName,
  isOwnProfile,
  viewerRole,
  connectionsCount,
  eventsCount,
}: ProfileSidebarProps) {
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const designationBadges: string[] = [
    ...(profile.wellness_designations ?? []),
    ...(profile.other_org_names ?? []),
  ];

  const hasSocial =
    !!(profile.website || profile.instagram || profile.facebook || profile.tiktok || profile.youtube);

  return (
    <div className="sticky top-20 space-y-6">

      {/* ── 1. Membership Card ─────────────────────────────────────────────── */}
      <div className="bg-[#1B3A5C] rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#4E87A0] opacity-[0.08] rounded-full blur-2xl translate-x-8 -translate-y-8" />
        <div className="relative">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest">GOYA Member</span>
            <span className="w-2 h-2 bg-[#4E87A0] rounded-full animate-pulse" />
          </div>

          {/* Member since */}
          {memberSince && (
            <p className="text-white font-bold text-lg mb-4">Since {memberSince}</p>
          )}

          {/* Designation badges */}
          {designationBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {designationBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Connect + Message Buttons ───────────────────────────────────── */}
      {!isOwnProfile && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
          <ConnectButton
            memberId={profile.id}
            memberName={displayName}
            memberPhoto={profile.avatar_url ?? ''}
            firstName={profile.first_name ?? displayName.split(' ')[0] ?? ''}
            viewerRole={viewerRole}
            profileRole={profile.role}
            isOwnProfile={isOwnProfile}
          />
          <MessageButton memberId={profile.id} memberName={displayName} />
        </div>
      )}

      {/* ── 3. Social Links ────────────────────────────────────────────────── */}
      {hasSocial && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Connect</h2>
          <div className="flex items-center gap-3">
            {profile.website && (
              <a
                href={buildSocialUrl('website', profile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[var(--goya-primary)]/10 flex items-center justify-center transition-colors"
                aria-label="Website"
              >
                <Globe className="w-5 h-5 text-slate-600" />
              </a>
            )}
            {profile.instagram && (
              <a
                href={buildSocialUrl('instagram', profile.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[var(--goya-primary)]/10 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            )}
            {profile.tiktok && (
              <a
                href={buildSocialUrl('tiktok', profile.tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[var(--goya-primary)]/10 flex items-center justify-center transition-colors"
                aria-label="TikTok"
              >
                <Video className="w-5 h-5 text-slate-600" />
              </a>
            )}
            {profile.facebook && (
              <a
                href={buildSocialUrl('facebook', profile.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[var(--goya-primary)]/10 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {profile.youtube && (
              <a
                href={buildSocialUrl('youtube', profile.youtube)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-[var(--goya-primary)]/10 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── 4. Quick Stats ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Stats</h2>
        <div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Profile Views</span>
            </div>
            <span className="font-semibold text-slate-900">—</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Connections</span>
            </div>
            <span className="font-semibold text-slate-900">{connectionsCount}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Events</span>
            </div>
            <span className="font-semibold text-slate-900">{eventsCount}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
