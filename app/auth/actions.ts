'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { logAuditEvent } from '@/lib/audit'

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const supabase = await createSupabaseServerActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch profile for audit
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  void logAuditEvent({
    category: 'user',
    action: 'user.login',
    actor_id: user.id,
    actor_name: profile?.full_name ?? user.email ?? undefined,
    actor_role: profile?.role ?? undefined,
    description: `User logged in via email/password`,
  })

  // Flow player handles onboarding display via login trigger
  redirect('/dashboard')
}
