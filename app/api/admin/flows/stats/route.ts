import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import type { FlowResponseStatus } from '@/lib/flows/types'

export async function GET(request: Request) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const url = new URL(request.url)
  const idsParam = url.searchParams.get('ids')

  if (!idsParam) {
    return NextResponse.json({})
  }

  const ids = idsParam
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  if (ids.length === 0) {
    return NextResponse.json({})
  }

  const supabase = await createSupabaseServerClient()

  const { data: responses, error: queryError } = await supabase
    .from('flow_responses')
    .select('flow_id, status')
    .in('flow_id', ids)

  if (queryError) {
    return NextResponse.json({ error: 'Failed to fetch flow stats' }, { status: 500 })
  }

  // Aggregate counts per flow_id
  const stats: Record<string, { completed: number; inProgress: number }> = {}

  // Initialize all requested ids with zero counts
  for (const id of ids) {
    stats[id] = { completed: 0, inProgress: 0 }
  }

  for (const row of responses ?? []) {
    const flowId = row.flow_id as string
    const status = row.status as FlowResponseStatus
    if (!stats[flowId]) {
      stats[flowId] = { completed: 0, inProgress: 0 }
    }
    if (status === 'completed') {
      stats[flowId].completed++
    } else if (status === 'in_progress') {
      stats[flowId].inProgress++
    }
  }

  return NextResponse.json(stats)
}
