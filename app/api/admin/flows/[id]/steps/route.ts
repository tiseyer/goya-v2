import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { listSteps, createStep } from '@/lib/flows/step-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const { data, error: serviceError } = await listSteps(id)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to list steps' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(
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

  const { data, error: serviceError } = await createStep({ ...body, flow_id: id })

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
