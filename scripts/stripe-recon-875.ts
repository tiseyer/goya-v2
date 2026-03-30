/**
 * Stripe Reconciliation Script for ~875 WooCommerce users without Stripe subscription IDs
 * Read-only — fetches WC subs, cross-references Stripe API, categorizes, cross-checks Supabase
 * Outputs: /tmp/wc_no_stripe_subs.json, /tmp/stripe_recon_875.json, /tmp/recon_summary.md
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import * as fs from 'fs';

const WOO_BASE = 'https://members.globalonlineyogaassociation.org/wp-json/wc/v3';
const WOO_KEY = process.env.WOO_CONSUMER_KEY!;
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET!;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://snddprncgilpctgvjukr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Bucket = 'active_in_stripe' | 'cancelled_in_stripe' | 'no_stripe_customer' | 'customer_no_subs' | 'manual_renewal' | 'failed_payment';

interface WCSubscription {
  sub_id: number;
  customer_id: number;
  email: string;
  product_id: number | null;
  product_name: string;
  billing_period: string;
  start_date: string;
  next_payment_date: string;
  stripe_customer_id_in_wc: string;
  stripe_sub_id_in_wc: string;
  payment_method: string;
}

interface StripeSub {
  id: string;
  status: string;
  plan_amount: number;
  plan_interval: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
  latest_invoice_amount_paid?: number;
}

interface StripeCustomer {
  id: string;
  email: string;
  has_payment_method: boolean;
  subscriptions: StripeSub[];
  recent_charges: { status: string; amount: number; created: number }[];
}

interface ReconRecord {
  wc_data: WCSubscription;
  stripe_data: StripeCustomer[] | null;
  bucket: Bucket;
  anomalies: string[];
  supabase_match: {
    found: boolean;
    stripe_customer_id_in_supabase: string | null;
    stripe_id_in_supabase_only: boolean;
  };
}

// ─── WooCommerce helpers ──────────────────────────────────────────────────────

function wooUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${WOO_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('consumer_key', WOO_KEY);
  url.searchParams.set('consumer_secret', WOO_SECRET);
  return url.toString();
}

async function wooGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const res = await fetch(wooUrl(endpoint, params));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WC API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Stripe helpers ───────────────────────────────────────────────────────────

async function stripeGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`https://api.stripe.com${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Supabase helper ──────────────────────────────────────────────────────────

async function supabaseFetch(table: string, params: Record<string, string>): Promise<any[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// ─── Step 1: Fetch WC subscriptions without Stripe sub IDs ───────────────────

async function fetchWCSubscriptionsWithoutStripeId(): Promise<WCSubscription[]> {
  console.log('\nStep 1: Fetching WooCommerce active subscriptions...');
  const result: WCSubscription[] = [];
  let page = 1;
  const perPage = 100;
  let totalFetched = 0;

  while (true) {
    console.log(`  Fetching page ${page}...`);
    const subs = await wooGet('/subscriptions', {
      status: 'active',
      per_page: String(perPage),
      page: String(page),
    });

    if (!Array.isArray(subs) || subs.length === 0) {
      console.log(`  No more results.`);
      break;
    }

    totalFetched += subs.length;
    console.log(`  Got ${subs.length} subs (total fetched: ${totalFetched})`);

    for (const sub of subs) {
      const meta: { key: string; value: any }[] = sub.meta_data || [];
      const getMeta = (key: string) => meta.find(m => m.key === key)?.value || '';

      const stripeSubId = getMeta('_stripe_subscription_id');
      const stripeCustomerId = getMeta('_stripe_customer_id');

      // Skip if has a valid Stripe subscription ID
      if (stripeSubId && stripeSubId.toString().startsWith('sub_')) continue;

      const email = sub.billing?.email || '';
      const lineItem = (sub.line_items || [])[0] || {};

      result.push({
        sub_id: sub.id,
        customer_id: sub.customer_id,
        email,
        product_id: lineItem.product_id || null,
        product_name: lineItem.name || 'Unknown',
        billing_period: sub.billing_period || 'unknown',
        start_date: sub.start_date || '',
        next_payment_date: sub.next_payment_date || '',
        stripe_customer_id_in_wc: stripeCustomerId || '',
        stripe_sub_id_in_wc: stripeSubId || '',
        payment_method: getMeta('_payment_method') || '',
      });
    }

    console.log(`  ${result.length} matching subs so far (no Stripe sub ID)`);

    if (subs.length < perPage) break;
    page++;
  }

  console.log(`\n  Total WC subscriptions without Stripe sub ID: ${result.length}`);
  return result;
}

// ─── Step 2: Look up Stripe data per email ────────────────────────────────────

async function lookupStripeCustomerByEmail(email: string): Promise<StripeCustomer[]> {
  const data = await stripeGet('/v1/customers', { email, limit: '10' });
  const customers: StripeCustomer[] = [];

  for (const cust of data.data || []) {
    // Fetch subscriptions
    const subsData = await stripeGet('/v1/subscriptions', { customer: cust.id, limit: '10' });
    const subscriptions: StripeSub[] = [];

    for (const sub of subsData.data || []) {
      // Get latest invoice amount_paid
      let latestInvoiceAmountPaid: number | undefined;
      if (sub.latest_invoice) {
        try {
          const invoice = await stripeGet(`/v1/invoices/${sub.latest_invoice}`);
          latestInvoiceAmountPaid = invoice.amount_paid;
        } catch {
          // ignore invoice fetch errors
        }
      }

      subscriptions.push({
        id: sub.id,
        status: sub.status,
        plan_amount: sub.plan?.amount || 0,
        plan_interval: sub.plan?.interval || '',
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        latest_invoice_amount_paid: latestInvoiceAmountPaid,
      });
    }

    // Fetch recent charges
    const chargesData = await stripeGet('/v1/charges', { customer: cust.id, limit: '3' });
    const recentCharges = (chargesData.data || []).map((c: any) => ({
      status: c.status,
      amount: c.amount,
      created: c.created,
    }));

    const hasPaymentMethod = !!(
      cust.invoice_settings?.default_payment_method ||
      cust.default_source
    );

    customers.push({
      id: cust.id,
      email: cust.email,
      has_payment_method: hasPaymentMethod,
      subscriptions,
      recent_charges: recentCharges,
    });
  }

  return customers;
}

// ─── Step 3: Categorize into buckets ─────────────────────────────────────────

function categorizeBucket(stripeCustomers: StripeCustomer[]): Bucket {
  if (!stripeCustomers || stripeCustomers.length === 0) {
    return 'no_stripe_customer';
  }

  const allSubs = stripeCustomers.flatMap(c => c.subscriptions);

  if (allSubs.length === 0) {
    // Has Stripe customer but no subscriptions — distinct from no customer at all
    return 'customer_no_subs';
  }

  // Check for active subscriptions
  const activeSubs = allSubs.filter(s => s.status === 'active');
  if (activeSubs.length > 0) {
    // Check if it's a manual/free renewal
    const hasManual = activeSubs.some(s =>
      s.plan_amount === 0 ||
      s.latest_invoice_amount_paid === 0
    );
    if (hasManual) return 'manual_renewal';
    return 'active_in_stripe';
  }

  // Check for failed/problem states
  const failedSubs = allSubs.filter(s =>
    ['incomplete', 'unpaid', 'past_due', 'incomplete_expired'].includes(s.status)
  );
  if (failedSubs.length > 0) return 'failed_payment';

  // All subscriptions are cancelled
  return 'cancelled_in_stripe';
}

function detectAnomalies(
  wcSub: WCSubscription,
  stripeCustomers: StripeCustomer[]
): string[] {
  const anomalies: string[] = [];

  if (stripeCustomers.length > 1) {
    anomalies.push(`multiple_stripe_customers:${stripeCustomers.length}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

  for (const cust of stripeCustomers) {
    for (const sub of cust.subscriptions) {
      // Recently cancelled
      if (
        ['canceled', 'cancelled'].includes(sub.status) &&
        sub.current_period_end > thirtyDaysAgo
      ) {
        anomalies.push(`recently_cancelled:${sub.id}`);
      }

      // Product mismatch heuristic — if WC product is named "teacher" but Stripe plan amount is 0
      // (this is a rough check without knowing exact Stripe product IDs)
      if (wcSub.product_name && sub.plan_amount === 0 && wcSub.billing_period !== 'unknown') {
        // Don't flag here — handled by manual_renewal bucket
      }
    }
  }

  return anomalies;
}

// ─── Step 4: Cross-reference with Supabase ────────────────────────────────────

async function checkSupabase(email: string): Promise<{
  found: boolean;
  stripe_customer_id_in_supabase: string | null;
  stripe_id_in_supabase_only: boolean;
}> {
  try {
    const profiles = await supabaseFetch('profiles', {
      select: 'id,email,stripe_customer_id',
      email: `eq.${email}`,
      limit: '1',
    });

    if (!profiles || profiles.length === 0) {
      return { found: false, stripe_customer_id_in_supabase: null, stripe_id_in_supabase_only: false };
    }

    const profile = profiles[0];
    const stripeIdInSupabase = profile.stripe_customer_id || null;
    return {
      found: true,
      stripe_customer_id_in_supabase: stripeIdInSupabase,
      stripe_id_in_supabase_only: !!stripeIdInSupabase,
    };
  } catch (err) {
    console.error(`  Supabase lookup failed for ${email}:`, err);
    return { found: false, stripe_customer_id_in_supabase: null, stripe_id_in_supabase_only: false };
  }
}

// ─── Step 5: Generate summary report ─────────────────────────────────────────

function generateSummary(records: ReconRecord[], isTestKey: boolean = false): string {
  const total = records.length;
  const buckets: Record<Bucket, number> = {
    active_in_stripe: 0,
    cancelled_in_stripe: 0,
    no_stripe_customer: 0,
    customer_no_subs: 0,
    manual_renewal: 0,
    failed_payment: 0,
  };

  let anomalyCount = 0;
  let multiCustomerCount = 0;
  let recentCancelledCount = 0;
  let stripeIdInSupabaseOnly = 0;

  for (const r of records) {
    buckets[r.bucket]++;
    if (r.anomalies.length > 0) anomalyCount++;
    if (r.anomalies.some(a => a.startsWith('multiple_stripe_customers'))) multiCustomerCount++;
    if (r.anomalies.some(a => a.startsWith('recently_cancelled'))) recentCancelledCount++;
    if (r.supabase_match.stripe_id_in_supabase_only) stripeIdInSupabaseOnly++;
  }

  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%';

  const lines: string[] = [];
  lines.push('# Stripe Reconciliation Report — WC Users Without Stripe Sub ID');
  lines.push(`\n**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total analyzed:** ${total}`);
  if (isTestKey) {
    lines.push(`\n> **NOTE: Stripe test key was used.** All Stripe lookups returned empty (no test customers exist for real members).`);
    lines.push(`> Re-run with live Stripe key (\`rk_live_51...\` or \`sk_live_...\`) for actual bucket data.`);
    lines.push(`> WooCommerce data below (total count, emails, products) is real and accurate.\n`);
  } else {
    lines.push('');
  }

  lines.push('## Bucket Summary\n');
  lines.push('| Bucket | Label | Count | % | Migration Strategy |');
  lines.push('|--------|-------|-------|---|--------------------|');
  lines.push(`| A | active_in_stripe | ${buckets.active_in_stripe} | ${pct(buckets.active_in_stripe)} | Link existing Stripe sub ID to WC/Supabase profile — no re-onboarding needed |`);
  lines.push(`| B | cancelled_in_stripe | ${buckets.cancelled_in_stripe} | ${pct(buckets.cancelled_in_stripe)} | Re-onboard or send re-subscribe email — subscription lapsed |`);
  lines.push(`| C | no_stripe_customer | ${buckets.no_stripe_customer} | ${pct(buckets.no_stripe_customer)} | No Stripe presence at all — need new payment setup at re-onboarding |`);
  lines.push(`| C2 | customer_no_subs | ${buckets.customer_no_subs} | ${pct(buckets.customer_no_subs)} | Stripe customer exists but has no subscriptions — link customer, create new sub |`);
  lines.push(`| D | manual_renewal | ${buckets.manual_renewal} | ${pct(buckets.manual_renewal)} | Stripe customer exists with $0 plan — manual or comp'd member, migrate as-is |`);
  lines.push(`| E | failed_payment | ${buckets.failed_payment} | ${pct(buckets.failed_payment)} | Stripe sub in past_due/incomplete state — needs payment retry or dunning |`);

  lines.push('\n## Anomaly Summary\n');
  lines.push(`| Anomaly | Count |`);
  lines.push(`|---------|-------|`);
  lines.push(`| Records with any anomaly | ${anomalyCount} |`);
  lines.push(`| Multiple Stripe customers for same email | ${multiCustomerCount} |`);
  lines.push(`| Recently cancelled (within 30 days) | ${recentCancelledCount} |`);

  lines.push('\n## Supabase Cross-Reference\n');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| stripe_id_in_supabase_only (Stripe ID in Supabase but WC has no sub ID) | ${stripeIdInSupabaseOnly} |`);

  lines.push('\n## Migration Strategy Per Bucket\n');
  lines.push('### A — active_in_stripe (Link existing subscription)');
  lines.push('- Pull Stripe sub ID from Stripe API and backfill into WooCommerce meta `_stripe_subscription_id`');
  lines.push('- Update Supabase profile with matching stripe_customer_id if missing');
  lines.push('- Estimated effort: **Automated** — batch script can handle all cases');
  lines.push('');
  lines.push('### B — cancelled_in_stripe (Re-onboard)');
  lines.push('- Subscription lapsed in Stripe. Options:');
  lines.push('  1. Send re-subscribe email with payment link (Stripe payment link)');
  lines.push('  2. Admin manually creates new subscription if member should still be active');
  lines.push('- Estimated effort: **Semi-manual** — email campaign + admin review');
  lines.push('');
  lines.push('### C — no_stripe_customer (New setup needed)');
  lines.push('- No Stripe customer record exists for this email');
  lines.push('- These members need a Stripe customer + subscription created at re-onboarding');
  lines.push('- Action: At next login, prompt to set up payment method and create Stripe subscription');
  lines.push('- Estimated effort: **Automated** — handled by re-onboarding flow');
  lines.push('');
  lines.push('### C2 — customer_no_subs (Stripe customer exists, no subscription)');
  lines.push('- Stripe customer record exists (often with payment method) but no subscription');
  lines.push('- These were likely created during WooCommerce checkout but subscription was handled by WC');
  lines.push('- Action: Link existing Stripe customer ID to Supabase profile, create new subscription at re-onboarding');
  lines.push('- Estimated effort: **Semi-automated** — batch link customer IDs, subscription created at login');
  lines.push('');
  lines.push('### D — manual_renewal (Migrate as-is)');
  lines.push('- Comp\'d or manually managed members with $0 Stripe subscriptions');
  lines.push('- Action: Link Stripe customer ID to Supabase profile. Keep $0 plan or admin-manage.');
  lines.push('- Estimated effort: **Low** — mostly automated');
  lines.push('');
  lines.push('### E — failed_payment (Dunning)');
  lines.push('- Stripe subscription exists but in delinquent state');
  lines.push('- Action: Trigger Stripe retry flow or send payment update link');
  lines.push('- Estimated effort: **Semi-automated** — Stripe has built-in dunning tools');

  // WC-side product breakdown (always available regardless of Stripe key)
  lines.push('\n## WooCommerce Product Distribution\n');
  const productCounts: Record<string, number> = {};
  const billingPeriods: Record<string, number> = {};
  for (const r of records) {
    const pname = r.wc_data.product_name || 'Unknown';
    productCounts[pname] = (productCounts[pname] || 0) + 1;
    const bp = r.wc_data.billing_period || 'unknown';
    billingPeriods[bp] = (billingPeriods[bp] || 0) + 1;
  }
  lines.push('### Products in WC Subs Without Stripe IDs\n');
  lines.push('| Product Name | Count | % |');
  lines.push('|-------------|-------|---|');
  const sortedProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedProducts.slice(0, 20)) {
    lines.push(`| ${name} | ${count} | ${pct(count)} |`);
  }
  if (sortedProducts.length > 20) {
    lines.push(`| *(${sortedProducts.length - 20} more products)* | - | - |`);
  }
  lines.push('\n### Billing Period Distribution\n');
  lines.push('| Period | Count | % |');
  lines.push('|--------|-------|---|');
  for (const [period, count] of Object.entries(billingPeriods).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${period} | ${count} | ${pct(count)} |`);
  }

  // Supabase match summary
  const supabaseMatched = records.filter(r => r.supabase_match.found).length;
  const supabaseNotFound = records.filter(r => !r.supabase_match.found).length;
  lines.push('\n## Supabase Profile Matching\n');
  lines.push('| Metric | Count | % |');
  lines.push('|--------|-------|---|');
  lines.push(`| WC email found in Supabase profiles | ${supabaseMatched} | ${pct(supabaseMatched)} |`);
  lines.push(`| WC email NOT in Supabase (WC-only users) | ${supabaseNotFound} | ${pct(supabaseNotFound)} |`);
  lines.push(`\nNote: WC-only users (not in Supabase) are likely faux/robit accounts or pre-migration members.`);

  lines.push('\n## stripe_id_in_supabase_only Cases\n');
  if (stripeIdInSupabaseOnly === 0) {
    lines.push('No cases found — Supabase and WooCommerce are in sync on Stripe customer IDs.');
  } else {
    lines.push(`${stripeIdInSupabaseOnly} users have a Stripe customer ID in Supabase but no Stripe sub ID in WooCommerce.`);
    lines.push('These were likely migrated partially — Supabase has the customer link but WC meta was not updated.');
    const cases = records.filter(r => r.supabase_match.stripe_id_in_supabase_only);
    lines.push('\n| Email | Supabase Stripe Customer ID | WC Stripe Customer ID | Bucket |');
    lines.push('|-------|----------------------------|----------------------|--------|');
    for (const r of cases.slice(0, 50)) {
      lines.push(`| ${r.wc_data.email} | ${r.supabase_match.stripe_customer_id_in_supabase} | ${r.wc_data.stripe_customer_id_in_wc || '-'} | ${r.bucket} |`);
    }
    if (cases.length > 50) {
      lines.push(`\n*(${cases.length - 50} more cases truncated — see /tmp/stripe_recon_875.json for full list)*`);
    }
  }

  // C2 bucket detail: how many have payment methods
  const c2Records = records.filter(r => r.bucket === 'customer_no_subs');
  if (c2Records.length > 0) {
    const c2WithPM = c2Records.filter(r =>
      r.stripe_data && r.stripe_data.some((c: any) => c.has_payment_method)
    ).length;
    lines.push('\n## C2 Bucket Detail — Customer No Subs\n');
    lines.push(`| Metric | Count | % of C2 |`);
    lines.push(`|--------|-------|---------|`);
    lines.push(`| Total C2 (Stripe customer, no sub) | ${c2Records.length} | 100% |`);
    lines.push(`| With payment method on file | ${c2WithPM} | ${((c2WithPM / c2Records.length) * 100).toFixed(1)}% |`);
    lines.push(`| Without payment method | ${c2Records.length - c2WithPM} | ${(((c2Records.length - c2WithPM) / c2Records.length) * 100).toFixed(1)}% |`);
    lines.push(`\n> These ${c2WithPM} users with payment methods can have subscriptions created automatically.`);
    lines.push(`> The remaining ${c2Records.length - c2WithPM} need payment method collection at re-onboarding.`);
  }

  return lines.join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Stripe Reconciliation Script for ~875 WC users without Stripe sub IDs ===');

  // Validate env
  if (!WOO_KEY || !WOO_SECRET) throw new Error('Missing WOO_CONSUMER_KEY or WOO_CONSUMER_SECRET');
  if (!STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

  // Warn if using test key
  const isTestKey = STRIPE_SECRET_KEY.startsWith('sk_test_') || STRIPE_SECRET_KEY.startsWith('rk_test_');
  if (isTestKey) {
    console.warn('\nWARNING: Using Stripe TEST key — Stripe lookups will return no real customers.');
    console.warn('All users will be bucketed as "no_stripe_customer" until live key is configured.');
    console.warn('WooCommerce data (Step 1) will still be real and accurate.\n');
  }

  console.log('Environment variables loaded OK');

  // Step 1: Fetch WC subscriptions (use cached file if available to speed up reruns)
  let wcSubs: WCSubscription[];
  const WC_CACHE = '/tmp/wc_no_stripe_subs.json';
  if (fs.existsSync(WC_CACHE) && process.env.USE_WC_CACHE === '1') {
    console.log(`\nStep 1: Loading cached WC data from ${WC_CACHE}...`);
    wcSubs = JSON.parse(fs.readFileSync(WC_CACHE, 'utf-8'));
    console.log(`  Loaded ${wcSubs.length} cached WC subscriptions`);
  } else {
    wcSubs = await fetchWCSubscriptionsWithoutStripeId();
    fs.writeFileSync(WC_CACHE, JSON.stringify(wcSubs, null, 2));
    console.log(`\nSaved ${wcSubs.length} WC subscriptions to ${WC_CACHE}`);
  }

  // De-duplicate by email for Stripe lookups
  const uniqueEmails = [...new Set(wcSubs.map(s => s.email).filter(Boolean))];
  console.log(`\nStep 2: Looking up ${uniqueEmails.length} unique emails in Stripe...`);

  // Build email -> stripe data cache
  const stripeCache = new Map<string, StripeCustomer[]>();

  if (isTestKey) {
    // Skip Stripe lookups entirely when using test key — they'll all return empty
    console.log('  SKIPPING Stripe lookups (test key in use — no real customers in test mode)');
    console.log('  All records will be bucketed as no_stripe_customer');
    console.log('  Re-run with live key (rk_live_51... or sk_live_...) for real bucket data');
  } else {
    // Parallel Stripe lookups in batches of 10 for ~10x speedup
    const STRIPE_CONCURRENCY = 10;
    let stripeLookupsComplete = 0;
    for (let i = 0; i < uniqueEmails.length; i += STRIPE_CONCURRENCY) {
      const batch = uniqueEmails.slice(i, i + STRIPE_CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (email) => {
          try {
            const customers = await lookupStripeCustomerByEmail(email);
            return { email, customers };
          } catch (err: any) {
            console.error(`  Error looking up Stripe for ${email}:`, err.message);
            return { email, customers: [] as any[] };
          }
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled') {
          stripeCache.set(r.value.email, r.value.customers);
        }
      }
      stripeLookupsComplete += batch.length;
      if (stripeLookupsComplete % 50 === 0 || stripeLookupsComplete === uniqueEmails.length) {
        console.log(`  Stripe lookups: ${stripeLookupsComplete}/${uniqueEmails.length}`);
      }
      await sleep(50); // Small delay between batches
    }
  }

  console.log(`\nStep 3 & 4: Categorizing into buckets and cross-referencing Supabase...`);

  // Batch Supabase lookup for all unique emails at once (in groups of 500)
  const supabaseCache = new Map<string, { found: boolean; stripe_customer_id_in_supabase: string | null; stripe_id_in_supabase_only: boolean }>();
  console.log(`  Batch-fetching ${uniqueEmails.length} emails from Supabase...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < uniqueEmails.length; i += BATCH_SIZE) {
    const batch = uniqueEmails.slice(i, i + BATCH_SIZE);
    try {
      const profiles = await supabaseFetch('profiles', {
        select: 'email,stripe_customer_id',
        email: `in.(${batch.join(',')})`,
        limit: String(BATCH_SIZE),
      });
      for (const p of profiles) {
        const stripeId = p.stripe_customer_id || null;
        supabaseCache.set(p.email, {
          found: true,
          stripe_customer_id_in_supabase: stripeId,
          stripe_id_in_supabase_only: !!stripeId,
        });
      }
      console.log(`  Supabase: fetched ${i + batch.length}/${uniqueEmails.length}, matched ${supabaseCache.size} profiles`);
    } catch (err: any) {
      console.error(`  Supabase batch ${i}-${i + BATCH_SIZE} failed:`, err.message);
    }
  }

  const records: ReconRecord[] = [];

  for (let i = 0; i < wcSubs.length; i++) {
    const wcSub = wcSubs[i];
    const email = wcSub.email;

    // Get stripe data
    const stripeCustomers = stripeCache.get(email) || [];

    // Categorize
    const bucket = categorizeBucket(stripeCustomers);
    const anomalies = detectAnomalies(wcSub, stripeCustomers);

    // Supabase match from cache
    const supabaseData = supabaseCache.get(email) || {
      found: false,
      stripe_customer_id_in_supabase: null,
      stripe_id_in_supabase_only: false,
    };

    records.push({
      wc_data: wcSub,
      stripe_data: stripeCustomers.length > 0 ? stripeCustomers : null,
      bucket,
      anomalies,
      supabase_match: supabaseData,
    });

    if ((i + 1) % 500 === 0) {
      console.log(`  Categorized ${i + 1}/${wcSubs.length} records`);
    }
  }

  console.log(`\nStep 5: Generating outputs...`);

  // Save full recon data
  fs.writeFileSync('/tmp/stripe_recon_875.json', JSON.stringify(records, null, 2));
  console.log(`Saved ${records.length} records to /tmp/stripe_recon_875.json`);

  // Generate summary
  const summary = generateSummary(records, isTestKey);
  fs.writeFileSync('/tmp/recon_summary.md', summary);
  console.log(`Saved summary to /tmp/recon_summary.md`);

  // Print bucket breakdown
  const buckets: Record<string, number> = {};
  records.forEach(r => { buckets[r.bucket] = (buckets[r.bucket] || 0) + 1; });
  console.log('\n=== BUCKET BREAKDOWN ===');
  console.log(JSON.stringify(buckets, null, 2));
  console.log(`\nTotal records: ${records.length}`);
  console.log('\nDone! All 3 output files created.');
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
