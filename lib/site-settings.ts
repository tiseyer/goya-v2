import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

let _admin: ReturnType<typeof createClient<Database>> | null = null
function getAdmin() {
  if (!_admin) {
    _admin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _admin
}

/**
 * Read a single site_settings value. Returns null if not found.
 */
export async function getSiteSetting(key: string): Promise<string | null> {
  const { data } = await getAdmin()
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()
  return data?.value ?? null
}

/**
 * Check if a feature sandbox is active.
 */
export async function isSandboxActive(key: string): Promise<boolean> {
  const value = await getSiteSetting(key)
  return value === 'true'
}
