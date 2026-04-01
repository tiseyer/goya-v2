# Phase 17: Upgrade Page (/upgrade) - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the multi-step /upgrade page: Step 1 (info), Step 2 (certificate upload to Supabase Storage), Step 3 (Stripe delayed capture checkout), Step 4 (success page). Handle checkout.session.completed webhook to create upgrade_request records.

</domain>

<decisions>
## Implementation Decisions

### Step 1 — Info
- Headline: "Upgrade to GOYA Certified Teacher"
- Explain what they get (teacher membership benefits)
- "Start Upgrade" button → Step 2
- Only accessible to student and wellness_practitioner roles

### Step 2 — Certificate Upload
- Upload 1-3 files
- Accepted formats: PDF, JPG, PNG, WEBP
- Max 4MB per file
- Store in Supabase Storage bucket: "upgrade-certificates/{user_id}/{timestamp}-{filename}"
- Show upload progress, file previews, remove button per file
- "Continue to Payment" button (disabled until at least 1 file uploaded)

### Step 3 — Stripe Checkout (delayed capture)
- Create Stripe Checkout Session with payment_intent_data.capture_method: "manual"
- Amount: Teacher Membership price ($39/yr from prod_UCTigELsOhovuE, price_1TE4kfDLfij4i9P9sUpSD2Si)
- Mode: "subscription" with payment_intent_data capture_method manual
- Actually: for subscriptions, use payment_behavior: "default_incomplete" + set pending state
- OR: Use mode: "payment" with capture_method: "manual" for one-time auth, then create subscription on approve
- Decision: Use mode: "payment" with capture_method: "manual" — simpler delayed capture. Subscription created on admin approval in Phase 18.
- success_url: /upgrade/success?session_id={CHECKOUT_SESSION_ID}
- cancel_url: /upgrade

### Webhook Handler (checkout.session.completed)
- On checkout.session.completed where metadata.type === "teacher_upgrade":
  - Create upgrade_request record: status "pending", user_id, certificate_urls from metadata, stripe_payment_intent_id
  - Do NOT change user role
  - Do NOT capture payment
  - Trigger admin notification (existing notification system)

### Step 4 — Success Page (/upgrade/success)
- "Your upgrade request has been submitted!"
- "Our team will verify your credentials within 48 hours."
- "You'll receive a notification once verified."
- Link back to Dashboard

### Claude's Discretion
- Multi-step UI pattern (URL steps vs client-side state)
- Exact card/form styling
- Upload progress indicator implementation
- How to pass certificate_urls to checkout metadata

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- lib/stripe/client.ts — getStripe() for Stripe API calls
- app/api/webhooks/stripe/route.ts — existing webhook handler to extend
- Supabase Storage — createSupabaseServerClient for uploads
- upgrade_requests table (Phase 19)

### Integration Points
- Phase 16 links to /upgrade from CTA
- Phase 18 reads upgrade_requests for admin actions
- Webhook route needs new handler for checkout.session.completed with teacher_upgrade metadata

</code_context>

<specifics>
## Specific Ideas

- Teacher Membership price: $39.00 (price_1TE4kfDLfij4i9P9sUpSD2Si from prod_UCTigELsOhovuE)
- Use Stripe Checkout Session with mode: "payment" and capture_method: "manual"
- Store certificate URLs in Supabase Storage, pass as metadata to Stripe checkout
- The Supabase Storage bucket "upgrade-certificates" may need to be created

</specifics>

<deferred>
## Deferred Ideas

- Admin approve/reject (Phase 18)
- Actual subscription creation (on admin approval in Phase 18)

</deferred>
