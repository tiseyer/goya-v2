import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import SchoolSettingsClient from './SchoolSettingsClient'

export default async function SchoolSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch school (RLS will enforce access — owner or admin can see it)
  const { data: school } = await supabase
    .from('schools')
    .select('*')
    .eq('id', id)
    .single()

  // Auth guard: only owner or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator'

  if (!school || (school.owner_id !== user.id && !isAdmin)) {
    redirect('/dashboard')
  }

  return <SchoolSettingsClient school={school} userId={user.id} isAdmin={isAdmin} />
}
