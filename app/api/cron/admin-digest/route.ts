import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email/send'
import { AdminInboxDigestEmail } from '@/app/emails/AdminInboxDigestEmail'
import * as React from 'react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Count pending verifications
  const { count: pendingVerifications } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  // Get admin emails
  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin')
    .not('email', 'is', null)

  const total = (pendingVerifications ?? 0)

  if (total === 0) {
    console.log('[cron] admin-digest: nothing to report')
    return NextResponse.json({ ok: true, message: 'Nothing to report' })
  }

  for (const admin of admins ?? []) {
    if (!admin.email) continue
    await sendEmail({
      to: admin.email,
      subject: `GOYA Admin: ${total} items need your attention`,
      template: React.createElement(AdminInboxDigestEmail, {
        pendingVerifications: pendingVerifications ?? 0,
        pendingCreditSubmissions: 0,
        pendingSchools: 0,
        contactFormSubmissions: 0,
      }),
      templateName: 'AdminInboxDigestEmail',
      replyTo: process.env.EMAIL_FROM ?? 'hello@globalonlineyogaassociation.org',
    })
  }

  return NextResponse.json({ ok: true, sent: admins?.length ?? 0 })
}
