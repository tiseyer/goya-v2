import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'
import { WelcomeEmail } from '@/app/emails/WelcomeEmail'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import * as React from 'react'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    const supabase = await createSupabaseServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name, mrn')
      .eq('id', userId)
      .single()

    if (!profile?.email) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there'

    await sendEmail({
      to: profile.email,
      subject: `Welcome to GOYA, ${firstName}!`,
      template: React.createElement(WelcomeEmail, { firstName, mrn: profile.mrn ?? '' }),
      templateName: 'WelcomeEmail',
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
