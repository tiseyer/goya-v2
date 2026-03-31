import { getSupabaseService } from '@/lib/supabase/service';

/**
 * Fetch all site settings ordered alphabetically by key.
 * Per ADMN-01.
 */
export async function getAllSettings() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });

  return { data, error };
}

/**
 * Fetch a single site setting by key.
 * Per ADMN-03.
 */
export async function getSettingByKey(key: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('key', key)
    .single();

  return { data, error };
}

/**
 * Bulk-update multiple settings. Accepts a key-value map.
 * After all updates, returns the full current settings list.
 * Per ADMN-02.
 */
export async function updateSettings(updates: Record<string, string>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const entries = Object.entries(updates);

  for (const [key, value] of entries) {
    const { error } = await supabase
      .from('site_settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      return { data: null, error };
    }
  }

  return getAllSettings();
}

/**
 * Update a single setting by key.
 * Per ADMN-04.
 */
export async function updateSettingByKey(key: string, value: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('site_settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single();

  return { data, error };
}
