import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/service'

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  // 1. Read guest_retention_days from chatbot_config
  const { data: config, error: configErr } = await supabase
    .from('chatbot_config')
    .select('guest_retention_days')
    .single()

  if (configErr || !config) {
    return NextResponse.json({ ok: false, error: 'No chatbot config found' }, { status: 500 })
  }

  const retentionDays = config.guest_retention_days ?? 30
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retentionDays)
  const cutoffISO = cutoff.toISOString()

  // 2. Find expired guest sessions (anonymous_id IS NOT NULL, user_id IS NULL, created_at < cutoff)
  const { data: expiredSessions, error: sessErr } = await supabase
    .from('chat_sessions')
    .select('id')
    .not('anonymous_id', 'is', null)
    .is('user_id', null)
    .lt('created_at', cutoffISO)

  if (sessErr) {
    return NextResponse.json({ ok: false, error: sessErr.message }, { status: 500 })
  }

  const sessionIds = (expiredSessions ?? []).map((s: { id: string }) => s.id)

  if (sessionIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 })
  }

  // 3. Delete messages first (CASCADE should handle this, but be explicit)
  await supabase
    .from('chat_messages')
    .delete()
    .in('session_id', sessionIds)

  // 4. Delete associated support tickets
  await supabase
    .from('support_tickets')
    .delete()
    .in('session_id', sessionIds)

  // 5. Delete the sessions themselves
  const { error: delErr } = await supabase
    .from('chat_sessions')
    .delete()
    .in('id', sessionIds)

  if (delErr) {
    return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 })
  }

  console.log(`[cron] chatbot-cleanup: purged ${sessionIds.length} expired guest sessions`)

  return NextResponse.json({ ok: true, deleted: sessionIds.length })
}
