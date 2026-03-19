import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. ONLY use server-side, NEVER import in browser/client components.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
