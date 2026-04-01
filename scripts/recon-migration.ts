/**
 * Migration Recon Script — Read-only data collection and user categorization
 *
 * Collects data from WooCommerce API + Stripe Live API, cross-references with
 * Supabase profiles, and categorizes every user into migration groups A/B/C/D.
 *
 * Usage: npm run migration:recon
 *
 * Required env vars:
 * - WOO_API_URL, WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET
 * - STRIPE_SECRET_KEY_LIVE (read-only access)
 * - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'fs'

// ─── Config ───────────────────────────────────────────────────────────────────

const WOO_BASE = process.env.WOO_API_URL ?? 'https://members.globalonlineyogaassociation.org/wp-json/wc/v3'
const WOO_KEY = process.env.WOO_CONSUMER_KEY
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET
const STRIPE_LIVE_KEY = process.env.STRIPE_SECRET_KEY_LIVE
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name: string, value: string | undefined): string {
  if (!value) { console.error(`Missing env var: ${name}`); process.exit(1) }
  return value
}

const wooKey = requireEnv('WOO_CONSUMER_KEY', WOO_KEY)
const wooSecret = requireEnv('WOO_CONSUMER_SECRET', WOO_SECRET)
const stripeLiveKey = requireEnv('STRIPE_SECRET_KEY_LIVE', STRIPE_LIVE_KEY)
const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL', SUPABASE_URL)
const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_KEY)

const stripe = new Stripe(stripeLiveKey)
const supabase = createClient(supabaseUrl, supabaseKey)

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ─── Types ────────────────────────────────────────────────────────────────────

interface WooCustomer {
  id: number
  email: string
  role: string
  username: string
  first_name: string
  last_name: string
  meta_data?: Array<{ key: string; value: string }>
}

interface WooSubscription {
  id: number
  status: string
  total: string
  billing_period: string
  meta_data?: Array<{ key: string; value: string }>
  date_created: string
  date_end: string
}

interface CustomerRecord {
  woo_customer_id: number
  email: string
  wp_roles: string[]
  subscriptions: Array<{
    id: number
    status: string
    total: number
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
    start_date: string
    end_date: string
  }>
}

interface StripeData {
  customer_id: string
  email: string | null
  subscriptions: Array<{
    id: string
    status: string
    current_period_end: number
  }>
}

type MigrationGroup = 'A' | 'B' | 'C' | 'D'

interface StagingRow {
  email: string
  woo_customer_id: number | null
  supabase_profile_id: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  woo_subscription_status: string | null
  woo_subscription_total: number | null
  wp_roles: string[]
  migration_group: MigrationGroup
  migration_notes: string
}

// ─── Step 1: WooCommerce (subscription-first) ───────────────────────────────

async function fetchWooPage<T>(endpoint: string, page: number): Promise<T[]> {
  const url = `${WOO_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`
  const auth = Buffer.from(`${wooKey}:${wooSecret}`).toString('base64')
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
  if (!res.ok) {
    console.warn(`  WooCommerce ${endpoint} page ${page}: ${res.status} ${res.statusText}`)
    return []
  }
  return res.json() as Promise<T[]>
}

async function fetchAllWooPages<T>(endpoint: string): Promise<T[]> {
  const all: T[] = []
  let page = 1
  while (true) {
    const batch = await fetchWooPage<T>(endpoint, page)
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < 100) break
    page++
    await sleep(200)
  }
  return all
}

function getMetaValue(meta: Array<{ key: string; value: string }> | undefined, key: string): string | null {
  return meta?.find(m => m.key === key)?.value ?? null
}

interface WooSubscriptionWithCustomer extends WooSubscription {
  customer_id: number
}

async function fetchWooCustomers(): Promise<CustomerRecord[]> {
  console.log('Step 1: Fetching ALL WooCommerce subscriptions (subscription-first strategy)...')

  // Fetch all subscriptions across all statuses
  const statuses = ['active', 'cancelled', 'expired', 'on-hold', 'pending']
  const allSubs: WooSubscriptionWithCustomer[] = []

  for (const status of statuses) {
    const subs = await fetchAllWooPages<WooSubscriptionWithCustomer>(`/subscriptions?status=${status}`)
    console.log(`  ${status}: ${subs.length} subscriptions`)
    allSubs.push(...subs)
  }
  console.log(`  Total subscriptions fetched: ${allSubs.length}`)

  // Group subscriptions by customer_id
  const subsByCustomer = new Map<number, WooSubscriptionWithCustomer[]>()
  for (const sub of allSubs) {
    if (!sub.customer_id) continue
    const existing = subsByCustomer.get(sub.customer_id)
    if (existing) {
      existing.push(sub)
    } else {
      subsByCustomer.set(sub.customer_id, [sub])
    }
  }
  console.log(`  Unique customers from subscriptions: ${subsByCustomer.size}`)

  // Fetch customer details with caching
  const customerCache = new Map<number, WooCustomer>()
  const records: CustomerRecord[] = []
  let fetched = 0
  const totalCustomers = subsByCustomer.size

  for (const [customerId, subs] of subsByCustomer) {
    fetched++
    if (fetched % 100 === 0) console.log(`  Fetching customer details: ${fetched}/${totalCustomers}`)

    let customer: WooCustomer | null = customerCache.get(customerId) ?? null

    if (!customer) {
      try {
        const url = `${WOO_BASE}/customers/${customerId}`
        const auth = Buffer.from(`${wooKey}:${wooSecret}`).toString('base64')
        const response = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
        if (response.ok) {
          customer = await response.json() as WooCustomer
          customerCache.set(customerId, customer)
        } else {
          console.warn(`  Failed to fetch customer ${customerId}: ${response.status}`)
        }
      } catch (err) {
        console.warn(`  Failed to fetch customer ${customerId}: ${err instanceof Error ? err.message : 'unknown'}`)
      }
      await sleep(200)
    }

    // Extract roles
    const wp_roles: string[] = []
    if (customer) {
      if (customer.role) wp_roles.push(customer.role)
      const rolesFromMeta = getMetaValue(customer.meta_data, 'wp_capabilities')
      if (rolesFromMeta) {
        try {
          const parsed = JSON.parse(rolesFromMeta)
          if (typeof parsed === 'object') wp_roles.push(...Object.keys(parsed))
        } catch { /* ignore */ }
      }
    }

    const email = customer?.email?.toLowerCase().trim() ?? ''

    records.push({
      woo_customer_id: customerId,
      email,
      wp_roles: [...new Set(wp_roles.filter(Boolean))],
      subscriptions: subs.map(s => ({
        id: s.id,
        status: s.status,
        total: parseFloat(s.total) || 0,
        stripe_customer_id: getMetaValue(s.meta_data, '_stripe_customer_id'),
        stripe_subscription_id: getMetaValue(s.meta_data, '_stripe_subscription_id'),
        start_date: s.date_created,
        end_date: s.date_end,
      })),
    })
  }

  console.log(`  Processed ${records.length} customers from ${allSubs.length} subscriptions`)
  return records
}

// ─── Step 2: Stripe Live ──────────────────────────────────────────────────────

async function fetchStripeLiveData(): Promise<{
  byEmail: Map<string, StripeData>
  byCustomerId: Map<string, StripeData>
}> {
  console.log('Step 2: Fetching Stripe Live data...')

  const byEmail = new Map<string, StripeData>()
  const byCustomerId = new Map<string, StripeData>()

  // Fetch all customers
  let customerCount = 0
  for await (const customer of stripe.customers.list({ limit: 100 })) {
    customerCount++
    const data: StripeData = {
      customer_id: customer.id,
      email: typeof customer.email === 'string' ? customer.email.toLowerCase().trim() : null,
      subscriptions: [],
    }
    byCustomerId.set(customer.id, data)
    if (data.email) byEmail.set(data.email, data)
  }
  console.log(`  Found ${customerCount} Stripe customers`)

  // Fetch all subscriptions and attach to customers
  let subCount = 0
  for await (const sub of stripe.subscriptions.list({ limit: 100, status: 'all' })) {
    subCount++
    const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
    const existing = byCustomerId.get(custId)
    if (existing) {
      existing.subscriptions.push({
        id: sub.id,
        status: sub.status,
        current_period_end: (sub as unknown as { current_period_end: number }).current_period_end ?? 0,
      })
    }
  }
  console.log(`  Found ${subCount} Stripe subscriptions`)

  return { byEmail, byCustomerId }
}

// ─── Step 3 & 4: Cross-reference and categorize ──────────────────────────────

async function crossReferenceAndCategorize(
  wooCustomers: CustomerRecord[],
  stripeData: { byEmail: Map<string, StripeData>; byCustomerId: Map<string, StripeData> },
): Promise<StagingRow[]> {
  console.log('Step 3: Cross-referencing with Supabase profiles...')

  // Fetch all Supabase profiles for email matching
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')

  const profileByEmail = new Map<string, string>()
  for (const p of profiles ?? []) {
    if (p.email) profileByEmail.set(p.email.toLowerCase().trim(), p.id)
  }
  console.log(`  Found ${profileByEmail.size} Supabase profiles`)

  console.log('Step 4: Categorizing users...')
  const rows: StagingRow[] = []

  for (const cust of wooCustomers) {
    if (!cust.email) continue

    const supabaseId = profileByEmail.get(cust.email) ?? null
    const isFake = cust.wp_roles.some(r => /faux|robot/i.test(r))

    // Find best subscription (prefer active, then most recent)
    const bestSub = cust.subscriptions
      .sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1
        if (b.status === 'active' && a.status !== 'active') return 1
        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      })[0] ?? null

    // Find Stripe data
    let stripeMatch: StripeData | null = null
    let matchSource = ''

    // Try WooCommerce subscription metadata first
    if (bestSub?.stripe_customer_id) {
      stripeMatch = stripeData.byCustomerId.get(bestSub.stripe_customer_id) ?? null
      if (stripeMatch) matchSource = 'woo_meta'
    }

    // Fallback: email lookup
    if (!stripeMatch) {
      stripeMatch = stripeData.byEmail.get(cust.email) ?? null
      if (stripeMatch) matchSource = 'email_lookup'
    }

    const stripeActiveSub = stripeMatch?.subscriptions.find(s => s.status === 'active')
    const stripeAnySub = stripeMatch?.subscriptions[0]

    // Categorize
    let group: MigrationGroup
    let notes = ''

    if (isFake || (bestSub && bestSub.total === 0 && !bestSub.stripe_customer_id)) {
      group = 'B'
      notes = `Fake/test user. Roles: ${cust.wp_roles.join(', ')}`
    } else if (stripeMatch) {
      group = 'A'
      notes = `Stripe match via ${matchSource}. Customer: ${stripeMatch.customer_id}`
    } else if (bestSub && bestSub.total > 0) {
      // Has a real paid subscription but no Stripe match
      if (bestSub.status === 'active' || bestSub.status === 'on-hold' || bestSub.status === 'pending') {
        group = 'C'
        notes = `Real sub (${bestSub.status}, $${bestSub.total}) but no Stripe ID or email match`
      } else {
        group = 'D'
        notes = `Former member. Sub status: ${bestSub.status}, total: $${bestSub.total}`
      }
    } else if (bestSub && (bestSub.status === 'cancelled' || bestSub.status === 'expired')) {
      group = 'D'
      notes = `Former member. Sub status: ${bestSub.status}`
    } else {
      // No subscription at all — treat as former/inactive
      group = 'D'
      notes = 'No WooCommerce subscription found'
    }

    rows.push({
      email: cust.email,
      woo_customer_id: cust.woo_customer_id,
      supabase_profile_id: supabaseId,
      stripe_customer_id: stripeMatch?.customer_id ?? null,
      stripe_subscription_id: stripeActiveSub?.id ?? stripeAnySub?.id ?? null,
      stripe_subscription_status: stripeActiveSub?.status ?? stripeAnySub?.status ?? null,
      woo_subscription_status: bestSub?.status ?? null,
      woo_subscription_total: bestSub?.total ?? null,
      wp_roles: cust.wp_roles,
      migration_group: group,
      migration_notes: notes,
    })
  }

  return rows
}

// ─── Step 5: Store in Supabase ────────────────────────────────────────────────

async function storeResults(rows: StagingRow[]): Promise<void> {
  console.log(`Step 5: Storing ${rows.length} rows in migration_staging...`)

  // Clear existing data for fresh run
  await supabase.from('migration_staging').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Batch upsert in chunks of 50
  const chunkSize = 50
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from('migration_staging').upsert(
      chunk.map(r => ({
        email: r.email,
        woo_customer_id: r.woo_customer_id,
        supabase_profile_id: r.supabase_profile_id,
        stripe_customer_id: r.stripe_customer_id,
        stripe_subscription_id: r.stripe_subscription_id,
        stripe_subscription_status: r.stripe_subscription_status,
        woo_subscription_status: r.woo_subscription_status,
        woo_subscription_total: r.woo_subscription_total,
        wp_roles: r.wp_roles,
        migration_group: r.migration_group,
        migration_notes: r.migration_notes,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'email' },
    )
    if (error) console.error(`  Upsert error at chunk ${i}:`, error.message)
  }

  console.log('  Done')
}

// ─── Step 6: Report ───────────────────────────────────────────────────────────

function generateReport(rows: StagingRow[]): string {
  const counts = { A: 0, B: 0, C: 0, D: 0 }
  const groupCRows: StagingRow[] = []
  const roleCounts = new Map<string, number>()

  for (const r of rows) {
    counts[r.migration_group]++
    if (r.migration_group === 'C') groupCRows.push(r)
    if (r.migration_group === 'B') {
      for (const role of r.wp_roles) {
        roleCounts.set(role, (roleCounts.get(role) ?? 0) + 1)
      }
    }
  }

  const total = rows.length
  const date = new Date().toISOString().slice(0, 10)

  let report = `# Migration Recon Report — ${date}\n\n`
  report += `## Summary\n\n`
  report += `| Group | Description | Count |\n`
  report += `|-------|-------------|-------|\n`
  report += `| A | Clean migration (has Stripe ID) | ${counts.A} |\n`
  report += `| B | Fake/test users (no Stripe needed) | ${counts.B} |\n`
  report += `| C | Real users missing Stripe | ${counts.C} |\n`
  report += `| D | Former members (cancelled) | ${counts.D} |\n`
  report += `| **TOTAL** | | **${total}** |\n\n`

  if (groupCRows.length > 0) {
    report += `## Group C Details (need re-onboarding)\n\n`
    for (const r of groupCRows) {
      report += `- ${r.email} (WooCommerce sub: ${r.woo_subscription_status}, $${r.woo_subscription_total})\n`
    }
    report += '\n'
  }

  if (roleCounts.size > 0) {
    report += `## Top WP Roles in Group B\n\n`
    const sorted = [...roleCounts.entries()].sort((a, b) => b[1] - a[1])
    for (const [role, count] of sorted.slice(0, 10)) {
      report += `- ${role}: ${count}\n`
    }
    report += '\n'
  }

  return report
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== MIGRATION RECON SCRIPT ===\n')
  console.log('Mode: READ ONLY (Stripe + WooCommerce), write to migration_staging only\n')

  const wooCustomers = await fetchWooCustomers()
  const stripeData = await fetchStripeLiveData()
  const rows = await crossReferenceAndCategorize(wooCustomers, stripeData)
  await storeResults(rows)

  const report = generateReport(rows)

  // Print to console
  console.log('\n' + report)

  // Save to file
  const date = new Date().toISOString().slice(0, 10)
  mkdirSync('.migration-state', { recursive: true })
  writeFileSync(`.migration-state/recon-report-${date}.md`, report)
  console.log(`Report saved to .migration-state/recon-report-${date}.md`)

  console.log('\n=== RECON COMPLETE ===')
}

main().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
