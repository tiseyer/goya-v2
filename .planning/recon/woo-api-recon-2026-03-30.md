# WooCommerce API Recon Report

**Date:** 2026-03-30
**Mode:** Read-only — no writes to Supabase

## 1. Subscription Overview

**Total active subscriptions:** 4971

*(Only active status fetched — other statuses skipped to avoid API timeout)*

### Products in Active Subscriptions

| Product ID | Name | Active Subs |
|------------|------|-------------|
| 3645 | Certified Teacher - GOYA-CYT200 - Certified Yoga Teacher 200 Hour | 3364 |
| 3644 | Student Practitioner | 1158 |
| 3639 | Wellness Practitioner | 380 |
| 3646 | Certified School - GOYA-CYS200 - Certified Yoga School 200 Hour | 24 |
| 964 | GOYA-CCEP® | 23 |
| 878 | GOYA-ECYT500® | 19 |
| 879 | GOYA-ECYT200® | 7 |
| 978 | GOYA-CYYS® | 2 |
| 972 | GOYA-CYS300® | 1 |
| 974 | GOYA-CCYS® | 1 |
| 976 | GOYA-CMS® | 1 |
| 979 | GOYA-CRYS® | 1 |

### Billing Period Distribution

| Period | Count |
|--------|-------|
| year | 4971 |

## 2. Product Mapping

### All WooCommerce Products

| ID | Name | Type | Price | Status |
|----|------|------|-------|--------|
| 22104 | Experience Years | variable | 0 | publish |
| 14036 | GOYA Giving Tree Donation | variable-subscription | 5 | publish |
| 13950 | GOYA Giving Tree Donation | simple | 0 | publish |
| 3646 | Certified School | variable-subscription | 40 | publish |
| 3645 | Certified Teacher | variable-subscription | 39 | publish |
| 3644 | Student Practitioner | subscription | 19 | publish |
| 3639 | Wellness Practitioner | subscription | 39 | publish |
| 3269 | GOYA-WP® | simple | 10.00 | publish |
| 979 | GOYA-CRYS® | subscription | 40 | publish |
| 978 | GOYA-CYYS® | subscription | 40 | publish |
| 976 | GOYA-CMS® | subscription | 40 | publish |
| 975 | GOYA-CPYS® | subscription | 40 | publish |
| 974 | GOYA-CCYS® | subscription | 40 | publish |
| 973 | GOYA-CYS500® | subscription | 40 | publish |
| 972 | GOYA-CYS300® | subscription | 40 | publish |
| 971 | GOYA-CYS200® | subscription | 40 | publish |
| 970 | GOYA-CRYT® | simple | 10 | publish |
| 969 | GOYA-CYYT® | simple | 10 | publish |
| 968 | GOYA-CCYT® | simple | 10 | publish |
| 967 | GOYA-CYT500® | simple | 15 | publish |
| 966 | GOYA-CYT200® | simple | 10 | publish |
| 965 | GOYA-CPYT® | simple | 10 | publish |
| 964 | GOYA-CCEP® | subscription | 10 | publish |
| 963 | GOYA-CAYT® | simple | 10 | publish |
| 962 | GOYA-CMT® | simple | 10 | publish |
| 879 | GOYA-ECYT200® | subscription | 10 | publish |
| 878 | GOYA-ECYT500® | subscription | 10 | publish |

### Proposed Stripe Mapping

| WC Product | WC ID | → Stripe Product | Notes |
|------------|-------|-----------------|-------|
| Experience Years | 22104 | ? | No clear mapping — manual review needed |
| GOYA Giving Tree Donation | 14036 | ? | No clear mapping — manual review needed |
| GOYA Giving Tree Donation | 13950 | ? | No clear mapping — manual review needed |
| Certified School | 3646 | School Designation | May need per-designation mapping |
| Certified Teacher | 3645 | GOYA Teacher Membership |  |
| Student Practitioner | 3644 | GOYA Student Membership |  |
| Wellness Practitioner | 3639 | GOYA Wellness Practitioner Membership |  |
| GOYA-WP® | 3269 | ? | No clear mapping — manual review needed |
| GOYA-CRYS® | 979 | ? | No clear mapping — manual review needed |
| GOYA-CYYS® | 978 | ? | No clear mapping — manual review needed |
| GOYA-CMS® | 976 | ? | No clear mapping — manual review needed |
| GOYA-CPYS® | 975 | ? | No clear mapping — manual review needed |
| GOYA-CCYS® | 974 | ? | No clear mapping — manual review needed |
| GOYA-CYS500® | 973 | ? | No clear mapping — manual review needed |
| GOYA-CYS300® | 972 | ? | No clear mapping — manual review needed |
| GOYA-CYS200® | 971 | ? | No clear mapping — manual review needed |
| GOYA-CRYT® | 970 | ? | No clear mapping — manual review needed |
| GOYA-CYYT® | 969 | ? | No clear mapping — manual review needed |
| GOYA-CCYT® | 968 | Designation Add-on |  |
| GOYA-CYT500® | 967 | Designation Add-on |  |
| GOYA-CYT200® | 966 | Designation Add-on |  |
| GOYA-CPYT® | 965 | ? | No clear mapping — manual review needed |
| GOYA-CCEP® | 964 | ? | No clear mapping — manual review needed |
| GOYA-CAYT® | 963 | ? | No clear mapping — manual review needed |
| GOYA-CMT® | 962 | ? | No clear mapping — manual review needed |
| GOYA-ECYT200® | 879 | Designation Add-on |  |
| GOYA-ECYT500® | 878 | Designation Add-on |  |

## 3. Customer-Subscription Matching (5 samples)

| # | WC Customer ID | Email | Supabase Match | wp_user_id Match |
|---|----------------|-------|----------------|------------------|
| 1 | 3927 | stephen.black9@live.com | YES | MISSING |
| 2 | 4451 | richard.bowers85@gmail.com | YES | MISSING |
| 3 | 4401 | joseph.jones22@live.com | YES | MISSING |
| 4 | 4395 | maria.patrick2@live.com | YES | MISSING |
| 5 | 6291 | rupalvmahajan@gmail.com | YES | MISSING |

## 4. Stripe ID Availability

| # | WC Sub ID | Stripe Customer ID | Stripe Sub ID | Valid? |
|---|-----------|-------------------|---------------|--------|
| 1 | 11629 | - | - | cust: EMPTY, sub: EMPTY |
| 2 | 12722 | - | - | cust: EMPTY, sub: EMPTY |
| 3 | 12621 | - | - | cust: EMPTY, sub: EMPTY |
| 4 | 12607 | - | - | cust: EMPTY, sub: EMPTY |
| 5 | 22449 | cus_TXCAIw8iU4qIaH | - | cust: YES, sub: EMPTY |

## 5. Summary & Recommendations

- **Total active subscriptions:** 4971
- **Unique products:** 12
- **Billing periods:** year: 4971
- **Sample match rate (Supabase):** Check table above
- **Stripe ID availability (sample):** 1/5 have valid Stripe customer IDs

### Migration Strategy Recommendations

1. **Email-based matching** is the primary key — WC billing email → Supabase profiles email
2. **wp_user_id validation** — verify that imported wp_user_ids match WC customer_ids
3. **Stripe ID migration** — if WC subscriptions have valid Stripe IDs, these can be used to link to existing Stripe customers rather than creating new ones
4. **Product mapping** — needs manual review for edge cases (schools, designations)
5. **Billing period** — ensure Stripe products match WC billing cycles