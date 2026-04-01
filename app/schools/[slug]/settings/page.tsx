import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import GeneralSettingsClient from './components/GeneralSettingsClient'

export default async function SchoolGeneralSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('id, name, slug, short_bio, bio, established_year, status')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  return <GeneralSettingsClient school={school} schoolSlug={slug} />
}
