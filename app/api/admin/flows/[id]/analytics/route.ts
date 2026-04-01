import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id: flowId } = await params
  const url = new URL(request.url)
  const from = url.searchParams.get('from') ?? new Date(0).toISOString()
  const to = url.searchParams.get('to') ?? new Date().toISOString()

  const supabase = await createSupabaseServerClient()

  // Fetch all analytics events for this flow in the date range
  const { data: events, error: eventsError } = await supabase
    .from('flow_analytics')
    .select('event, step_id, user_id')
    .eq('flow_id', flowId)
    .gte('created_at', from)
    .lte('created_at', to)

  if (eventsError) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }

  // Fetch flow steps for drop-off labels
  const { data: steps, error: stepsError } = await supabase
    .from('flow_steps')
    .select('id, position, title')
    .eq('flow_id', flowId)
    .order('position', { ascending: true })

  if (stepsError) {
    return NextResponse.json({ error: 'Failed to fetch flow steps' }, { status: 500 })
  }

  // Aggregate counts by event type
  const counts = {
    shown: 0,
    started: 0,
    completed: 0,
    skipped: 0,
    dismissed: 0,
  }

  // Track distinct users per step for drop-off
  const stepUserSets: Record<string, Set<string>> = {}

  for (const row of events ?? []) {
    const event = row.event as string
    const userId = row.user_id as string
    const stepId = row.step_id as string | null

    if (event === 'shown') counts.shown++
    else if (event === 'started') counts.started++
    else if (event === 'completed') counts.completed++
    else if (event === 'skipped') counts.skipped++
    else if (event === 'dismissed') counts.dismissed++
    else if (event === 'step_completed' && stepId) {
      if (!stepUserSets[stepId]) stepUserSets[stepId] = new Set()
      stepUserSets[stepId].add(userId)
    }
  }

  const completionRate = counts.shown > 0
    ? Math.round((counts.completed / counts.shown) * 1000) / 10
    : 0

  // Build drop-off array from steps, using started count for first step
  const stepsList = steps ?? []
  const dropoff = stepsList.map((step, index) => {
    let reached: number
    if (index === 0) {
      // First step: users who started the flow
      reached = counts.started
    } else {
      reached = stepUserSets[step.id]?.size ?? 0
    }
    return {
      stepId: step.id as string,
      position: step.position as number,
      title: step.title as string | null,
      reached,
    }
  })

  return NextResponse.json({
    counts,
    completionRate,
    dropoff,
  })
}
