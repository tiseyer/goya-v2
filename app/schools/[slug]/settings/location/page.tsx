import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import LocationClient from './LocationClient'

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('location_address, location_city, location_country, location_lat, location_lng, location_place_id')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  return <LocationClient school={school} schoolSlug={slug} />
}
