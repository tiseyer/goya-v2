import 'server-only'

import { NextResponse } from 'next/server'
import { requireFlowAdmin } from '@/lib/flows/admin-auth'
import { listFlows, createFlow } from '@/lib/flows/flow-service'
import type { Flow } from '@/lib/flows/types'

export async function GET(request: Request) {
  const { user, error } = await requireFlowAdmin()
  if (error) return error

  const url = new URL(request.url)
  const statusParam = url.searchParams.get('status') as Flow['status'] | null
  const isTemplateParam = url.searchParams.get('is_template')

  const params: { status?: Flow['status']; is_template?: boolean } = {}
  if (statusParam) params.status = statusParam
  if (isTemplateParam !== null) params.is_template = isTemplateParam === 'true'

  const { data, error: serviceError } = await listFlows(params)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to list flows' }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const { user, error } = await requireFlowAdmin()
  if (error) return error

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data, error: serviceError } = await createFlow(body, user.id)

  if (serviceError) {
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
