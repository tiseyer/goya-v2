import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Service role client — bypasses RLS. ONLY use server-side, NEVER import in browser/client components.
// Lazy-initialized to avoid crashing during Next.js build (env vars unavailable at module load time).

let _supabaseService: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseService() {
  if (!_supabaseService) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
    }
    _supabaseService = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    )
  }
  return _supabaseService
}
