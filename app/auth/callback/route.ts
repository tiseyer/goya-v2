import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createSupabaseServerActionClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // If role query param exists (from register flow), store in user metadata
        if (role && role !== 'null') {
          await supabase.auth.updateUser({ data: { role } })
        }
      }
      // Redirect to next param (defaults to /dashboard)
      // Flow player handles onboarding display via login trigger
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // OAuth error — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
