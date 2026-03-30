import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { duplicateFlow } from '@/lib/flows/flow-service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireFlowAdmin()
  if (error) return error

  const { id } = await params

  const { data, error: serviceError } = await duplicateFlow(id, user.id)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to duplicate flow' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  }

  return NextResponse.json(data, { status: 201 })
}
