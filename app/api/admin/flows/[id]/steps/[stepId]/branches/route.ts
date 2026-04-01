import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { upsertBranches } from '@/lib/flows/step-service'
import { getFlowWithSteps } from '@/lib/flows/flow-service'
import { detectCycle } from '@/lib/flows/cycle-detection'
import type { UpsertBranchInput, FlowBranch } from '@/lib/flows/types'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id, stepId } = await params

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.branches)) {
    return NextResponse.json(
      { error: 'branches array required' },
      { status: 400 }
    )
  }

  const newBranches: UpsertBranchInput[] = body.branches

  // Cycle detection: fetch full flow graph, merge proposed branches, check for cycles
  const { data: flow, error: flowError } = await getFlowWithSteps(id)

  if (flowError || !flow) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  // Build merged branch list: all existing branches except those for this step,
  // then add the incoming branches for this step
  const existingBranches: FlowBranch[] = flow.steps.flatMap((s) => s.branches)
  const otherBranches = existingBranches.filter((b) => b.step_id !== stepId)
  const mergedBranches: FlowBranch[] = [
    ...otherBranches,
    // Cast incoming branches — they have the same shape but without id
    ...(newBranches.map((b) => ({ ...b, id: '' })) as FlowBranch[]),
  ]

  const cycleResult = detectCycle(flow.steps, mergedBranches)

  if (cycleResult.hasCycle) {
    return NextResponse.json(
      {
        error: 'Cycle detected in branch graph',
        cyclePath: cycleResult.cyclePath,
      },
      { status: 422 }
    )
  }

  // No cycle — persist the branches
  const { data, error: serviceError } = await upsertBranches(stepId, newBranches)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to save branches' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}
