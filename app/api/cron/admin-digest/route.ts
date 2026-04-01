import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailFromTemplate } from '@/lib/email/send'
import type { Database } from '@/types/supabase'

function getSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

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
    await sendEmailFromTemplate({
      to: admin.email,
      templateKey: 'admin_digest',
      variables: {
        count: String(total),
        pendingVerifications: String(pendingVerifications ?? 0),
        pendingCredits: '0',
        pendingSchools: '0',
        pendingContacts: '0',
        inboxUrl: 'https://goya.community/admin/inbox',
      },
    })
  }

  return NextResponse.json({ ok: true, sent: admins?.length ?? 0 })
}
