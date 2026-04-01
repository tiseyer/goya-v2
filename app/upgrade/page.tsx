import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'
import { redirect } from 'next/navigation'
import { UpgradePage } from './UpgradePage'

export default async function UpgradePageRoute() {
  const userId = await getEffectiveUserId()
  const client = await getEffectiveClient()

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  const role = profile?.role ?? ''
  if (role !== 'student' && role !== 'wellness_practitioner') {
    redirect('/settings/subscriptions')
  }

  return <UpgradePage />
}
