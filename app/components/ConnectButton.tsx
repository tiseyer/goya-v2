'use client';

import { useRouter } from 'next/navigation';
import { useConnections } from '@/app/context/ConnectionsContext';
import Button from '@/app/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectButtonProps {
  memberId: string;           // UUID from profiles.id
  memberName: string;
  memberPhoto: string;
  firstName: string;          // e.g. 'Jennifer'
  viewerRole: string | null;  // viewer's member_type (null = unauthenticated)
  profileRole: string;        // profile owner's derived role
  isOwnProfile: boolean;      // hide button entirely when true
  isOwnSchool?: boolean;      // show "Manage School" when true
}

// ─── Role-pair lookup table ───────────────────────────────────────────────────

const ROLE_PAIR_MAP: Record<string, { label: string; type: 'peer' | 'mentorship' | 'faculty' }> = {
  'student:teacher':              { label: 'Request Mentorship', type: 'mentorship' },
  'teacher:school':               { label: 'Apply as Faculty',   type: 'faculty'    },
  'wellness_practitioner:school': { label: 'Apply as Faculty',   type: 'faculty'    },
};

// ─── Pending-sent label lookup ────────────────────────────────────────────────

const PENDING_SENT_LABEL: Record<string, string> = {
  peer:       'Request Sent',
  mentorship: 'Mentorship Requested',
  faculty:    'Application Sent',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ConnectButton({
  memberId,
  memberName,
  memberPhoto,
  firstName,
  viewerRole,
  profileRole,
  isOwnProfile,
  isOwnSchool = false,
}: ConnectButtonProps) {
  const router = useRouter();
  const { getStatus, sendRequest, acceptRequest, declineRequest, connections } = useConnections();
  const status = getStatus(memberId);
  const conn = connections[memberId];

  // Own profile: hide entirely
  if (isOwnProfile) return null;

  // Own school: show "Manage School" navigation button
  if (isOwnSchool) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => router.push('/settings')}>
        Manage School
      </Button>
    );
  }

  // Pending sent: type-aware label
  if (status === 'pending_sent') {
    const connType = conn?.type ?? 'peer';
    const label = PENDING_SENT_LABEL[connType] ?? 'Request Sent';
    return (
      <Button
        disabled
        className="w-full bg-slate-100 text-slate-500 cursor-not-allowed border-transparent hover:bg-slate-100"
        icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <span className="sr-only">Pending: </span>{label}
      </Button>
    );
  }

  // Pending received: Accept + Decline
  if (status === 'pending_received' && conn) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-slate-400 text-center mb-1">{firstName} wants to connect</p>
        <Button variant="primary" className="w-full" onClick={() => acceptRequest(conn.connectionId, memberId)}>
          Accept Request
        </Button>
        <Button
          variant="ghost"
          className="w-full border border-rose-300 text-rose-500 hover:bg-rose-50"
          onClick={() => declineRequest(conn.connectionId, memberId)}
        >
          Decline
        </Button>
      </div>
    );
  }

  // Accepted: Connected + Message
  if (status === 'accepted') {
    return (
      <div className="flex flex-col gap-2">
        <Button
          disabled
          className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed hover:bg-emerald-50"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          }
        >
          <span className="sr-only">Status: </span>Connected
        </Button>
        <Button variant="secondary" className="w-full">
          Message
        </Button>
      </div>
    );
  }

  // Default: role-aware CTA
  const cta = (viewerRole ? ROLE_PAIR_MAP[`${viewerRole}:${profileRole}`] : null)
    ?? { label: `Connect with ${firstName}`, type: 'peer' as const };

  return (
    <Button
      variant="primary"
      className="w-full"
      onClick={() => sendRequest(memberId, memberName, memberPhoto, cta.type)}
    >
      {cta.label}
    </Button>
  );
}
