'use client';

import { useState } from 'react';

interface ScheduledEmail {
  id: string;
  name: string;
  description: string;
  schedule: string;
  templateKey: string;
  templateName: string;
  recipients: string;
  lastSent: string | null;
  active: boolean;
}

const INITIAL_SCHEDULES: ScheduledEmail[] = [
  {
    id: 'admin-digest',
    name: 'Admin Digest',
    description: 'Weekly summary of pending items for admin review',
    schedule: 'Every Monday at 9:00 AM',
    templateKey: 'admin_digest',
    templateName: 'Admin Digest',
    recipients: 'All admins',
    lastSent: null,
    active: true,
  },
  {
    id: 'credits-expiring',
    name: 'Credits Expiry Reminder',
    description: 'Notify members when their CPD credits are about to expire',
    schedule: 'Daily at 8:00 AM (if expiring within 30 days)',
    templateKey: 'credits_expiring',
    templateName: 'Credits Expiring Soon',
    recipients: 'Members with expiring credits',
    lastSent: null,
    active: true,
  },
];

export default function ScheduledTab() {
  const [schedules, setSchedules] = useState<ScheduledEmail[]>(INITIAL_SCHEDULES);

  function toggleActive(id: string) {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Scheduled email jobs that run on a cron schedule. These are managed via Vercel Cron Jobs.
      </p>

      {schedules.length === 0 ? (
        <p className="text-sm text-center text-slate-400 py-8">No scheduled emails configured.</p>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm px-5 py-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{schedule.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        schedule.active
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {schedule.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{schedule.description}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-slate-400">
                    <span>
                      <span className="font-medium text-slate-500">Schedule:</span> {schedule.schedule}
                    </span>
                    <span>
                      <span className="font-medium text-slate-500">Template:</span> {schedule.templateName}
                    </span>
                    <span>
                      <span className="font-medium text-slate-500">Recipients:</span> {schedule.recipients}
                    </span>
                    {schedule.lastSent && (
                      <span>
                        <span className="font-medium text-slate-500">Last sent:</span> {schedule.lastSent}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleActive(schedule.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer shrink-0 ${
                    schedule.active
                      ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                      : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  }`}
                >
                  {schedule.active ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Note:</span> Scheduled emails are powered by
          Vercel Cron Jobs defined in <code className="text-xs bg-white px-1 py-0.5 rounded border border-slate-200">vercel.json</code>.
          Pausing a schedule here prevents the template from being sent, but the cron job itself continues to run.
        </p>
      </div>
    </div>
  );
}
