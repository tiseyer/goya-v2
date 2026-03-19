import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { supabaseService } from '@/lib/supabase/service'
import AdminShell from '@/app/admin/components/AdminShell'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(startIso: string, endIso: string | null): string {
  const start = new Date(startIso).getTime()
  const end = endIso ? new Date(endIso).getTime() : Date.now()
  const totalSeconds = Math.floor((end - start) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

type LogRow = {
  id: string
  started_at: string
  ended_at: string | null
  actions_taken: Array<{ action: string; details: object; timestamp: string }> | null
  admin: { id: string; full_name: string | null } | null
  impersonated: { id: string; full_name: string | null } | null
}

export default async function ImpersonationLogPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/admin/dashboard')

  const { data: logs } = await (supabaseService as any)
    .from('impersonation_log')
    .select(`
      id, started_at, ended_at, actions_taken,
      admin:admin_id (id, full_name),
      impersonated:impersonated_user_id (id, full_name)
    `)
    .order('started_at', { ascending: false })
    .limit(100)

  const rows: LogRow[] = logs ?? []

  return (
    <AdminShell>
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Impersonation Log</h1>
          <p className="text-sm text-[#6B7280]">
            <span className="font-medium text-[#374151]">{rows.length}</span> sessions
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
            <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-[#374151]">No impersonation sessions recorded yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Ended</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Actions Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {rows.map(log => {
                    const actionCount = Array.isArray(log.actions_taken) ? log.actions_taken.length : 0
                    return (
                      <LogRowItem
                        key={log.id}
                        log={log}
                        actionCount={actionCount}
                      />
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  )
}

function LogRowItem({ log, actionCount }: { log: LogRow; actionCount: number }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors align-top">
      {/* Admin */}
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-[#1B3A5C]">
          {log.admin?.full_name ?? '—'}
        </span>
      </td>

      {/* User */}
      <td className="px-4 py-3">
        <span className="text-sm text-[#374151]">
          {log.impersonated?.full_name ?? '—'}
        </span>
      </td>

      {/* Started */}
      <td className="px-4 py-3">
        <span className="text-sm text-[#6B7280] whitespace-nowrap">
          {formatDateTime(log.started_at)}
        </span>
      </td>

      {/* Ended */}
      <td className="px-4 py-3">
        {log.ended_at ? (
          <span className="text-sm text-[#6B7280] whitespace-nowrap">
            {formatDateTime(log.ended_at)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Active
          </span>
        )}
      </td>

      {/* Duration */}
      <td className="px-4 py-3">
        <span className="text-sm text-[#6B7280] whitespace-nowrap">
          {formatDuration(log.started_at, log.ended_at)}
        </span>
      </td>

      {/* Actions Taken */}
      <td className="px-4 py-3">
        {actionCount === 0 ? (
          <span className="text-sm text-slate-400">0</span>
        ) : (
          <details className="group">
            <summary className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E87A0] hover:text-[#1B3A5C] transition-colors select-none list-none">
              <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {actionCount} {actionCount === 1 ? 'action' : 'actions'}
            </summary>
            <pre className="mt-2 p-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-[10px] text-[#374151] max-w-xs overflow-auto max-h-48 whitespace-pre-wrap break-all">
              {JSON.stringify(log.actions_taken, null, 2)}
            </pre>
          </details>
        )}
      </td>
    </tr>
  )
}
