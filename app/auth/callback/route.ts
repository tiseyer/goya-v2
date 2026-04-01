import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const role = searchParams.get('role')
  const invite = searchParams.get('invite')

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

      // Redirect to next param (defaults to /dashboard)
      // Flow player handles onboarding display via login trigger
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // OAuth error — redirect to sign-in with error
  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_error`)
}
