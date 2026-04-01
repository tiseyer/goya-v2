import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { getStepById, updateStep, deleteStep } from '@/lib/flows/step-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { stepId } = await params

  const { data, error: serviceError } = await getStepById(stepId)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to fetch step' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { stepId } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data, error: serviceError } = await updateStep(stepId, body)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Step not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { stepId } = await params

  const { error: serviceError } = await deleteStep(stepId)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
