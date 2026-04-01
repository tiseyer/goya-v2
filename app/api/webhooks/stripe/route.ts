import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import Stripe from 'stripe'
import { getSupabaseService } from '@/lib/supabase/service'
import { handleProduct } from '@/lib/stripe/handlers/product'
import { handlePrice } from '@/lib/stripe/handlers/price'
import { handleCoupon } from '@/lib/stripe/handlers/coupon'
import { handleSubscription } from '@/lib/stripe/handlers/subscription'
import { handlePaymentIntent } from '@/lib/stripe/handlers/payment-intent'
import { handleInvoice } from '@/lib/stripe/handlers/invoice'
import { handleCheckoutSession } from '@/lib/stripe/handlers/checkout-session'
import { logAuditEvent } from '@/lib/audit'
import type { HandlerResult } from '@/lib/stripe/handlers/subscription'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  // Try both Live and Sandbox webhook secrets — use whichever verifies
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_SANDBOX,
  ].filter(Boolean) as string[]

  if (secrets.length === 0) {
    return NextResponse.json(
      { error: 'No Stripe webhook secrets configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event | null = null
  for (const secret of secrets) {
    try {
      event = getStripe().webhooks.constructEvent(body, signature, secret)
      break
    } catch {
      // Try next secret
    }
  }

  if (!event) {
    return NextResponse.json(
      { error: 'Webhook signature verification failed against all configured secrets' },
      { status: 400 }
    )
  }

  // --- Idempotency gate: insert event before processing ---
  const supabase = getSupabaseService()
  const { error: insertError } = await supabase
    .from('webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: 'processing',
      payload: JSON.parse(JSON.stringify(event)),
    })

  // PostgreSQL unique_violation = duplicate event
  if (insertError?.code === '23505') {
    return NextResponse.json({ received: true }, { status: 200 })
  }
  if (insertError) {
    console.error(`[webhook] insert error: ${insertError.message}`)
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Audit: log webhook received
  void logAuditEvent({
    category: 'system',
    action: 'system.stripe_webhook_received',
    description: `Stripe webhook received: ${event.type}`,
    metadata: { event_type: event.type, stripe_event_id: event.id },
  })

  // --- Dispatch to handler ---
  let finalStatus: 'processed' | 'pending_cron' | 'failed' = 'processed'
  try {
    const result = await dispatchEvent(event)
    finalStatus = result?.status ?? 'processed'

    // Audit specific payment events
    if (event.type === 'payment_intent.succeeded') {
      const pi = (event.data.object as Stripe.PaymentIntent)
      void logAuditEvent({
        category: 'system',
        action: 'system.stripe_payment_succeeded',
        description: `Payment succeeded: ${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`,
        metadata: { amount: pi.amount, currency: pi.currency, customer: pi.customer as string },
      })
    } else if (event.type === 'payment_intent.payment_failed') {
      const pi = (event.data.object as Stripe.PaymentIntent)
      void logAuditEvent({
        category: 'system',
        action: 'system.stripe_payment_failed',
        severity: 'warning',
        description: `Payment failed: ${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`,
        metadata: { amount: pi.amount, currency: pi.currency, error: pi.last_payment_error?.message ?? 'unknown' },
      })
    } else if (event.type.startsWith('customer.subscription.')) {
      const sub = (event.data.object as Stripe.Subscription)
      const subAction = event.type.replace('customer.subscription.', '')
      void logAuditEvent({
        category: 'system',
        action: `system.stripe_subscription_${subAction}`,
        description: `Subscription ${subAction}: ${sub.id}`,
        metadata: { subscription_id: sub.id, status: sub.status, customer: sub.customer as string },
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown handler error'
    console.error(`[webhook] handler error for ${event.type}: ${message}`)

    void logAuditEvent({
      category: 'system',
      action: 'system.stripe_webhook_failed',
      severity: 'error',
      description: `Stripe webhook handler failed for ${event.type}: ${message}`,
      metadata: { event_type: event.type, stripe_event_id: event.id, error: message },
    })

    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error_message: message, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)
    return NextResponse.json({ received: true }, { status: 200 })
  }

  // --- Update event status ---
  await supabase
    .from('webhook_events')
    .update({ status: finalStatus, processed_at: new Date().toISOString() })
    .eq('stripe_event_id', event.id)

  return NextResponse.json({ received: true }, { status: 200 })
}

async function dispatchEvent(event: Stripe.Event): Promise<HandlerResult | void> {
  switch (event.type) {
    case 'product.created':
    case 'product.updated':
    case 'product.deleted':
      await handleProduct(event as Stripe.ProductCreatedEvent | Stripe.ProductUpdatedEvent | Stripe.ProductDeletedEvent)
      return
    case 'price.created':
    case 'price.updated':
    case 'price.deleted':
      await handlePrice(event as Stripe.PriceCreatedEvent | Stripe.PriceUpdatedEvent | Stripe.PriceDeletedEvent)
      return
    case 'coupon.created':
    case 'coupon.updated':
    case 'coupon.deleted':
      await handleCoupon(event as Stripe.CouponCreatedEvent | Stripe.CouponUpdatedEvent | Stripe.CouponDeletedEvent)
      return
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return await handleSubscription(event as any)
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
      return await handlePaymentIntent(event as any)
    case 'invoice.paid':
    case 'invoice.payment_failed':
      return await handleInvoice(event as any)
    case 'checkout.session.completed':
      return await handleCheckoutSession(event as Stripe.CheckoutSessionCompletedEvent)
    default:
      console.log(`[webhook] unhandled event type: ${event.type}`)
      return
  }
}
