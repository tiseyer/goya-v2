'use client';
import { useState, useEffect } from 'react';
import { useConnections } from '@/app/context/ConnectionsContext';
import { supabase } from '@/lib/supabase';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';

const TABS = [
  { key: 'connections', label: 'My Connections' },
  { key: 'mentors', label: 'My Mentors' },
  { key: 'mentees', label: 'My Mentees' },
  { key: 'faculty', label: 'My Faculty' },
  { key: 'schools', label: 'My Schools' },
] as const;

const PRINCIPAL_TAB = { key: 'principal', label: 'Principal Teacher' } as const;

export default function SettingsConnectionsPage() {
  const { connections, removeConnection } = useConnections();
  const [activeTab, setActiveTab] = useState<string>('connections');
  const [isSchoolOwner, setIsSchoolOwner] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('schools')
          .select('id')
          .eq('owner_id', data.user.id)
          .limit(1)
          .then(({ data: schools }) => {
            setIsSchoolOwner((schools?.length ?? 0) > 0);
          });
      }
    });
  }, []);

  const tabs = isSchoolOwner ? [...TABS, PRINCIPAL_TAB] : [...TABS];

  const filtered = Object.values(connections).filter(conn => {
    if (activeTab === 'connections') return conn.type === 'peer';
    if (activeTab === 'mentors') return conn.type === 'mentorship' && conn.role === 'receiver';
    if (activeTab === 'mentees') return conn.type === 'mentorship' && conn.role === 'requester';
    if (activeTab === 'faculty') return conn.type === 'faculty';
    if (activeTab === 'schools') return conn.type === 'faculty' && conn.role === 'requester';
    if (activeTab === 'principal') return conn.type === 'faculty' && conn.role === 'receiver';
    return false;
  });

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Connections</h1>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
        <div className="flex border-b border-[#E5E7EB] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-500 hover:text-primary-dark',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-slate-500">No connections yet</p>
          </div>
        ) : (
          filtered.map(conn => (
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={conn.status === 'accepted' ? 'subtle' : 'muted'} size="sm">
                      {conn.status === 'accepted' ? 'Connected' : conn.status === 'pending_sent' ? 'Pending' : 'Incoming'}
                    </Badge>
                    <span className="text-xs text-slate-400">{conn.type}</span>
                  </div>
                </div>
              </div>
              {conn.status === 'accepted' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeConnection(conn.connectionId, conn.memberId)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
