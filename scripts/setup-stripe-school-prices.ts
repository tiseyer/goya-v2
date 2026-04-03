/**
 * One-time setup script: Create Stripe products + prices for school designations
 * and sync them to the Supabase products table.
 *
 * Prerequisites:
 * 1. Set STRIPE_SECRET_KEY in .env.local (not the restricted key — needs full API access)
 * 2. Set SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 3. Set NEXT_PUBLIC_SUPABASE_URL in .env.local
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-school-prices.ts
 *
 * What it does:
 * 1. Creates a "School Designation — Annual" product in Stripe with a EUR 40/year recurring price
 * 2. Creates a "School Designation — Signup Fee" product in Stripe with a EUR 99 one-time price
 * 3. Updates all 8 school designation rows in the Supabase products table with the Stripe product ID
 * 4. Prints the price IDs to add to .env.local as STRIPE_SCHOOL_ANNUAL_PRICE_ID and STRIPE_SCHOOL_SIGNUP_PRICE_ID
 *
 * If products already exist in Stripe (idempotent check via metadata.goya_type), it reuses them.
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!STRIPE_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not set in .env.local')
  console.error('   Get it from https://dashboard.stripe.com/apikeys')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const stripe = new Stripe(STRIPE_KEY)
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SCHOOL_SLUGS = [
  'goya-cys200', 'goya-cys300', 'goya-cys500', 'goya-ccys',
  'goya-cpys', 'goya-cyys', 'goya-crys', 'goya-cms',
]

async function main() {
  console.log('🔄 Setting up Stripe school designation prices...\n')

  // Step 1: Check if Stripe products already exist
  const existingProducts = await stripe.products.list({ limit: 100, active: true })

  let annualProduct = existingProducts.data.find(
    p => p.metadata?.goya_type === 'school_annual'
  )
  let signupProduct = existingProducts.data.find(
    p => p.metadata?.goya_type === 'school_signup'
  )

  // Step 2: Create products if needed
  if (!annualProduct) {
    annualProduct = await stripe.products.create({
      name: 'School Designation — Annual',
      description: 'Annual subscription for a GOYA school designation (CYS200, CYS300, etc.)',
      metadata: { goya_type: 'school_annual' },
    })
    console.log('✅ Created Stripe product: School Designation — Annual')
  } else {
    console.log('♻️  Reusing existing Stripe product: School Designation — Annual')
  }

  if (!signupProduct) {
    signupProduct = await stripe.products.create({
      name: 'School Designation — Signup Fee',
      description: 'One-time signup fee for a GOYA school designation',
      metadata: { goya_type: 'school_signup' },
    })
    console.log('✅ Created Stripe product: School Designation — Signup Fee')
  } else {
    console.log('♻️  Reusing existing Stripe product: School Designation — Signup Fee')
  }

  // Step 3: Check/create prices
  const annualPrices = await stripe.prices.list({ product: annualProduct.id, active: true })
  let annualPrice = annualPrices.data.find(
    p => p.type === 'recurring' && p.recurring?.interval === 'year' && p.unit_amount === 4000 && p.currency === 'eur'
  )

  if (!annualPrice) {
    annualPrice = await stripe.prices.create({
      product: annualProduct.id,
      unit_amount: 4000, // EUR 40.00
      currency: 'eur',
      recurring: { interval: 'year' },
    })
    console.log('✅ Created annual price: EUR 40.00/year')
  } else {
    console.log('♻️  Reusing existing annual price: EUR 40.00/year')
  }

  const signupPrices = await stripe.prices.list({ product: signupProduct.id, active: true })
  let signupPrice = signupPrices.data.find(
    p => p.type === 'one_time' && p.unit_amount === 9900 && p.currency === 'eur'
  )

  if (!signupPrice) {
    signupPrice = await stripe.prices.create({
      product: signupProduct.id,
      unit_amount: 9900, // EUR 99.00
      currency: 'eur',
    })
    console.log('✅ Created signup fee price: EUR 99.00 one-time')
  } else {
    console.log('♻️  Reusing existing signup fee price: EUR 99.00 one-time')
  }

  // Step 4: Update Supabase products table
  console.log('\n🔄 Updating Supabase products table...')
  for (const slug of SCHOOL_SLUGS) {
    const { error } = await supabase
      .from('products')
      .update({ stripe_product_id: annualProduct.id })
      .eq('slug', slug)

    if (error) {
      console.error(`❌ Failed to update ${slug}:`, error.message)
    } else {
      console.log(`   ✅ ${slug} → ${annualProduct.id}`)
    }
  }

  // Step 5: Sync to stripe_products and stripe_prices tables
  console.log('\n🔄 Syncing to stripe_products/stripe_prices tables...')

  for (const prod of [annualProduct, signupProduct]) {
    await supabase.from('stripe_products').upsert({
      stripe_id: prod.id,
      name: prod.name,
      description: prod.description,
      active: prod.active,
      images: prod.images,
      metadata: prod.metadata,
    }, { onConflict: 'stripe_id' })
  }

  for (const price of [annualPrice, signupPrice]) {
    await supabase.from('stripe_prices').upsert({
      stripe_id: price.id,
      stripe_product_id: price.product as string,
      currency: price.currency,
      unit_amount: price.unit_amount,
      type: price.type,
      interval: price.recurring?.interval ?? null,
      interval_count: price.recurring?.interval_count ?? null,
      active: price.active,
      metadata: price.metadata,
    }, { onConflict: 'stripe_id' })
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Setup complete!')
  console.log('='.repeat(60))
  console.log('\nAdd these to your .env.local:')
  console.log(`\nSTRIPE_SCHOOL_ANNUAL_PRICE_ID=${annualPrice.id}`)
  console.log(`STRIPE_SCHOOL_SIGNUP_PRICE_ID=${signupPrice.id}`)
  console.log('\nThen restart your dev server.')
}

main().catch(e => {
  console.error('Fatal error:', e.message)
  process.exit(1)
})
