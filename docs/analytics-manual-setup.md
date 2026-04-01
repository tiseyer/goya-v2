# Analytics Manual Setup Guide

## Prerequisites

- Google Analytics 4 account with a property for GOYA
- Google Cloud project with Analytics Data API enabled
- Service account with Viewer access to the GA4 property

## 1. GA4 Property ID

1. Go to Google Analytics → Admin → Property Settings
2. Copy the numeric Property ID (e.g., `123456789`)
3. In GOYA Admin → Settings, add/update `ga4_property_id` with this value
4. Alternatively, add it directly to `site_settings` table

## 2. Service Account Key

1. Go to Google Cloud Console → IAM & Admin → Service Accounts
2. Create a service account (or use existing)
3. Grant the service account "Viewer" role on your GA4 property
   - GA4 → Admin → Property Access Management → Add → paste service account email
4. Create a JSON key for the service account
5. Set the entire JSON content as the `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable
   - In Vercel: Settings → Environment Variables → add `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Locally: add to `.env.local`

## 3. Configure Conversion Events in GA4

Mark these custom events as conversions in GA4 → Admin → Events → Mark as conversion:

| Event Name | Description |
|-----------|-------------|
| `sign_up` | New user registration |
| `purchase` | Completed payment |
| `onboarding_completed` | Finished onboarding wizard |
| `school_registration_completed` | School registered on platform |
| `course_enrolled` | User enrolled in a course |
| `designation_purchased` | Designation add-on purchased |

## 4. Verify Events Are Firing

1. Open your site in Chrome
2. Go to GA4 → Admin → DebugView
3. Open Chrome DevTools → Console
4. Perform actions (sign up, view course, etc.)
5. Events should appear in DebugView within seconds

Alternatively, check GA4 → Reports → Realtime to see events flowing.

## 5. Recommended GA4 Audiences

Create these audiences in GA4 → Admin → Audiences:

| Audience | Condition |
|----------|-----------|
| Teachers | `sign_up` event with `method` = any AND `onboarding_completed` with `role` = teacher |
| School Owners | `school_registration_completed` event |
| Active Members | Any event in last 7 days |
| Course Learners | `course_enrolled` event |
| Paying Users | `purchase` event |

## 6. Recommended Reports

Bookmark these in GA4:

- **Acquisition → User acquisition** — how users find GOYA
- **Engagement → Events** — all custom events with counts
- **Monetization → Ecommerce purchases** — purchase events with revenue
- **Retention → Overview** — returning vs new users
- **Demographics → Overview** — user location and language

## 7. Custom Events Reference

All events tracked by GOYA:

| Event | Parameters | Triggered When |
|-------|-----------|----------------|
| `sign_up` | method (email/google/apple) | User registers |
| `login` | method | User signs in |
| `onboarding_started` | role | Onboarding wizard opened |
| `onboarding_completed` | role | Onboarding wizard finished |
| `add_to_cart` | item_id, item_name, value, currency | Item added to cart |
| `begin_checkout` | value, currency, items | Checkout started |
| `purchase` | transaction_id, value, currency, items | Payment completed |
| `school_registration_started` | — | School creation wizard opened |
| `school_registration_completed` | school_name | School registered |
| `designation_viewed` | designation_code | Designation page viewed |
| `designation_purchased` | designation_code, value, currency | Designation bought |
| `event_viewed` | event_id, event_name | Event detail page viewed |
| `course_viewed` | course_id, course_name | Course detail page viewed |
| `course_enrolled` | course_id, course_name | User enrolled in course |
| `course_completed` | course_id, course_name | User completed course |
| `profile_updated` | — | Profile saved |
| `avatar_uploaded` | — | Avatar changed |
| `connection_requested` | — | Connection request sent |
| `connection_accepted` | — | Connection accepted |
| `search` | search_term, results_count | Search performed |
