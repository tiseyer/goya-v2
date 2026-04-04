import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseService } from '@/lib/supabase/service'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const role = searchParams.get('role')
  const invite = searchParams.get('invite')

  console.log('[auth/callback] HIT', { code: code ? `${code.slice(0, 8)}...` : null, next, role, invite })
  console.log('[auth/callback] Cookies present:', request.cookies.getAll().map(c => c.name).join(', '))

  if (code) {
    // Build redirect response first so cookies can be set directly on it
    const redirectUrl = new URL(next, origin)
    let response = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('[auth/callback] exchangeCodeForSession:', error ? `ERROR: ${error.message}` : 'SUCCESS')
    if (!error) {
      // Set password reset pending cookie for recovery flow
      if (next === '/reset-password') {
        response.cookies.set('password_reset_pending', 'true', {
          httpOnly: false, // Must be readable client-side for clearing after password update
          sameSite: 'lax',
          path: '/',
          maxAge: 600, // 10 minutes safety net
          secure: process.env.NODE_ENV === 'production',
        })
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // If role query param exists (from register flow), store in user metadata
        if (role && role !== 'null') {
          await supabase.auth.updateUser({ data: { role } })
        }

        // If invite param exists, claim the faculty invite server-side (OAuth flow)
        if (invite) {
          try {
            const service = getSupabaseService()

            // Look up pending faculty invite by token
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: faculty } = await (service as any)
              .from('school_faculty')
              .select('id, school_id')
              .eq('invite_token', invite)
              .eq('status', 'pending')
              .is('profile_id', null)
              .maybeSingle()

            if (faculty) {
              const schoolId: string = faculty.school_id

              // Update school_faculty: link profile, activate, clear invited_email
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (service as any)
                .from('school_faculty')
                .update({
                  profile_id: user.id,
                  status: 'active',
                  invited_email: null,
                })
                .eq('id', faculty.id)

              // Update profiles: append school_id to faculty_school_ids
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { data: profile } = await (service as any)
                .from('profiles')
                .select('faculty_school_ids')
                .eq('id', user.id)
                .single()

              const currentIds: string[] = (profile?.faculty_school_ids as string[] | null) ?? []
              if (!currentIds.includes(schoolId)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (service as any)
                  .from('profiles')
                  .update({ faculty_school_ids: [...currentIds, schoolId] })
                  .eq('id', user.id)
              }
            }
          } catch (err) {
            console.error('[auth/callback] invite claim error:', err)
          }
        }
      }

      // Audit: log registration or login via OAuth
      const isNewUser = role && role !== 'null'
      void logAuditEvent({
        category: 'user',
        action: isNewUser ? 'user.registered' : 'user.login',
        actor_id: user!.id,
        actor_name: user!.email ?? undefined,
        description: isNewUser
          ? `New user registered via OAuth (role: ${role})`
          : 'User logged in via OAuth',
        metadata: {
          ...(isNewUser && role ? { role } : {}),
          ...(invite ? { invite_claimed: true } : {}),
        },
      })

      // Return the response that has session cookies set on it
      console.log('[auth/callback] Redirecting to:', redirectUrl.toString())
      return response
    } else {
      console.error('[auth/callback] Code exchange failed:', error.message)
    }
  }

  // OAuth error — redirect to sign-in with error
  return NextResponse.redirect(new URL('/sign-in?error=auth_callback_error', origin))
}
