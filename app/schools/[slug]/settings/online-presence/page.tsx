import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import OnlinePresenceClient from './OnlinePresenceClient'

export default async function OnlinePresencePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('website, instagram, facebook, tiktok, youtube, video_platform, video_url')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  return <OnlinePresenceClient school={school} schoolSlug={slug} />
}
