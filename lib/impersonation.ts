import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'

export const IMPERSONATION_COOKIE = 'goya_impersonating'
export const IMPERSONATION_LOG_COOKIE = 'goya_impersonation_log_id'

export interface ImpersonationState {
  isImpersonating: boolean
  targetUserId: string | null
  targetProfile: { id: string; full_name: string | null; email: string | null; mrn: string | null; role: string | null; member_type: string | null; avatar_url: string | null; username: string | null } | null
  adminId: string | null
  adminProfile: { id: string; full_name: string | null; role: string | null } | null
}

// Cast once — service client is untyped (no generated DB schema)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svc = () => getSupabaseService() as any

export async function getImpersonationState(): Promise<ImpersonationState> {
  const cookieStore = await cookies()
  const targetUserId = cookieStore.get(IMPERSONATION_COOKIE)?.value ?? null

  if (!targetUserId) {
    return { isImpersonating: false, targetUserId: null, targetProfile: null, adminId: null, adminProfile: null }
  }

  // Get admin identity
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { isImpersonating: false, targetUserId: null, targetProfile: null, adminId: null, adminProfile: null }
  }

  // Fetch both profiles using service client (to bypass RLS for any role)
  const [{ data: adminProfile }, { data: targetProfile }] = await Promise.all([
    svc().from('profiles').select('id, full_name, role').eq('id', user.id).single(),
    svc().from('profiles').select('id, full_name, role, member_type, mrn, avatar_url, username').eq('id', targetUserId).single(),
  ])

  // Also get target user's email from auth.users via service client
  const { data: targetAuthUser } = await getSupabaseService().auth.admin.getUserById(targetUserId)

  return {
    isImpersonating: true,
    targetUserId,
    targetProfile: targetProfile ? { ...targetProfile, email: targetAuthUser?.user?.email ?? null } : null,
    adminId: user.id,
    adminProfile: adminProfile ?? null,
  }
}

export async function logImpersonationAction(action: string, details: object) {
  const cookieStore = await cookies()
  const logId = cookieStore.get(IMPERSONATION_LOG_COOKIE)?.value
  if (!logId) return

  // Read existing actions
  const { data: existing } = await svc()
    .from('impersonation_log')
    .select('actions_taken')
    .eq('id', logId)
    .single()

  const actions = Array.isArray(existing?.actions_taken) ? existing.actions_taken : []
  actions.push({ action, details, timestamp: new Date().toISOString() })

  await svc()
    .from('impersonation_log')
    .update({ actions_taken: actions })
    .eq('id', logId)
}
