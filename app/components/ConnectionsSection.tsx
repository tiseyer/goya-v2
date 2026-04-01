'use client';

import { useConnections } from '@/app/context/ConnectionsContext';

// ─── Main component ───────────────────────────────────────────────────────────

interface ConnectionsSectionProps {
  profileMemberId: string;
  isOwnProfile?: boolean;
}

export default function ConnectionsSection({ profileMemberId: _profileMemberId, isOwnProfile }: ConnectionsSectionProps) {
  const { connections } = useConnections();

  // Phase 4: only show connections on own profile (using context data)
  // Phase 6 will add server-side query for viewing other users' connections
  if (!isOwnProfile) return null;

  const acceptedConnections = Object.values(connections).filter(c => c.status === 'accepted');

  if (acceptedConnections.length === 0) {
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
        <span className="ml-2 text-sm font-normal text-[#6B7280]">({acceptedConnections.length})</span>
      </h2>
      <div className="divide-y divide-[#E5E7EB]">
        {acceptedConnections.map(conn => (
          <div key={conn.connectionId} className="flex items-center gap-3 py-3 px-3">
            {conn.memberPhoto && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conn.memberPhoto}
                alt={conn.memberName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-[#1B3A5C] truncate">
                {conn.memberName || 'Member'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
