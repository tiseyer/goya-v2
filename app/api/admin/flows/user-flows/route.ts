import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { getSupabaseService } from '@/lib/supabase/service'
import type { FlowResponseStatus, FlowStatus } from '@/lib/flows/types'

export async function GET(request: Request) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId query param is required' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  const { data: responses, error: queryError } = await supabase
    .from('flow_responses')
    .select(`
      id,
      flow_id,
      status,
      started_at,
      completed_at,
      flows!inner(id, name, status)
    `)
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  if (queryError) {
    return NextResponse.json({ error: 'Failed to fetch user flow responses' }, { status: 500 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (responses ?? []).map((row: any) => ({
    id: row.id as string,
    flowId: row.flow_id as string,
    flowName: row.flows?.name as string,
    flowStatus: row.flows?.status as FlowStatus,
    status: row.status as FlowResponseStatus,
    startedAt: row.started_at as string | null,
    completedAt: row.completed_at as string | null,
  }))

  return NextResponse.json(result)
}
