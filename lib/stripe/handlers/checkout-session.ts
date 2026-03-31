import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'
import type { HandlerResult } from './subscription'

export async function handleCheckoutSession(
  event: Stripe.CheckoutSessionCompletedEvent,
): Promise<HandlerResult> {
  const session = event.data.object as Stripe.Checkout.Session

  if (session.metadata?.type === 'school_registration') {
    return handleSchoolRegistration(session)
  }

  // Only handle teacher upgrade sessions
  if (session.metadata?.type !== 'teacher_upgrade') {
    return { status: 'processed' }
  }

  const userId = session.metadata.user_id
  const certificateUrls: string[] = JSON.parse(session.metadata.certificate_urls ?? '[]')
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null

  const supabase = getSupabaseService()

  // Insert upgrade_request — status defaults to 'pending' per DB schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('upgrade_requests')
    .insert({
      user_id: userId,
      certificate_urls: certificateUrls,
      stripe_payment_intent_id: paymentIntentId,
    })

  if (insertError) {
    throw new Error(`upgrade_requests insert failed: ${insertError.message}`)
  }

  // Notify all admins (UPG-09)
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notifications').insert(
      admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'teacher_upgrade_submitted',
        title: 'New Teacher Upgrade Request',
        body: 'A member has submitted a teacher upgrade request for review.',
        link: '/admin/inbox',
        actor_id: userId,
      }))
    )
  }

  return { status: 'processed' }
}

async function handleSchoolRegistration(
  session: Stripe.Checkout.Session,
): Promise<HandlerResult> {
  const meta = session.metadata ?? {}
  const userId = meta.user_id
  const schoolName = meta.school_name
  const schoolSlug = meta.school_slug
  const designationTypes: string[] = JSON.parse(meta.designation_types ?? '[]')

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null

  const supabase = getSupabaseService()

  // Insert school record with status='pending'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school, error: schoolError } = await (supabase as any)
    .from('schools')
    .insert({
      owner_id: userId,
      name: schoolName,
      slug: schoolSlug,
      status: 'pending',
    })
    .select('id')
    .single()

  if (schoolError) {
    // Unique violation (23505) means school was already created — idempotent
    if (schoolError.code === '23505') {
      console.log(`[webhook] school already exists for user ${userId} or slug ${schoolSlug} — skipping`)
      return { status: 'processed' }
    }
    throw new Error(`schools insert failed: ${schoolError.message}`)
  }

  // Insert one school_designations row per designation type
  const designationRows = designationTypes.map((type: string) => ({
    school_id: school.id,
    designation_type: type,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: process.env.STRIPE_SCHOOL_ANNUAL_PRICE_ID ?? null,
    signup_fee_paid: true,
    signup_fee_amount: 9900,
    annual_fee_amount: 4000,
  }))

  if (designationRows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: desigError } = await (supabase as any)
      .from('school_designations')
      .insert(designationRows)

    if (desigError) {
      throw new Error(`school_designations insert failed: ${desigError.message}`)
    }
  }

  // Link school to the teacher's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({ principal_trainer_school_id: school.id })
    .eq('id', userId)

  if (profileError) {
    console.error(`[webhook] profiles update failed: ${profileError.message}`)
  }

  // Notify all admins
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notifications').insert(
      admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'school_registration_submitted',
        title: 'New School Registration',
        body: `${schoolName} has been registered and is pending review.`,
        link: '/admin/inbox',
        actor_id: userId,
      }))
    )
  }

  return { status: 'processed' }
}
