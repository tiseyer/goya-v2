'use client';

import { useState } from 'react';

interface AttendeeProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

const INITIAL_DISPLAY = 20;

export default function EventAttendeesSection({ attendees }: { attendees: AttendeeProfile[] }) {
  const [expanded, setExpanded] = useState(false);
  const display = expanded ? attendees : attendees.slice(0, INITIAL_DISPLAY);
  const hiddenCount = attendees.length - INITIAL_DISPLAY;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <h2 className="text-base font-bold text-primary-dark mb-4">Attendees</h2>
      <div className="flex flex-wrap gap-3">
        {display.map(a => (
          <div key={a.id} className="flex items-center gap-2">
            {a.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.avatar_url} alt={a.full_name ?? ''} className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-light/15 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {(a.full_name ?? '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700">{a.full_name ?? 'Unknown'}</span>
          </div>
        ))}
      </div>
      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm text-primary hover:underline font-medium"
        >
          Show all {attendees.length} attendees
        </button>
      )}
    </div>
  );
}
