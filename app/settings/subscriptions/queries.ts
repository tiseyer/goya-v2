import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'

export type SubscriptionItem = {
  stripeOrderId: string        // stripe_orders.stripe_id
  productName: string          // stripe_products.name
  unitAmount: number           // stripe_prices.unit_amount (cents)
  interval: string             // stripe_prices.interval (e.g. 'year')
  subscriptionStatus: string   // stripe_orders.subscription_status
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null  // ISO string
}

export type DesignationItem = {
  id: string                   // user_designations.id (uuid)
  productName: string          // stripe_products.name
  stripeProductId: string      // user_designations.stripe_product_id
  purchaseDate: string         // ISO string
}

export type SubscriptionsData = {
  profile: {
    role: string
    stripeCustomerId: string | null
  }
  baseMembership: SubscriptionItem | null
  additionalSubscriptions: SubscriptionItem[]
  ownsSchool: boolean
  schoolName: string | null
  designations: DesignationItem[]
}

export async function fetchSubscriptionsData(userId: string): Promise<SubscriptionsData> {
  const supabase = getSupabaseService()

  // Step 1: Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, stripe_customer_id')
    .eq('id', userId)
    .single()

  // Step 2: Fetch active recurring stripe_orders for the user
  const { data: orders } = await supabase
    .from('stripe_orders')
    .select('stripe_id, stripe_price_id, stripe_product_id, subscription_status, cancel_at_period_end, current_period_end, amount_total')
    .eq('user_id', userId)
    .eq('type', 'recurring')
    .eq('subscription_status', 'active')

  // Step 3: Fetch stripe_prices for those price IDs
  const priceIds = [...new Set((orders ?? []).map(o => o.stripe_price_id).filter(Boolean))] as string[]
  const { data: prices } = priceIds.length > 0
    ? await supabase
        .from('stripe_prices')
        .select('stripe_id, unit_amount, interval, interval_count, stripe_product_id')
        .in('stripe_id', priceIds)
    : { data: [] }

  // Step 4: Fetch stripe_products for those product IDs
  const productIds = [...new Set((orders ?? []).map(o => o.stripe_product_id).filter(Boolean))] as string[]
  const { data: products } = productIds.length > 0
    ? await supabase
        .from('stripe_products')
        .select('stripe_id, name')
        .in('stripe_id', productIds)
    : { data: [] }

  // Step 5: Join data in JS using Maps
  const priceMap = new Map((prices ?? []).map(p => [p.stripe_id, p]))
  const productMap = new Map((products ?? []).map(p => [p.stripe_id, p]))

  const subscriptionItems: SubscriptionItem[] = (orders ?? []).map(order => {
    const price = order.stripe_price_id ? priceMap.get(order.stripe_price_id) : undefined
    const product = order.stripe_product_id ? productMap.get(order.stripe_product_id) : undefined
    return {
      stripeOrderId: order.stripe_id,
      productName: product?.name ?? 'Unknown Product',
      unitAmount: price?.unit_amount ?? 0,
      interval: price?.interval ?? '',
      subscriptionStatus: order.subscription_status ?? '',
      cancelAtPeriodEnd: order.cancel_at_period_end ?? false,
      currentPeriodEnd: order.current_period_end ?? null,
    }
  })

  // Classify: membership vs additional subscriptions
  const membershipItems = subscriptionItems.filter(item => item.productName.includes('Membership'))
  const otherItems = subscriptionItems.filter(item => !item.productName.includes('Membership'))

  const baseMembership = membershipItems.length > 0 ? membershipItems[0] : null
  const additionalSubscriptions = [
    ...membershipItems.slice(1),
    ...otherItems,
  ]

  // Step 6: Fetch school ownership
  const { data: school } = await supabase
    .from('schools')
    .select('id, name')
    .eq('owner_id', userId)
    .maybeSingle()

  // Step 7: Fetch active user_designations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designationRows } = await (supabase as any)
    .from('user_designations')
    .select('id, stripe_product_id, stripe_price_id, purchase_date')
    .eq('user_id', userId)
    .is('deleted_at', null)

  // Fetch product names for designation products
  const typedDesignationRows = (designationRows ?? []) as Array<{
    id: string
    stripe_product_id: string
    stripe_price_id: string
    purchase_date: string
  }>
  const designationProductIds = [...new Set(typedDesignationRows.map(d => d.stripe_product_id).filter(Boolean))] as string[]
  const { data: designationProducts } = designationProductIds.length > 0
    ? await supabase
        .from('stripe_products')
        .select('stripe_id, name')
        .in('stripe_id', designationProductIds)
    : { data: [] }

  const designationProductMap = new Map((designationProducts ?? []).map(p => [p.stripe_id, p]))

  const designations: DesignationItem[] = typedDesignationRows.map(row => ({
    id: row.id,
    productName: designationProductMap.get(row.stripe_product_id)?.name ?? 'Unknown Designation',
    stripeProductId: row.stripe_product_id,
    purchaseDate: row.purchase_date,
  }))

  return {
    profile: {
      role: profile?.role ?? 'student',
      stripeCustomerId: profile?.stripe_customer_id ?? null,
    },
    baseMembership,
    additionalSubscriptions,
    ownsSchool: school !== null,
    schoolName: school?.name ?? null,
    designations,
  }
}
