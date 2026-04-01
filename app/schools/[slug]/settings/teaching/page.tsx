import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import TeachingInfoClient from './TeachingInfoClient'

export default async function TeachingInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('practice_styles, programs_offered, course_delivery_format, lineage, languages')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  return <TeachingInfoClient school={school} schoolSlug={slug} />
}
