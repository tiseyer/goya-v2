'use client';

import { useState } from 'react';

interface TriggeredEmail {
  id: string;
  event: string;
  description: string;
  templateKey: string;
  templateName: string;
  recipientType: string;
  active: boolean;
}

const INITIAL_TRIGGERS: TriggeredEmail[] = [
  {
    id: 'welcome',
    event: 'User registers',
    description: 'Welcome email sent after successful account creation',
    templateKey: 'welcome',
    templateName: 'Welcome to GOYA',
    recipientType: 'New user',
    active: true,
  },
  {
    id: 'onboarding-complete',
    event: 'Onboarding completed',
    description: 'Confirmation email after profile setup is finished',
    templateKey: 'onboarding_complete',
    templateName: 'Onboarding Complete',
    recipientType: 'User',
    active: true,
  },
  {
    id: 'verification-approved',
    event: 'Verification approved',
    description: 'Notification when admin approves a member verification',
    templateKey: 'verification_approved',
    templateName: 'Verification Approved',
    recipientType: 'User',
    active: true,
  },
  {
    id: 'verification-rejected',
    event: 'Verification rejected',
    description: 'Notification when admin rejects a member verification',
    templateKey: 'verification_rejected',
    templateName: 'Verification Rejected',
    recipientType: 'User',
    active: true,
  },
  {
    id: 'school-approved',
    event: 'School approved',
    description: 'Notification when admin approves a school registration',
    templateKey: 'school_approved',
    templateName: 'School Approved',
    recipientType: 'School owner',
    active: true,
  },
  {
    id: 'school-rejected',
    event: 'School rejected',
    description: 'Notification when admin rejects a school registration',
    templateKey: 'school_rejected',
    templateName: 'School Rejected',
    recipientType: 'School owner',
    active: true,
  },
  {
    id: 'password-reset',
    event: 'Password reset requested',
    description: 'Password reset link sent via Supabase auth flow',
    templateKey: 'password_reset',
    templateName: 'Password Reset',
    recipientType: 'User',
    active: true,
  },
  {
    id: 'faculty-invite',
    event: 'Faculty member invited',
    description: 'Invitation email sent when a school invites a new faculty member',
    templateKey: 'faculty_invite',
    templateName: 'Faculty Invite',
    recipientType: 'Invited user',
    active: true,
  },
  {
    id: 'new-message',
    event: 'New direct message',
    description: 'Notification when a member receives a new direct message',
    templateKey: 'new_message',
    templateName: 'New Message',
    recipientType: 'Message recipient',
    active: true,
  },
];

export default function TriggeredTab() {
  const [triggers, setTriggers] = useState<TriggeredEmail[]>(INITIAL_TRIGGERS);

  function toggleActive(id: string) {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Triggered emails are sent automatically when specific events happen on the platform.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trigger Event</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Template</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recipient</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
            </tr>
          </thead>
          <tbody>
            {triggers.map((trigger) => (
              <tr key={trigger.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-800">{trigger.event}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{trigger.description}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {trigger.templateKey}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{trigger.recipientType}</td>
                <td className="py-3 px-4">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                      trigger.active
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {trigger.active ? 'Active' : 'Paused'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => toggleActive(trigger.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors cursor-pointer ${
                      trigger.active
                        ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {trigger.active ? 'Pause' : 'Resume'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">Note:</span> Trigger rules are documentation
          of the existing sending logic in the codebase. Pausing a trigger here sets the template to
          inactive, which prevents the email from being sent. The trigger event itself still fires.
        </p>
      </div>
    </div>
  );
}
