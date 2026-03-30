import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { recordStepResponse } from '@/lib/flows/engine';

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
  let body: { step_id?: string; answers?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.step_id) {
    return NextResponse.json({ error: 'Missing required field: step_id' }, { status: 400 });
  }

  const { data, error } = await recordStepResponse(user.id, id, {
    step_id: body.step_id,
    answers: body.answers ?? {},
  });

  if (error || !data) {
    const message = error instanceof Error ? error.message : 'Flow response not found';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(data, { status: 200 });
}
