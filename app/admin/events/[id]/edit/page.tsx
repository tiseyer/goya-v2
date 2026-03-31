import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSupabaseService } from '@/lib/supabase/service';
import type { Event } from '@/lib/types';
import EventForm from '../../components/EventForm';

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string | null;
  performed_by_role: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}

interface AuditEntryWithProfile extends AuditEntry {
  profiles: { full_name: string; email: string } | null;
}

const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  created:        { label: 'Created',        icon: 'M12 4v16m8-8H4',                                         color: 'text-emerald-500' },
  edited:         { label: 'Edited',         icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: 'text-blue-500' },
  status_changed: { label: 'Status changed', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',         color: 'text-amber-500' },
  deleted:        { label: 'Deleted',        icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', color: 'text-red-500' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Fetch event
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error || !data) notFound();

  // Check user role for audit visibility
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();
  const userRole = (profileRow?.role as string) ?? 'moderator';
  const isAdmin = userRole === 'admin';

  // Fetch audit log (service role to bypass RLS — admin-only section)
  let auditEntries: AuditEntryWithProfile[] = [];
  if (isAdmin) {
    const serviceClient = getSupabaseService();
    const { data: auditData } = await serviceClient
      .from('event_audit_log')
      .select('*, profiles!performed_by(full_name, email)')
      .eq('event_id', id)
      .order('created_at', { ascending: true });
    auditEntries = (auditData as AuditEntryWithProfile[]) ?? [];
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Edit Event</h1>
        <p className="text-sm text-[#6B7280] mt-0.5 truncate max-w-lg">{(data as Event).title}</p>
      </div>
      <EventForm event={data as Event} />

      {/* Audit History — Admin only */}
      {isAdmin && auditEntries.length > 0 && (
        <div className="mt-10 max-w-3xl">
          <h2 className="text-lg font-bold text-[#1B3A5C] mb-4">Event History</h2>
          <div className="relative pl-6 border-l-2 border-[#E5E7EB]">
            {auditEntries.map((entry) => {
              const actionInfo = ACTION_LABELS[entry.action] ?? ACTION_LABELS.edited;
              const performer = entry.profiles?.full_name || entry.profiles?.email || 'System';

              return (
                <div key={entry.id} className="relative mb-6 last:mb-0">
                  {/* Dot on timeline */}
                  <div className={`absolute -left-[25px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    entry.action === 'created' ? 'bg-emerald-400' :
                    entry.action === 'deleted' ? 'bg-red-400' :
                    entry.action === 'status_changed' ? 'bg-amber-400' :
                    'bg-blue-400'
                  }`} />

                  {/* Content */}
                  <div className="bg-white border border-[#E5E7EB] rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${actionInfo.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={actionInfo.icon} />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#374151]">
                          <span className="font-semibold">{actionInfo.label}</span>
                          {' by '}
                          <span className="font-medium text-[#1B3A5C]">{performer}</span>
                          {entry.performed_by_role && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-1.5 capitalize">
                              {entry.performed_by_role}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(entry.created_at)}</p>

                        {/* Show changed fields for 'edited' action */}
                        {entry.action === 'edited' && entry.changes && (
                          <div className="mt-2 text-xs text-[#6B7280] space-y-0.5">
                            {Object.entries(entry.changes).map(([field, value]) => {
                              const change = value as { old?: unknown; new?: unknown } | unknown;
                              if (change && typeof change === 'object' && 'old' in change && 'new' in change) {
                                return (
                                  <p key={field}>
                                    <span className="font-medium text-[#374151]">{field.replace(/_/g, ' ')}</span>
                                    {': '}
                                    <span className="line-through text-[#9CA3AF]">{String((change as { old: unknown }).old)}</span>
                                    {' -> '}
                                    <span className="text-[#374151]">{String((change as { new: unknown }).new)}</span>
                                  </p>
                                );
                              }
                              return (
                                <p key={field}>
                                  <span className="font-medium text-[#374151]">{field.replace(/_/g, ' ')}</span>
                                  {': '}{String(value)}
                                </p>
                              );
                            })}
                          </div>
                        )}

                        {/* Show status change details */}
                        {entry.action === 'status_changed' && entry.changes && (() => {
                          const changes = entry.changes as Record<string, unknown>;
                          const oldStatus = changes.old_status ? String(changes.old_status) : null;
                          const newStatus = changes.new_status ? String(changes.new_status) : null;
                          const rejectionReason = changes.rejection_reason ? String(changes.rejection_reason) : null;
                          return (
                            <div className="mt-2 text-xs text-[#6B7280]">
                              {oldStatus && (
                                <p>
                                  Status changed from{' '}
                                  <span className="font-medium capitalize">{oldStatus}</span>
                                  {' to '}
                                  <span className="font-medium capitalize">{newStatus}</span>
                                </p>
                              )}
                              {rejectionReason && (
                                <p className="mt-1 text-red-600">
                                  Reason: {rejectionReason}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
