'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

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

  const { data: state } = await supabase
    .from('onboarding_state')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!state) {
    await supabase.from('onboarding_state').insert({ user_id: user.id })
  }

  if (!state?.onboarding_complete) {
    redirect('/onboarding')
  }

  redirect('/welcome')
}
