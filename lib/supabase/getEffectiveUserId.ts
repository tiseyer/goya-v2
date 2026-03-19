import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { IMPERSONATION_COOKIE } from '@/lib/impersonation'

// Returns the userId for data queries: impersonated user if active, else real auth.uid()
export async function getEffectiveUserId(): Promise<string> {
  const cookieStore = await cookies()
  const impersonating = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (impersonating) return impersonating

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

// Returns service client (bypasses RLS) when impersonating, normal server client otherwise
export async function getEffectiveClient() {
  const cookieStore = await cookies()
  const impersonating = cookieStore.get(IMPERSONATION_COOKIE)?.value
  if (impersonating) return getSupabaseService()
  return createSupabaseServerClient()
}
