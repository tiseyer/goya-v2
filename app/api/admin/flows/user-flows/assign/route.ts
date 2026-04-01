import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { getSupabaseService } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { userId, flowId, markComplete } = body as {
    userId?: string
    flowId?: string
    markComplete?: boolean
  }

  if (!userId || !flowId) {
    return NextResponse.json({ error: 'userId and flowId are required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  // Validate flow exists
  const { data: flow, error: flowError } = await supabase
    .from('flows')
    .select('id')
    .eq('id', flowId)
    .single()

  if (flowError || !flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  // Validate user exists
  const { data: userProfile, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single()

  if (userError || !userProfile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const upsertData = markComplete
    ? {
        flow_id: flowId,
        user_id: userId,
        status: 'completed' as const,
        started_at: now,
        completed_at: now,
        last_step_id: null,
        responses: {},
      }
    : {
        flow_id: flowId,
        user_id: userId,
        status: 'in_progress' as const,
        started_at: now,
        completed_at: null,
        last_step_id: null,
        responses: {},
      }

  const { data: result, error: upsertError } = await supabase
    .from('flow_responses')
    .upsert(upsertData, { onConflict: 'flow_id,user_id' })
    .select()
    .single()

  if (upsertError || !result) {
    return NextResponse.json({ error: 'Failed to assign flow' }, { status: 500 })
  }

  return NextResponse.json(result, { status: 201 })
}
