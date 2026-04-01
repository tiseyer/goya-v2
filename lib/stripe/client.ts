import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RESTRICTED_KEY_V1
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY or STRIPE_RESTRICTED_KEY_V1 is not set')
    }
    _stripe = new Stripe(key, {
      maxNetworkRetries: 3,
      timeout: 10000,
    })
  }
  return _stripe
}
