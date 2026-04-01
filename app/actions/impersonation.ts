'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { IMPERSONATION_COOKIE, IMPERSONATION_LOG_COOKIE } from '@/lib/impersonation'

const COOKIE_MAX_AGE = 60 * 60 * 2 // 2 hours

// Shorthand — cast once to avoid repetition throughout this file
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const svc = () => getSupabaseService() as any

export async function startImpersonation(targetUserId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Only role='admin' can impersonate (NOT moderator)
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (adminProfile?.role !== 'admin') throw new Error('Only admins can impersonate users')

  // Cannot impersonate yourself
  if (user.id === targetUserId) throw new Error('Cannot impersonate yourself')

  // Cannot impersonate another admin or moderator
  const { data: targetProfile } = await svc()
    .from('profiles')
    .select('role')
    .eq('id', targetUserId)
    .single() as { data: { role: string } | null }
  if (targetProfile?.role === 'admin' || targetProfile?.role === 'moderator') {
    throw new Error('Cannot impersonate admin or moderator users')
  }

  // Create log entry
  const { data: logEntry } = await svc()
    .from('impersonation_log')
    .insert({ admin_id: user.id, impersonated_user_id: targetUserId })
    .select('id')
    .single() as { data: { id: string } | null }

  // Set httpOnly cookies
  const cookieStore = await cookies()
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  }
  cookieStore.set(IMPERSONATION_COOKIE, targetUserId, cookieOpts)
  cookieStore.set(IMPERSONATION_LOG_COOKIE, logEntry?.id ?? '', cookieOpts)

  redirect('/dashboard')
}

export async function endImpersonation() {
  const cookieStore = await cookies()
  const logId = cookieStore.get(IMPERSONATION_LOG_COOKIE)?.value

  // Update log entry with ended_at
  if (logId) {
    await svc()
      .from('impersonation_log')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', logId)
  }

  // Delete both cookies
  cookieStore.delete(IMPERSONATION_COOKIE)
  cookieStore.delete(IMPERSONATION_LOG_COOKIE)

  redirect('/admin/users')
}
