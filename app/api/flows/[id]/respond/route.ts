import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { recordStepResponse } from '@/lib/flows/engine';
import type { FlowStepAction } from '@/lib/flows/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth: require authenticated user
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Parse body
  let body: { step_id?: string; answers?: Record<string, unknown>; actions?: FlowStepAction[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.step_id) {
    return NextResponse.json({ error: 'Missing required field: step_id' }, { status: 400 });
  }

  const result = await recordStepResponse(
    user.id,
    id,
    { step_id: body.step_id, answers: body.answers ?? {} },
    { actions: body.actions, userEmail: user.email ?? '' }
  );

  if (result.error || !result.data) {
    const message = result.error instanceof Error ? result.error.message : 'Flow response not found';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(
    {
      response: result.data,
      ...(result.actionResults && { actionResults: result.actionResults }),
    },
    { status: 200 }
  );
}
