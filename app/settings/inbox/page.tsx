'use client';
import { useState } from 'react';
import { useConnections } from '@/app/context/ConnectionsContext';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'peer', label: 'Peer' },
  { key: 'mentorship', label: 'Mentorship' },
  { key: 'faculty', label: 'Faculty' },
] as const;

export default function SettingsInboxPage() {
  const { connections, acceptRequest, declineRequest } = useConnections();
  const [filterType, setFilterType] = useState<string>('all');

  const incoming = Object.values(connections)
    .filter(conn => conn.status === 'pending_received')
    .filter(conn => filterType === 'all' || conn.type === filterType);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Inbox</h1>

      {/* Filter bar */}
      <div className="flex gap-2 mb-4">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilterType(opt.key)}
            className={[
              'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
              filterType === opt.key
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 border border-[#E5E7EB] hover:bg-slate-50',
            ].join(' ')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        {incoming.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-slate-500">No incoming requests</p>
          </div>
        ) : (
          incoming.map(conn => (
            <div
              key={conn.connectionId}
              className="flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6] last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <img
                  src={conn.memberPhoto || '/default-avatar.png'}
                  alt={conn.memberName}
                  className="w-10 h-10 rounded-full object-cover bg-slate-100"
                />
                <div>
                  <p className="text-sm font-medium text-[#1B3A5C]">{conn.memberName || 'Unknown Member'}</p>
                  <Badge variant="muted" size="sm">{conn.type}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => acceptRequest(conn.connectionId, conn.memberId)}
                >
                  Accept
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => declineRequest(conn.connectionId, conn.memberId)}
                >
                  Decline
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
