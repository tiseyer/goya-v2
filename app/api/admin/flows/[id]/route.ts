import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { getFlowWithSteps, updateFlow, deleteFlow } from '@/lib/flows/flow-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const { data, error: serviceError } = await getFlowWithSteps(id)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to fetch flow' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data, error: serviceError } = await updateFlow(id, body)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to update flow' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const { error: serviceError } = await deleteFlow(id)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
