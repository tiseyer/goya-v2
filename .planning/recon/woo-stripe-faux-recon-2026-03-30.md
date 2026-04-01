# WooCommerce Stripe/Faux User Recon

**Date:** 2026-03-30
**Mode:** Read-only

## 1. Subscriptions WITHOUT Stripe Customer ID (50 samples)

| Metric | Count | % |
|--------|-------|---|
| Faux/robit users | 39 | 78.0% |
| Real users (no faux in wp_roles) | 10 | 20.0% |
| No Supabase match | 1 | 2.0% |
| **Total sampled** | 50 | 100% |

### Real users without Stripe ID (potential problem cases)

| # | Email | WP Roles | Product |
|---|-------|----------|---------|
| 1 | guest1@seyer-marketing.de | teacher,bbp_participant,subscriber | Certified Teacher - GOYA-CYT200 - Certified Yoga Teacher 200 Hour |
| 2 | ai-bot-01@seyer-marketing.de | robot,student,bbp_participant,subscriber | Student Practitioner |
| 3 | ilina.valcheva21@gmail.com | student,bbp_participant,subscriber | Student Practitioner |
| 4 | beccaclarkzdancer@gmail.com | teacher,subscriber,bbp_participant | Certified Teacher - GOYA-CYT500 - Certified Yoga Teacher 500 Hour |
| 5 | joyeeta.network@gmail.com | student,subscriber | Student Practitioner |
| 6 | karen@barebonesyoga.com | teacher,bbp_participant,subscriber | Certified Teacher - GOYA-CYT200 - Certified Yoga Teacher 200 Hour |
| 7 | dromenvanger@gmail.com | student,subscriber | Student Practitioner |
| 8 | villegasdaniel009@gmail.com | student,bbp_participant,subscriber | Student Practitioner |
| 9 | amanda.hernandez65@live.com | student,subscriber | Student Practitioner |
| 10 | monica.buchanan99@live.com | student,bbp_participant,subscriber | Student Practitioner |

### No Supabase match (WC-only users)

| # | Email | WC Customer ID | Product |
|---|-------|----------------|---------|
| 1 | mlehegarate+11@hotmail.com | 5537 | Certified School - GOYA-CYS200 - Certified Yoga School 200 Hour |

## 2. Subscriptions WITH Stripe Customer ID (20 samples)

| Metric | Count | % |
|--------|-------|---|
| Faux/robit users | 0 | 0.0% |
| Real users | 18 | 90.0% |
| No Supabase match | 2 | 10.0% |
| **Total sampled** | 20 | 100% |

## 3. Estimated Totals (extrapolated from samples)

| Category | Estimated Count | Notes |
|----------|----------------|-------|
| Total active WC subs | 4971 | From previous recon |
| Subs WITH Stripe ID (~real) | ~994 | Migration candidates |
| Subs WITHOUT Stripe ID | ~3977 | Mostly faux |
| — of which faux/robit | ~3102 | 78% of no-Stripe sample |
| — of which real (problem cases) | ~875 | Need manual investigation |

## 4. Recommendations

1. **Faux users without Stripe = SKIP** — these are placeholder entries, not paying members
2. **Real users WITH Stripe ID = MIGRATE** — create Stripe subscriptions in new system using existing customer IDs
3. **Real users WITHOUT Stripe ID = INVESTIGATE** — may need manual outreach to set up payment
4. **Faux users WITH Stripe ID = ANOMALY** — should not exist, investigate if found
5. **Estimated migration scope: ~994 real subscriptions** (not 4971)