import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'
import { OnboardingCompleteEmail } from '@/app/emails/OnboardingCompleteEmail'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import * as React from 'react'

export async function POST(req: Request) {
  try {
    const { userId, memberType } = await req.json()
    const supabase = await createSupabaseServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name')
      .eq('id', userId)
      .single()

    if (!profile?.email) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there'
    const subject = memberType === 'student' ? 'Your GOYA profile is live!' : 'Your registration is under review'

    await sendEmail({
      to: profile.email,
      subject,
      template: React.createElement(OnboardingCompleteEmail, { firstName, memberType }),
      templateName: 'OnboardingCompleteEmail',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
