/**
 * WooCommerce API Recon Script
 * Read-only — queries WC API and Supabase, writes report to .planning/recon/
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
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WC API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function getAllPages(endpoint: string, params: Record<string, string> = {}, batchSize = 25): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    console.log(`  Page ${page}...`);
    const data = await wooGet(endpoint, { ...params, per_page: String(batchSize), page: String(page) });
    if (!Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    console.log(`  Got ${data.length} items (total: ${all.length})`);
    if (data.length < batchSize) break;
    page++;
  }
  return all;
}

async function main() {
  const report: string[] = [];
  report.push('# WooCommerce API Recon Report');
  report.push(`\n**Date:** ${new Date().toISOString().split('T')[0]}`);
  report.push('**Mode:** Read-only — no writes to Supabase\n');

  // 1. Subscription Overview
  console.log('📡 Fetching active subscriptions...');
  const activeSubs = await getAllPages('/subscriptions', { status: 'active' });
  console.log(`  Found ${activeSubs.length} active subscriptions`);

  report.push('## 1. Subscription Overview\n');
  report.push(`**Total active subscriptions:** ${activeSubs.length}\n`);
  report.push('*(Only active status fetched — other statuses skipped to avoid API timeout)*\n');

  // Product distribution
  const productCounts: Record<string, { count: number; name: string }> = {};
  const billingPeriods: Record<string, number> = {};

  for (const sub of activeSubs) {
    const period = sub.billing_period || 'unknown';
    billingPeriods[period] = (billingPeriods[period] || 0) + 1;

    for (const item of (sub.line_items || [])) {
      const pid = String(item.product_id);
      if (!productCounts[pid]) {
        productCounts[pid] = { count: 0, name: item.name || 'Unknown' };
      }
      productCounts[pid].count++;
    }
  }

  report.push('### Products in Active Subscriptions\n');
  report.push('| Product ID | Name | Active Subs |');
  report.push('|------------|------|-------------|');
  const sorted = Object.entries(productCounts).sort((a, b) => b[1].count - a[1].count);
  for (const [pid, { count, name }] of sorted) {
    report.push(`| ${pid} | ${name} | ${count} |`);
  }

  report.push('\n### Billing Period Distribution\n');
  report.push('| Period | Count |');
  report.push('|--------|-------|');
  for (const [period, count] of Object.entries(billingPeriods)) {
    report.push(`| ${period} | ${count} |`);
  }

  // 2. Product Mapping
  console.log('\n📡 Fetching products...');
  const products = await getAllPages('/products');
  console.log(`  Found ${products.length} products`);

  report.push('\n## 2. Product Mapping\n');
  report.push('### All WooCommerce Products\n');
  report.push('| ID | Name | Type | Price | Status |');
  report.push('|----|------|------|-------|--------|');
  for (const p of products) {
    report.push(`| ${p.id} | ${p.name} | ${p.type} | ${p.price || '-'} | ${p.status} |`);
  }

  report.push('\n### Proposed Stripe Mapping\n');
  report.push('| WC Product | WC ID | → Stripe Product | Notes |');
  report.push('|------------|-------|-----------------|-------|');
  for (const p of products) {
    const name = (p.name || '').toLowerCase();
    let stripeMap = '?';
    let notes = '';
    if (name.includes('teacher') && !name.includes('school')) { stripeMap = 'GOYA Teacher Membership'; }
    else if (name.includes('student')) { stripeMap = 'GOYA Student Membership'; }
    else if (name.includes('wellness')) { stripeMap = 'GOYA Wellness Practitioner Membership'; }
    else if (name.includes('school') || name.includes('certified')) { stripeMap = 'School Designation'; notes = 'May need per-designation mapping'; }
    else if (name.includes('designation') || name.includes('cyt') || name.includes('ecyt')) { stripeMap = 'Designation Add-on'; }
    else { notes = 'No clear mapping — manual review needed'; }
    report.push(`| ${p.name} | ${p.id} | ${stripeMap} | ${notes} |`);
  }

  // 3. Customer-Subscription Matching
  console.log('\n📡 Sampling 5 subscriptions for customer matching...');
  const sample = activeSubs.sort(() => Math.random() - 0.5).slice(0, 5);

  report.push('\n## 3. Customer-Subscription Matching (5 samples)\n');
  report.push('| # | WC Customer ID | Email | Supabase Match | wp_user_id Match |');
  report.push('|---|----------------|-------|----------------|------------------|');

  for (let i = 0; i < sample.length; i++) {
    const sub = sample[i];
    const customerId = sub.customer_id;
    const email = sub.billing?.email || 'unknown';

    // Search Supabase for matching email
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, wp_user_id')
      .eq('email', email)
      .limit(1);

    const profile = profiles?.[0];
    const supaMatch = profile ? 'YES' : 'NO';
    const wpMatch = profile?.wp_user_id === String(customerId) ? 'YES' :
      profile?.wp_user_id ? `NO (wp_user_id=${profile.wp_user_id})` : 'MISSING';

    report.push(`| ${i + 1} | ${customerId} | ${email} | ${supaMatch} | ${wpMatch} |`);
  }

  // 4. Stripe ID Check
  console.log('\n📡 Checking Stripe IDs on sampled subscriptions...');
  report.push('\n## 4. Stripe ID Availability\n');
  report.push('| # | WC Sub ID | Stripe Customer ID | Stripe Sub ID | Valid? |');
  report.push('|---|-----------|-------------------|---------------|--------|');

  for (let i = 0; i < sample.length; i++) {
    const sub = sample[i];
    const meta = sub.meta_data || [];
    const stripeCust = meta.find((m: any) => m.key === '_stripe_customer_id')?.value || '';
    const stripeSub = meta.find((m: any) => m.key === '_stripe_subscription_id')?.value || '';

    const custValid = stripeCust.startsWith('cus_') ? 'YES' : stripeCust ? `INVALID (${stripeCust})` : 'EMPTY';
    const subValid = stripeSub.startsWith('sub_') ? 'YES' : stripeSub ? `INVALID (${stripeSub})` : 'EMPTY';

    report.push(`| ${i + 1} | ${sub.id} | ${stripeCust || '-'} | ${stripeSub || '-'} | cust: ${custValid}, sub: ${subValid} |`);
  }

  // 5. Summary & Recommendations
  const totalActive = activeSubs.length;
  const hasStripeCustomer = sample.filter(s => {
    const meta = s.meta_data || [];
    return meta.some((m: any) => m.key === '_stripe_customer_id' && m.value?.startsWith('cus_'));
  }).length;

  report.push('\n## 5. Summary & Recommendations\n');
  report.push(`- **Total active subscriptions:** ${totalActive}`);
  report.push(`- **Unique products:** ${Object.keys(productCounts).length}`);
  report.push(`- **Billing periods:** ${Object.entries(billingPeriods).map(([k, v]) => `${k}: ${v}`).join(', ')}`);
  report.push(`- **Sample match rate (Supabase):** Check table above`);
  report.push(`- **Stripe ID availability (sample):** ${hasStripeCustomer}/${sample.length} have valid Stripe customer IDs`);
  report.push('\n### Migration Strategy Recommendations\n');
  report.push('1. **Email-based matching** is the primary key — WC billing email → Supabase profiles email');
  report.push('2. **wp_user_id validation** — verify that imported wp_user_ids match WC customer_ids');
  report.push('3. **Stripe ID migration** — if WC subscriptions have valid Stripe IDs, these can be used to link to existing Stripe customers rather than creating new ones');
  report.push('4. **Product mapping** — needs manual review for edge cases (schools, designations)');
  report.push('5. **Billing period** — ensure Stripe products match WC billing cycles');

  // Write report
  const reportDir = path.join(process.cwd(), '.planning', 'recon');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'woo-api-recon-2026-03-30.md');
  fs.writeFileSync(reportPath, report.join('\n'));
  console.log(`\n✅ Report saved to: ${reportPath}`);
}

main().catch(console.error);
