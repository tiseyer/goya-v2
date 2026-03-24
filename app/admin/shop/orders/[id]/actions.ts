'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { getStripe } from '@/lib/stripe/client';
import { getSupabaseService } from '@/lib/supabase/service';

export async function refundOrder(
  paymentIntentId: string,
  amountCents?: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await getStripe().refunds.create({
      payment_intent: paymentIntentId,
      ...(amountCents !== undefined ? { amount: amountCents } : {}),
    });
    revalidatePath('/admin/shop/orders');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  mode: 'schedule' | 'immediate',
): Promise<{ success: boolean; error?: string }> {
  try {
    if (mode === 'schedule') {
      await getStripe().subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    } else {
      await getStripe().subscriptions.cancel(subscriptionId);
    }
    revalidatePath('/admin/shop/orders');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function resendInvoice(
  invoiceId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await getStripe().invoices.sendInvoice(invoiceId);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}

export async function getInvoicePdfUrl(invoiceId: string): Promise<string | null> {
  const invoice = await getStripe().invoices.retrieve(invoiceId);
  return invoice.invoice_pdf ?? null;
}

export async function createManualOrder(data: {
  userId: string;
  productId: string;
  stripeProductId: string;
  stripePriceId: string;
  priceType: 'one_time' | 'recurring';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseService();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', data.userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: profileError?.message ?? 'User not found' };
    }

    let stripeCustomerId = profile.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: profile.email ?? undefined,
        name: profile.full_name ?? undefined,
        metadata: { goya_user_id: data.userId },
      });
      stripeCustomerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', data.userId);
    }

    if (data.priceType === 'one_time') {
      await getStripe().paymentIntents.create({
        amount: 0, // amount determined by price, admin would specify or fetch from price
        currency: 'usd',
        customer: stripeCustomerId,
        metadata: { goya_user_id: data.userId, goya_product_id: data.productId },
      });
    } else {
      await getStripe().subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: data.stripePriceId }],
        metadata: { goya_user_id: data.userId, goya_product_id: data.productId },
      });
    }

    revalidatePath('/admin/shop/orders');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: message };
  }
}
