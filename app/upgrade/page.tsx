import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { UpgradePage } from './UpgradePage'

export default async function UpgradePageRoute() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  if (role !== 'student' && role !== 'wellness_practitioner') {
    redirect('/settings/subscriptions')
  }

  return <UpgradePage />
}
