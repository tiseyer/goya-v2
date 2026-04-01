import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { getSupabaseService } from '@/lib/supabase/service'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { responseId } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  // Fetch the response first to get flow_id and user_id for action executions cleanup
  const { data: response, error: fetchError } = await supabase
    .from('flow_responses')
    .select('id, flow_id, user_id')
    .eq('id', responseId)
    .single()

  if (fetchError || !response) {
    return NextResponse.json({ error: 'Flow response not found' }, { status: 404 })
  }

  // Delete related action executions so they re-fire on re-display
  await supabase
    .from('flow_action_executions')
    .delete()
    .eq('flow_id', response.flow_id)
    .eq('user_id', response.user_id)

  // Delete the flow response itself
  const { error: deleteError } = await supabase
    .from('flow_responses')
    .delete()
    .eq('id', responseId)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to delete flow response' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { responseId } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body.status !== 'completed') {
    return NextResponse.json({ error: 'Only status=completed is supported' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  const { data: updated, error: updateError } = await supabase
    .from('flow_responses')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', responseId)
    .select()
    .single()

  if (updateError || !updated) {
    if (updateError?.code === 'PGRST116') {
      return NextResponse.json({ error: 'Flow response not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update flow response' }, { status: 500 })
  }

  return NextResponse.json(updated)
}
