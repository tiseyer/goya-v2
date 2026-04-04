import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import VerifyDeviceClient from './VerifyDeviceClient'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
}

export default async function VerifyDevicePage() {
  const cookieStore = await cookies()

  // If cookie is absent, user has no pending verification — send to sign-in
  const pendingCookie = cookieStore.get('device_pending_verification')
  if (!pendingCookie?.value) {
    redirect('/sign-in')
  }

  // Build Supabase server client with cookie adapter
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll() {
          // Read-only in server components
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // Fetch email from profiles table; fall back to auth user email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  const rawEmail: string = profile?.email ?? user.email ?? ''
  const maskedEmail = rawEmail ? maskEmail(rawEmail) : ''

  return (
    <div className="min-h-screen bg-[#1e2e56] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/GOYA Logo White.png" alt="GOYA" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">New Device Detected</h1>
          <p className="text-slate-400 text-sm mt-1">
            Verify your identity to continue
          </p>
        </div>

        <VerifyDeviceClient maskedEmail={maskedEmail} />
      </div>
    </div>
  )
}
