'use client';

import Link from 'next/link';
import { useState } from 'react';
import { members } from '@/lib/members-data';
import { MOCK_PROFILE_CONNECTIONS } from '@/lib/connections-data';
import { useConnections } from '@/app/context/ConnectionsContext';

// ─── Role badge colors (same as member directory) ─────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  Teacher:                'bg-teal-50 text-teal-700',
  Student:                'bg-blue-50 text-blue-700',
  School:                 'bg-purple-50 text-purple-700',
  'Wellness Practitioner':'bg-emerald-50 text-emerald-700',
};

// ─── Designation pills with "+N more" overflow ───────────────────────────────

function DesignationPills({ designations }: { designations: string[] }) {
  const [showMore, setShowMore] = useState(false);
  const visible = designations.filter(d => d !== 'GOYA Member');
  const first3 = visible.slice(0, 3);
  const rest = visible.slice(3);

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {first3.map(d => (
        <span key={d} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
          {d}
        </span>
      ))}
      {rest.length > 0 && (
        <div className="relative">
          <button
            onClick={e => { e.preventDefault(); setShowMore(v => !v); }}
            className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold hover:bg-slate-300 transition-colors"
          >
            +{rest.length}
          </button>
          {showMore && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-[#E5E7EB] rounded-lg shadow-lg p-2 min-w-[140px]">
              {rest.map(d => (
                <p key={d} className="text-xs text-slate-700 py-0.5">{d}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Verified badge ───────────────────────────────────────────────────────────

const VerifiedBadge = () => (
  <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

// ─── Connection row ───────────────────────────────────────────────────────────

function ConnectionRow({ memberId }: { memberId: string }) {
  const member = members.find(m => m.id === memberId);
  if (!member) return null;
  const badgeCls = ROLE_BADGE[member.role] ?? 'bg-slate-50 text-slate-600';

  return (
    <Link
      href={`/members/${member.id}`}
      className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-[#E5E7EB]"
    >
      {/* Avatar */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.photo}
        alt={member.name}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold text-[#1B3A5C] truncate group-hover:text-[#00B5A3] transition-colors">
            {member.name}
          </span>
          {member.is_verified && <VerifiedBadge />}
        </div>
        <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
          {member.role}
        </span>
        <DesignationPills designations={member.designations} />
      </div>

      {/* Action icons */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Message */}
        <button
          onClick={e => { e.preventDefault(); }}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-[#00B5A3]/10 flex items-center justify-center text-slate-400 hover:text-[#00B5A3] transition-colors"
          title="Message"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>
        {/* More */}
        <button
          onClick={e => { e.preventDefault(); }}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          title="More"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ConnectionsSectionProps {
  profileMemberId: string;
  isOwnProfile?: boolean;
}

export default function ConnectionsSection({ profileMemberId, isOwnProfile }: ConnectionsSectionProps) {
  const { connections } = useConnections();

  // Determine which connections to show
  let connectionSlugs: string[] = [];

  // 1. Pre-populated mock connections (e.g., juan-villegas)
  if (MOCK_PROFILE_CONNECTIONS[profileMemberId]) {
    connectionSlugs = MOCK_PROFILE_CONNECTIONS[profileMemberId];
  } else if (isOwnProfile) {
    // 2. Logged-in user's own connections from context
    connectionSlugs = Object.values(connections)
      .filter(c => c.status === 'accepted')
      .map(c => c.memberSlug);
  }

  if (connectionSlugs.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold text-[#1B3A5C] mb-4 pb-3 border-b border-[#E5E7EB]">
          Community Connections
        </h2>
        <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-sm text-[#6B7280]">
          You have no connections yet. Connect with other members to grow your network.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-xl font-semibold text-[#1B3A5C] mb-4 pb-3 border-b border-[#E5E7EB]">
        Community Connections
        <span className="ml-2 text-sm font-normal text-[#6B7280]">({connectionSlugs.length})</span>
      </h2>
      <div className="divide-y divide-[#E5E7EB]">
        {connectionSlugs.map(slug => (
          <ConnectionRow key={slug} memberId={slug} />
        ))}
      </div>
    </div>
  );
}
