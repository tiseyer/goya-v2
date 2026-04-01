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

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
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

  // --- Dispatch to handler ---
  let finalStatus: 'processed' | 'pending_cron' | 'failed' = 'processed'
  try {
    const result = await dispatchEvent(event)
    finalStatus = result?.status ?? 'processed'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown handler error'
    console.error(`[webhook] handler error for ${event.type}: ${message}`)
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
