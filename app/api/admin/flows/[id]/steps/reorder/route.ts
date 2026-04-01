import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { reorderSteps } from '@/lib/flows/step-service'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.stepIds) || body.stepIds.length === 0) {
    return NextResponse.json(
      { error: 'stepIds must be a non-empty array' },
      { status: 400 }
    )
  }

  const { error: serviceError } = await reorderSteps(id, body.stepIds as string[])

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to reorder steps' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
