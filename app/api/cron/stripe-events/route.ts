import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase/service'
import { logAuditEvent } from '@/lib/audit'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseService()

  // Fetch pending_cron events, limit 50 per run
  const { data: events, error } = await supabase
    .from('webhook_events')
    .select('id, stripe_event_id, event_type, payload')
    .eq('status', 'pending_cron')
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.error('[cron/stripe-events] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!events || events.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let processed = 0
  for (const event of events) {
    try {
      // Phase 10 stub: side-effects (emails, designation grants) will be implemented in later phases.
      // For now, mark as processed to clear the queue.
      console.log(`[cron/stripe-events] processing ${event.event_type} (${event.stripe_event_id})`)

      await supabase
        .from('webhook_events')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('id', event.id)

      processed++
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[cron/stripe-events] failed ${event.stripe_event_id}: ${message}`)
      await supabase
        .from('webhook_events')
        .update({ status: 'failed', error_message: message, processed_at: new Date().toISOString() })
        .eq('id', event.id)
    }
  }

  void logAuditEvent({
    category: 'system',
    action: 'system.cron_executed',
    description: `Stripe events cron: processed ${processed} of ${events.length} pending events`,
    metadata: { cron_job: 'stripe_events', processed, total_pending: events.length },
  })

  return NextResponse.json({ ok: true, processed })
}
