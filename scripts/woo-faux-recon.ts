/**
 * WooCommerce Faux vs Real User Recon
 * Read-only — checks Stripe ID presence vs wp_roles faux status
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const WOO_BASE = 'https://members.globalonlineyogaassociation.org/wp-json/wc/v3';
const WOO_KEY = process.env.WOO_CONSUMER_KEY!;
const WOO_SECRET = process.env.WOO_CONSUMER_SECRET!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function wooGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`${WOO_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('consumer_key', WOO_KEY);
  url.searchParams.set('consumer_secret', WOO_SECRET);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`WC API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

interface SubSample {
  subId: number;
  customerId: number;
  email: string;
  stripeCustomerId: string;
  stripeSubId: string;
  wpRoles: string | null;
  isFaux: boolean;
  supabaseMatch: boolean;
  product: string;
}

async function sampleSubs(count: number, wantStripe: boolean): Promise<SubSample[]> {
  const results: SubSample[] = [];
  let page = 1;
  const batchSize = 25;

  while (results.length < count) {
    console.log(`  Fetching page ${page} (have ${results.length}/${count})...`);
    const subs = await wooGet('/subscriptions', {
      per_page: String(batchSize),
      page: String(page),
      status: 'active',
    });

    if (!Array.isArray(subs) || subs.length === 0) break;

    for (const sub of subs) {
      if (results.length >= count) break;

      const meta = sub.meta_data || [];
      const stripeCust = meta.find((m: any) => m.key === '_stripe_customer_id')?.value || '';
      const stripeSub = meta.find((m: any) => m.key === '_stripe_subscription_id')?.value || '';
      const hasStripe = stripeCust.startsWith('cus_');

      if (wantStripe && !hasStripe) continue;
      if (!wantStripe && hasStripe) continue;

      const email = sub.billing?.email || '';
      const product = (sub.line_items || [])[0]?.name || 'Unknown';

      // Look up in Supabase
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, wp_roles')
        .eq('email', email)
        .limit(1);

      const profile = profiles?.[0];
      const wpRoles = profile?.wp_roles || null;
      const isFaux = wpRoles ? (wpRoles.includes('faux') || wpRoles.includes('robit')) : false;

      results.push({
        subId: sub.id,
        customerId: sub.customer_id,
        email,
        stripeCustomerId: stripeCust,
        stripeSubId: stripeSub,
        wpRoles,
        isFaux,
        supabaseMatch: !!profile,
        product,
      });
    }

    page++;
    if (subs.length < batchSize) break;
  }

  return results;
}

async function main() {
  const report: string[] = [];
  report.push('# WooCommerce Stripe/Faux User Recon');
  report.push(`\n**Date:** ${new Date().toISOString().split('T')[0]}`);
  report.push('**Mode:** Read-only\n');

  // 1. Sample WITHOUT Stripe ID
  console.log('📡 Sampling 50 subscriptions WITHOUT Stripe customer ID...');
  const noStripe = await sampleSubs(50, false);
  console.log(`  Got ${noStripe.length} samples without Stripe ID`);

  const noStripeFaux = noStripe.filter(s => s.isFaux).length;
  const noStripeReal = noStripe.filter(s => !s.isFaux && s.supabaseMatch).length;
  const noStripeNoMatch = noStripe.filter(s => !s.supabaseMatch).length;

  report.push('## 1. Subscriptions WITHOUT Stripe Customer ID (50 samples)\n');
  report.push(`| Metric | Count | % |`);
  report.push(`|--------|-------|---|`);
  report.push(`| Faux/robit users | ${noStripeFaux} | ${((noStripeFaux / noStripe.length) * 100).toFixed(1)}% |`);
  report.push(`| Real users (no faux in wp_roles) | ${noStripeReal} | ${((noStripeReal / noStripe.length) * 100).toFixed(1)}% |`);
  report.push(`| No Supabase match | ${noStripeNoMatch} | ${((noStripeNoMatch / noStripe.length) * 100).toFixed(1)}% |`);
  report.push(`| **Total sampled** | ${noStripe.length} | 100% |`);

  if (noStripeReal > 0) {
    report.push('\n### Real users without Stripe ID (potential problem cases)\n');
    report.push('| # | Email | WP Roles | Product |');
    report.push('|---|-------|----------|---------|');
    noStripe.filter(s => !s.isFaux && s.supabaseMatch).forEach((s, i) => {
      report.push(`| ${i + 1} | ${s.email} | ${s.wpRoles || '-'} | ${s.product} |`);
    });
  }

  if (noStripeNoMatch > 0) {
    report.push('\n### No Supabase match (WC-only users)\n');
    report.push('| # | Email | WC Customer ID | Product |');
    report.push('|---|-------|----------------|---------|');
    noStripe.filter(s => !s.supabaseMatch).forEach((s, i) => {
      report.push(`| ${i + 1} | ${s.email} | ${s.customerId} | ${s.product} |`);
    });
  }

  // 2. Sample WITH Stripe ID
  console.log('\n📡 Sampling 20 subscriptions WITH Stripe customer ID...');
  const withStripe = await sampleSubs(20, true);
  console.log(`  Got ${withStripe.length} samples with Stripe ID`);

  const withStripeFaux = withStripe.filter(s => s.isFaux).length;
  const withStripeReal = withStripe.filter(s => !s.isFaux && s.supabaseMatch).length;

  report.push('\n## 2. Subscriptions WITH Stripe Customer ID (20 samples)\n');
  report.push(`| Metric | Count | % |`);
  report.push(`|--------|-------|---|`);
  report.push(`| Faux/robit users | ${withStripeFaux} | ${((withStripeFaux / Math.max(withStripe.length, 1)) * 100).toFixed(1)}% |`);
  report.push(`| Real users | ${withStripeReal} | ${((withStripeReal / Math.max(withStripe.length, 1)) * 100).toFixed(1)}% |`);
  report.push(`| No Supabase match | ${withStripe.filter(s => !s.supabaseMatch).length} | ${((withStripe.filter(s => !s.supabaseMatch).length / Math.max(withStripe.length, 1)) * 100).toFixed(1)}% |`);
  report.push(`| **Total sampled** | ${withStripe.length} | 100% |`);

  if (withStripeFaux > 0) {
    report.push('\n### ⚠ Faux users WITH Stripe ID (unexpected)\n');
    report.push('| # | Email | Stripe ID | WP Roles |');
    report.push('|---|-------|-----------|----------|');
    withStripe.filter(s => s.isFaux).forEach((s, i) => {
      report.push(`| ${i + 1} | ${s.email} | ${s.stripeCustomerId} | ${s.wpRoles} |`);
    });
  }

  // 3. Estimates
  const totalActive = 4971; // from previous recon
  const estFauxRate = noStripeFaux / Math.max(noStripe.length, 1);
  const estNoStripeCount = Math.round(totalActive * 0.8); // rough estimate: ~80% have no Stripe ID
  const estWithStripeCount = totalActive - estNoStripeCount;
  const estFauxCount = Math.round(estNoStripeCount * estFauxRate);
  const estRealNoStripe = estNoStripeCount - estFauxCount;

  report.push('\n## 3. Estimated Totals (extrapolated from samples)\n');
  report.push(`| Category | Estimated Count | Notes |`);
  report.push(`|----------|----------------|-------|`);
  report.push(`| Total active WC subs | ${totalActive} | From previous recon |`);
  report.push(`| Subs WITH Stripe ID (~real) | ~${estWithStripeCount} | Migration candidates |`);
  report.push(`| Subs WITHOUT Stripe ID | ~${estNoStripeCount} | Mostly faux |`);
  report.push(`| — of which faux/robit | ~${estFauxCount} | ${(estFauxRate * 100).toFixed(0)}% of no-Stripe sample |`);
  report.push(`| — of which real (problem cases) | ~${estRealNoStripe} | Need manual investigation |`);

  report.push('\n## 4. Recommendations\n');
  report.push('1. **Faux users without Stripe = SKIP** — these are placeholder entries, not paying members');
  report.push('2. **Real users WITH Stripe ID = MIGRATE** — create Stripe subscriptions in new system using existing customer IDs');
  report.push('3. **Real users WITHOUT Stripe ID = INVESTIGATE** — may need manual outreach to set up payment');
  report.push('4. **Faux users WITH Stripe ID = ANOMALY** — should not exist, investigate if found');
  report.push(`5. **Estimated migration scope: ~${estWithStripeCount} real subscriptions** (not ${totalActive})`);

  // Write report
  const reportDir = path.join(process.cwd(), '.planning', 'recon');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'woo-stripe-faux-recon-2026-03-30.md');
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

main().catch(console.error);
