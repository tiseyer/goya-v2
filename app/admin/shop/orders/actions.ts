'use server';
import 'server-only';

import { revalidatePath } from 'next/cache';
import { getSupabaseService } from '@/lib/supabase/service';

export async function bulkOrderAction(
  orderIds: string[],
  action: 'archive' | 'restore',
): Promise<{ success: boolean; error?: string }> {
  if (!orderIds.length) {
    return { success: false, error: 'No orders selected' };
  }

  const supabase = getSupabaseService();
  const newStatus = action === 'archive' ? 'archived' : 'active';

  const { error } = await supabase
    .from('stripe_orders')
    .update({ status: newStatus })
    .in('id', orderIds);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin/shop/orders');
  return { success: true };
}
