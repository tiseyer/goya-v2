import { createBrowserClient } from '@supabase/ssr'

// createBrowserClient stores the session in cookies (not localStorage),
// so the Next.js middleware and server components can read the auth state.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

