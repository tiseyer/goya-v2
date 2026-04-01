import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import FacultyClient from './FacultyClient'

export default async function FacultyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('id, name, owner_id')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch faculty with profile details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: faculty } = await (supabase as any)
    .from('school_faculty')
    .select('id, profile_id, invited_email, position, status, is_principal_trainer, profiles(id, first_name, last_name, avatar_url)')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  // Fetch owner profile for display
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerProfile } = await (supabase as any)
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', school.owner_id)
    .single()

  const ownerName = ownerProfile
    ? `${ownerProfile.first_name ?? ''} ${ownerProfile.last_name ?? ''}`.trim()
    : school.name

  return (
    <FacultyClient
      schoolId={school.id}
      schoolSlug={slug}
      ownerName={ownerName}
      initialFaculty={faculty ?? []}
    />
  )
}
