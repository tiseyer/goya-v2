'use client';

import { useConnections } from '@/app/context/ConnectionsContext';

interface ConnectButtonProps {
  memberId: string;   // slug, e.g. 'jennifer-walsh'
  memberName: string;
  memberPhoto: string;
  firstName: string;  // e.g. 'Jennifer'
}

export default function ConnectButton({ memberId, memberName, memberPhoto, firstName }: ConnectButtonProps) {
  const { getStatus, sendRequest, acceptRequest, declineRequest, connections } = useConnections();
  const status = getStatus(memberId);
  const conn = connections[memberId];

  if (status === 'pending_sent') {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-500 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Request Sent
      </button>
    );
  }

  if (status === 'pending_received' && conn) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-[#6B7280] text-center mb-1">{firstName} wants to connect</p>
        <button
          onClick={() => acceptRequest(conn.connectionId, memberId)}
          className="w-full bg-[#4E87A0] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#3A7190] transition-colors"
        >
          Accept Request
        </button>
        <button
          onClick={() => declineRequest(conn.connectionId, memberId)}
          className="w-full border border-rose-300 text-rose-500 py-2 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
        >
          Decline
        </button>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Connected
        </button>
        <button className="w-full border border-[#E5E7EB] text-[#374151] py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
          Message
        </button>
      </div>
    );
  }

  // Default: not connected
  return (
    <button
      onClick={() => sendRequest(memberId, memberName, memberPhoto)}
      className="w-full bg-[#4E87A0] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#3A7190] transition-colors"
    >
      Connect with {firstName}
    </button>
  );
}
