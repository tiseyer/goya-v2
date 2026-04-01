import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import SubscriptionClient from './SubscriptionClient'

export interface DesignationInfo {
  id: string
  designation_type: string
  status: string
  stripe_subscription_id: string | null
}

export default async function SubscriptionPage({
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

  // Fetch designations with Stripe subscription info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designations } = await (supabase as any)
    .from('school_designations')
    .select('id, designation_type, status, stripe_subscription_id')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  // Check owner's Stripe customer ID (billing portal uses owner profile)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerProfile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', school.owner_id)
    .maybeSingle()

  const hasStripeCustomer = Boolean(ownerProfile?.stripe_customer_id)

  return (
    <SubscriptionClient
      schoolName={school.name}
      schoolSlug={slug}
      designations={designations ?? []}
      hasStripeCustomer={hasStripeCustomer}
    />
  )
}
