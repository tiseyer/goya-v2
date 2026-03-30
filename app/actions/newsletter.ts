'use server';

import { createSupabaseServerActionClient } from '@/lib/supabaseServer';

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from('newsletter_subscribers')
    .insert({ email, source: 'landing_page' } as any);

  if (error) {
    if (error.code === '23505') {
      // Unique constraint — already subscribed, treat as success
      return { success: true };
    }
    return { success: false, error: 'Something went wrong. Please try again.' };
  }

  return { success: true };
}
