# Technical Concerns

**Analysis Date:** 2026-03-23

---

## Critical Issues

**Checkout flow has no payment processing — orders are fake:**
- Issue: `app/checkout/page.tsx` collects order details, generates a random order number client-side, stores the "order" in `localStorage`, then redirects to a confirmation page. There is no Stripe integration, no server-side order record, no payment gateway of any kind. The "Place Order" button calls `await new Promise(r => setTimeout(r, 1500))` to simulate processing.
- Files: `app/checkout/page.tsx`, `app/order-confirmation/page.tsx`, `app/context/CartContext.tsx`
- Impact: Any user who completes checkout receives a confirmation page but no money is collected, no record is stored in the database, and no admin is notified. Uploaded documents at checkout are also never persisted anywhere (they are held in React state only and discarded on navigation).
- Fix approach: Integrate Stripe (or similar), create a server action that persists orders to an `orders` table, and store uploaded documents to Supabase Storage.

**`credits-expiring` cron job is a stub with no implementation:**
- Issue: `app/api/cron/credits-expiring/route.ts` contains only a comment: "This is a placeholder — adapt to your actual credits table structure". It does nothing but log and return `ok: true`.
- Files: `app/api/cron/credits-expiring/route.ts`
- Impact: Credits never expire automatically regardless of `expires_at` values in `credit_entries`. Users are never warned before credits expire.
- Fix approach: Implement actual expiry logic — query `credit_entries` where `expires_at` is within the next N days, notify affected users, and optionally mark entries as expired.

**`lib/members-data.ts` uses static mock data for the entire member directory:**
- Issue: The members page is powered by a large static TypeScript array of fictitious members with `randomuser.me` avatar photos hardcoded in `lib/members-data.ts`. This file is not connected to the `profiles` table in Supabase in any way.
- Files: `lib/members-data.ts`, `app/members/MapPanel.tsx`
- Impact: Real registered users do not appear in the member directory or map. The directory shows fake placeholder data to all users of a live platform.
- Fix approach: Replace with a Supabase query against `profiles` where `onboarding_completed = true`, paginated and filtered appropriately.

---

## Security Concerns

**`updateProfile` server action accepts arbitrary field updates — role elevation risk:**
- Issue: `app/profile/settings/actions.ts` passes `updates: Record<string, unknown>` directly to a Supabase `.update()` call with no field allowlist. A malicious or tampered client request could inject fields like `role`, `verification_status`, or `is_verified` into the update payload.
- Files: `app/profile/settings/actions.ts`
- Impact: Users could potentially self-promote their role (e.g. to `admin`) or self-verify their account by crafting a POST directly to the server action.
- Fix approach: Explicitly allowlist permitted fields (name, bio, social links, etc.) and strip all others before passing to Supabase. Priority: fix immediately.

**`submitCreditEntry` auto-approves all user-submitted credits:**
- Issue: `app/credits/actions.ts` inserts credit entries with `status: 'approved'` immediately, with no admin review step.
- Files: `app/credits/actions.ts:28`
- Impact: Users can award themselves unlimited approved credits for any credit type, undermining the integrity of the credit and certification system.
- Fix approach: Change to insert with `status: 'pending'` and require admin approval via the existing admin credits UI.

**Cron secret check is optional — routes are callable without auth if env var is absent:**
- Issue: Both cron routes check `if (process.env.CRON_SECRET && authHeader !== ...)`. If `CRON_SECRET` is not set in the environment, the `&&` short-circuits and the auth check is skipped entirely, making the endpoints publicly callable with no authentication.
- Files: `app/api/cron/admin-digest/route.ts:12`, `app/api/cron/credits-expiring/route.ts:6`
- Impact: Anyone can trigger cron jobs via a public HTTP GET, potentially spamming admin emails or executing scheduled logic on demand.
- Fix approach: Require the secret unconditionally — `if (authHeader !== \`Bearer ${process.env.CRON_SECRET}\`) return 401`. Fail closed, not open.

**Service role key falls back to anon key silently in production code:**
- Issue: Both `lib/email/send.ts` and `app/api/cron/admin-digest/route.ts` initialize a Supabase admin client using `process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`. If `SUPABASE_SERVICE_ROLE_KEY` is missing from a deployment, the code silently falls back to the anon key for privileged operations.
- Files: `lib/email/send.ts:10`, `app/api/cron/admin-digest/route.ts:7`
- Impact: Misconfigured deployments run with wrong permissions with no error surfaced. The correctly implemented pattern already exists in `lib/supabase/service.ts` which throws if the key is missing.
- Fix approach: Replace the `??` fallback with an explicit guard that throws, matching the pattern in `lib/supabase/service.ts`.

**Avatar upload trusts client-supplied MIME type with no server-side validation:**
- Issue: `app/api/avatar/route.ts` uses `file.type || 'image/jpeg'` as the content type with no server-side verification that the file is actually an image. The content type is supplied by the client and trusted unconditionally.
- Files: `app/api/avatar/route.ts:23`
- Impact: A user could upload a non-image file to the `avatars` storage bucket by spoofing the content type.
- Fix approach: Validate file magic bytes server-side, or enforce allowed MIME types in Supabase Storage bucket policies.

**`searchProfiles` uses the browser Supabase client — RLS is the only guard:**
- Issue: `lib/messaging.ts` imports from `./supabase` (the browser singleton) and performs ILIKE queries on all profiles. Profile visibility depends entirely on Supabase RLS being correctly configured.
- Files: `lib/messaging.ts:1`, `lib/messaging.ts:203-213`
- Recommendation: Audit RLS policies on the `profiles` table to ensure unauthenticated reads are blocked.

---

## Performance Concerns

**N+1 queries in `getConversations` — two DB round trips per conversation:**
- Issue: `lib/messaging.ts` `getConversations()` fetches all conversations, then for every conversation fires two additional Supabase queries in `Promise.all` — one for the last message, one for the unread count. With N conversations this produces 2N+2 total round trips.
- Files: `lib/messaging.ts:57-91`
- Impact: Conversation list load time scales linearly with conversation count. Each round trip is a separate HTTP call to Supabase.
- Fix approach: Use a Supabase RPC function or single SQL query with window functions to return last message and unread count in one call.

**`checkUserMeetsRequirements` fires one DB query per credit type:**
- Issue: `lib/credits.ts` `checkUserMeetsRequirements()` fetches all requirements, then calls `getCreditsInPeriod()` for each requirement separately via `Promise.all`. With 5 credit types this is 6 DB round trips per check.
- Files: `lib/credits.ts:101-128`
- Fix approach: Replace with a single aggregated query grouped by `credit_type`.

**Middleware makes up to 3 sequential Supabase profile queries per request:**
- Issue: `middleware.ts` can make up to 3 separate `.from('profiles').select(...)` calls in one request cycle: one for maintenance mode check, one for onboarding status, one for admin path check — in addition to `supabase.auth.getUser()`.
- Files: `middleware.ts`
- Impact: Added latency on every authenticated protected-path page load.
- Fix approach: Consolidate into a single profile query that returns `role` and `onboarding_completed` together, cached on the request.

**`getConversations` fetches all conversations with no pagination:**
- Issue: `lib/messaging.ts` queries all conversations for a user with no `.limit()`. For active users this grows unbounded over time.
- Files: `lib/messaging.ts:37-45`

---

## Technical Debt

**Duplicate files with space-numbered suffixes cluttering the repository:**
- Issue: Multiple files exist with names like `"AdminShell 2.tsx"`, `"AdminShell 3.tsx"`, `"page 2.tsx"`, `"page 3.tsx"`, `"layout 2.tsx"`, `"layout 3.tsx"`, `"types 2.ts"`, `"types 3.ts"` — these are editor-created duplicates that have been left untracked in the working tree.
- Files: `app/admin/components/AdminShell 2.tsx`, `app/admin/components/AdminShell 3.tsx`, `app/admin/dashboard/page 2.tsx`, `app/admin/dashboard/page 3.tsx`, `app/admin/settings/page 2.tsx`, `app/admin/settings/page 3.tsx`, `app/admin/users/AdminUsersFilters 2.tsx`, `app/admin/users/AdminUsersPagination 2.tsx`, `app/admin/users/AdminUsersTable 2.tsx`, `app/admin/users/page 2.tsx`, `app/admin/layout 2.tsx`, `app/admin/layout 3.tsx`, `lib/types 2.ts`, `lib/types 3.ts`, `app/forgot-password/page 2.tsx`, `app/reset-password/page 2.tsx`
- Impact: Confusing codebase navigation, risk of editing the wrong file, potential Next.js route resolution ambiguity.
- Fix approach: Delete all `* 2.tsx` / `* 3.tsx` files after confirming they are duplicates of their canonical counterparts.

**`sendEmail` function is deprecated but not removed:**
- Issue: `lib/email/send.ts` exports `sendEmail` marked `@deprecated Use sendEmailFromTemplate() instead.` with full implementation still present.
- Files: `lib/email/send.ts:13-71`
- Fix approach: Audit all callers, confirm migration to `sendEmailFromTemplate` is complete, then delete the deprecated function.

**Hardcoded production URLs in server-side code:**
- Issue: Several files hardcode `https://goya.community/...` and `support@goya.org` rather than reading from an env var for the base URL.
- Files: `app/api/cron/admin-digest/route.ts:47`, `app/api/email/onboarding-complete/route.ts:26`, `app/api/email/welcome/route.ts:26`, `app/order-confirmation/page.tsx:172`, `app/schools/[id]/settings/SchoolSettingsClient.tsx:259,265`
- Impact: Broken links in emails and UI when running in staging or preview deployments.
- Fix approach: Introduce `NEXT_PUBLIC_APP_URL` env var and use it consistently.

**`admin-digest` cron hardcodes zero for most metrics:**
- Issue: The admin digest email sends `pendingCredits: '0'`, `pendingSchools: '0'`, `pendingContacts: '0'` as literal strings regardless of actual data. Only `pendingVerifications` is actually queried.
- Files: `app/api/cron/admin-digest/route.ts:42-48`
- Impact: Admin digest emails are misleading — they always report zero pending items for credits, schools, and contacts even when there are real items awaiting review.

**Duplicate onboarding component directories with unclear canonical path:**
- Issue: Two parallel directories exist in the onboarding flow: `app/onboarding/components/` (containing `Step1MemberType.tsx`, `Step2Profile.tsx`, `Step3Documents.tsx`, `WelcomeStep.tsx`, `CompletionStep.tsx`) and `app/onboarding/steps/` (containing many more granular steps like `Step_MemberType.tsx`, `Step_FullName.tsx`, `Step_Username.tsx`, etc.). It is unclear which directory is canonical and actively rendered.
- Files: `app/onboarding/components/`, `app/onboarding/steps/`
- Fix approach: Audit the `OnboardingProvider.tsx` to determine which step components are actually mounted, then delete the unused directory.

**`console.log` calls left in production files:**
- Files with production `console.log`/`console.error`: `app/api/cron/admin-digest/route.ts`, `app/api/cron/credits-expiring/route.ts`, `app/dashboard/FeedPostCard.tsx`, `app/dashboard/PostComposer.tsx`, `app/dashboard/FeedView.tsx`, `app/events/page.tsx`, `lib/email/send.ts`
- Impact: Verbose production logs. `lib/email/send.ts` logs email recipient addresses: `console.log('[email] sent:', subject, 'to', recipient)`.

**Client-side `Math.random()` used for order number generation:**
- Issue: `app/checkout/page.tsx` generates order numbers using `Math.floor(Math.random() * chars.length)` — not cryptographically random, and generated entirely client-side.
- Files: `app/checkout/page.tsx:105-110`
- Impact: Currently cosmetic since no real orders are persisted, but would be a collision and integrity risk if orders are ever stored.

---

## Missing Features / Functional Gaps

**No email notification on new message:**
- `lib/messaging.ts` `sendMessage()` creates an in-app `notifications` row but does not send an email. Users who are offline will not know they received a message.
- Files: `lib/messaging.ts:154-162`

**No rate limiting on messaging or profile search:**
- `searchProfiles` in `lib/messaging.ts` hits the database on every query change (with a 2-char minimum). No server-side rate limiting exists on message sends or search queries.
- Files: `lib/messaging.ts:203-213`, `app/messages/page.tsx`

**Onboarding does not handle the `school` member type in the unified flow:**
- `app/onboarding/lib/submitOnboarding.ts` handles `student`, `teacher`, and `wellness_practitioner`. School creation lives in a separate flow at `app/schools/create/`. There is no unified onboarding path for school owners, and the two flows are not coordinated.
- Files: `app/onboarding/lib/submitOnboarding.ts`, `app/schools/create/`

**`lib/messaging.ts` cannot be used in server components:**
- The messaging library imports the browser Supabase singleton at module level, making it impossible to call from server actions or server components. All messaging logic must be client-side.
- Files: `lib/messaging.ts:1`

---

## Infrastructure Concerns

**No error monitoring configured:**
- No Sentry, Datadog, or equivalent error tracking is detected. Errors in server actions, cron jobs, and API routes are only logged to console (Vercel logs). Silent failures — failed email sends, broken cron jobs, crashed server actions — go unnoticed unless logs are actively monitored.

**Only one test file exists for the entire codebase:**
- `app/page.test.tsx` covers only the home page's logged-in/logged-out rendering using Vitest. There is zero test coverage for auth flows, onboarding, messaging, credits, checkout, admin actions, server actions, or any business logic.
- Files: `app/page.test.tsx`
- Impact: Regressions in any non-trivial feature will go undetected until a user reports them.

---

## Recommended Priorities

1. **Fix `updateProfile` field allowlist** (`app/profile/settings/actions.ts`) — a user can currently self-assign the admin role. Immediate security fix.

2. **Fix credit entry auto-approval** (`app/credits/actions.ts`) — change `status: 'approved'` to `status: 'pending'` to prevent users from self-awarding credits.

3. **Harden cron secret enforcement** — remove the conditional `&&` so cron endpoints always require auth. Low effort, high impact.

4. **Fix service role key fallback** — replace `SUPABASE_SERVICE_ROLE_KEY ?? ANON_KEY` with a hard failure in `lib/email/send.ts` and `app/api/cron/admin-digest/route.ts`.

5. **Delete duplicate files** — remove all `* 2.tsx` / `* 3.tsx` files to prevent confusion and potential routing issues.

6. **Implement real checkout/payment** — the current flow collects user intent but no payment. This is the largest functional gap for a commercial platform.

7. **Replace static member directory** — connect `app/members/` to the actual `profiles` table instead of the hardcoded mock array in `lib/members-data.ts`.

---

*Concerns audit: 2026-03-23*
