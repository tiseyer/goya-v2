'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getStripe } from '@/lib/stripe/client'

export async function createSchoolCheckoutSession(
  schoolName: string,
  slug: string,
  designationTypes: string[],
): Promise<{ url: string } | { error: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  if (designationTypes.length === 0) {
    return { error: 'Please select at least one designation' }
  }

  const annualPriceId = process.env.STRIPE_SCHOOL_ANNUAL_PRICE_ID
  const signupPriceId = process.env.STRIPE_SCHOOL_SIGNUP_PRICE_ID

  if (!annualPriceId || !signupPriceId) {
    return { error: 'Stripe school prices not configured' }
  }

  // One subscription line item per designation (identical annual price shared across all types)
  const lineItems = designationTypes.map(() => ({
    price: annualPriceId,
    quantity: 1,
  }))

  // One-time signup fee per designation added as invoice items
  const addInvoiceItems = designationTypes.map(() => ({
    price: signupPriceId,
  }))

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (getStripe().checkout.sessions.create as any)({
      mode: 'subscription',
      line_items: lineItems,
      subscription_data: {
        // add_invoice_items is a valid Stripe API field but missing from SDK v20 types
        add_invoice_items: addInvoiceItems,
        metadata: {
          type: 'school_registration',
          user_id: user.id,
        },
      },
      metadata: {
        type: 'school_registration',
        user_id: user.id,
        school_name: schoolName,
        school_slug: slug,
        designation_types: JSON.stringify(designationTypes),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/schools/create/success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/schools/create?step=2`,
    })

    return { url: session.url! }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: message }
  }
}
